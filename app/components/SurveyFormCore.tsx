"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion, TBranchCondition } from "./types";

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

interface SurveyFormCoreProps {
    survey: TSurvey;
    isPreview?: boolean;
    onSubmit?: (answers: Answer[], etcValues: Record<string, string>, respondentId?: string) => void | Promise<void>;
    onComplete?: () => void;
    completionTitle?: string;
    completionMessage?: string;
    submitButtonText?: string;
    initialData?: any;
    isEditMode?: boolean;
    redirectUrl?: string | null;
    email?: string;
    metadata?: any;
    audience?: string;
}

export default function SurveyFormCore({
    survey,
    isPreview = false,
    onSubmit,
    onComplete,
    completionTitle = "설문이 완료되었습니다!",
    completionMessage = "설문을 제출하시겠습니까?",
    submitButtonText = "설문 제출하기",
    initialData,
    isEditMode = false,
    redirectUrl,
    email,
    metadata,
    audience,
}: SurveyFormCoreProps) {
    const [currentPanel, setCurrentPanel] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>(() => {
        if (isEditMode && initialData?.answers) {
            // 기존 응답 데이터를 Answer[] 형태로 변환
            return Object.entries(initialData.answers).map(([questionId, value]) => ({
                questionId,
                value: value as string | string[] | Record<string, string>
            }));
        }
        return [];
    });
    const [etcValues, setEtcValues] = useState<Record<string, string>>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>('');
    const [respondentId, setRespondentId] = useState<string>(audience || email || '');
    const [isDuplicateResponse, setIsDuplicateResponse] = useState(false);
    const [existingResponse, setExistingResponse] = useState<any>(null);
    const [showResponseReview, setShowResponseReview] = useState(false);

    // 중복 응답 확인 함수
    const checkDuplicateResponse = React.useCallback(async (respondentIdToCheck: string) => {
        if (isPreview || !survey.id || survey.allow_duplicate_responses) {
            return false;
        }

        try {
            const response = await fetch(`/api/surveys/${survey.id}/responses/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    respondent: respondentIdToCheck,
                    email: survey.email_required ? respondentIdToCheck : undefined
                }),
            });

            if (response.ok) {
                const data = await response.json() as {
                    isDuplicate: boolean;
                    existingResponse?: any;
                    isNotAllowed?: boolean;
                    message?: string;
                };

                // 화이트리스트에 없는 경우 중복으로 처리 (접근 차단)
                if (data.isNotAllowed) {
                    return true; // 중복으로 처리하여 접근 차단
                }

                // 기존 응답이 있으면 저장
                if (data.isDuplicate && data.existingResponse) {
                    setExistingResponse(data.existingResponse);
                }

                return data.isDuplicate || false;
            }
            return false;
        } catch (error) {
            console.error('중복 확인 오류:', error);
            return false;
        } finally {
            // 에러 처리 완료
        }
    }, [survey.id, survey.allow_duplicate_responses, survey.email_required, isPreview]);


    // URL 파라미터나 initialRespondentId가 있는 경우 초기 중복 체크
    useEffect(() => {
        const checkInitialDuplicate = async () => {
            // 미리보기 모드이거나 중복 허용인 경우 체크하지 않음
            if (isPreview || survey.allow_duplicate_responses) {
                return;
            }

            // initialRespondentId가 있고, 익명이 허용되지 않는 경우 중복 체크
            if ((audience || email) && (audience || email)?.trim() && !survey.allow_anonymous) {
                const isDuplicate = await checkDuplicateResponse(audience || email || '');
                setIsDuplicateResponse(isDuplicate);

                // 중복인 경우 respondentId 설정 (중복 화면에서 표시하기 위해)
                if (isDuplicate) {
                    setRespondentId(audience || email || '');
                }
            }
        };

        checkInitialDuplicate();
    }, [audience, email, survey.allow_duplicate_responses, survey.allow_anonymous, isPreview, checkDuplicateResponse]);

    // 조건을 확인하는 함수
    const checkCondition = React.useCallback((condition: TBranchCondition): boolean => {
        const conditionAnswer = answers.find(a => a.questionId === condition.question_id);
        if (!conditionAnswer) {
            return false;
        }

        const conditionValue = conditionAnswer.value;
        let valueToCompare = conditionValue;

        // 복합 질문의 경우 특정 하위 항목 키의 값을 확인
        if (typeof conditionValue === 'object' && conditionValue !== null && condition.sub_key) {
            valueToCompare = (conditionValue as Record<string, string>)[condition.sub_key];
        }

        // multiple_choice의 경우 배열 처리를 위해 특별히 처리
        if (Array.isArray(conditionValue)) {
            const result = (() => {
                switch (condition.operator) {
                    case 'eq':
                        return conditionValue.includes(String(condition.value));
                    case 'neq':
                        return !conditionValue.includes(String(condition.value));
                    case 'contains':
                        return conditionValue.some(val => String(val).includes(String(condition.value)));
                    default:
                        return false; // 배열에서는 gt, lt, gte, lte 연산자 사용 불가
                }
            })();

            return result;
        }

        // 단일 값 처리
        switch (condition.operator) {
            case 'eq':
                return valueToCompare === condition.value;
            case 'neq':
                return valueToCompare !== condition.value;
            case 'contains':
                return String(valueToCompare).includes(String(condition.value));
            case 'gt':
                return Number(valueToCompare) > Number(condition.value);
            case 'lt':
                return Number(valueToCompare) < Number(condition.value);
            case 'gte':
                return Number(valueToCompare) >= Number(condition.value);
            case 'lte':
                return Number(valueToCompare) <= Number(condition.value);
            default:
                return false;
        }
    }, [answers]);

    // show_condition을 확인하는 함수
    const checkShowCondition = React.useCallback((question: TQuestion): boolean => {
        if (!question.is_hidden || !question.show_conditions || question.show_conditions.length === 0) {
            return true; // 조건이 없으면 항상 보여줌
        }

        // OR 조건: 하나라도 만족하면 보여줌
        for (const condition of question.show_conditions) {
            if (checkCondition(condition)) {
                return true; // 하나라도 조건이 만족되면 보여줌
            }
        }

        return false; // 모든 조건이 만족되지 않으면 보여주지 않음
    }, [checkCondition]);

    // show_condition을 만족하는 문항들만 필터링
    const [visibleQuestions, setVisibleQuestions] = useState<TQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<TQuestion | undefined>();

    useEffect(() => {
        const filtered = survey.questions.filter(checkShowCondition);
        setVisibleQuestions(filtered);

        // 현재 패널이 필터링된 문항 범위를 벗어나면 조정
        if (currentPanel >= filtered.length) {
            setCurrentPanel(Math.max(0, filtered.length - 1));
        }
    }, [answers, survey.questions, checkShowCondition, currentPanel]);

    useEffect(() => {
        setCurrentQuestion(visibleQuestions[currentPanel]);
    }, [visibleQuestions, currentPanel]);

    const handleAnswerChange = React.useCallback((questionId: string, value: string | string[] | Record<string, string>) => {
        setAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionId === questionId);
            if (existingIndex >= 0) {
                const newAnswers = [...prev];
                newAnswers[existingIndex] = { questionId, value };
                return newAnswers;
            }
            return [...prev, { questionId, value }];
        });
    }, []);

    // 현재 문항의 필수 응답 검증 함수
    const isCurrentQuestionValid = React.useCallback(() => {
        if (!currentQuestion) return true;

        // 필수 문항이 아니면 항상 유효
        if (!currentQuestion.required) return true;

        const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
        if (!currentAnswer) return false;

        // 문항 타입별 검증
        switch (currentQuestion.question_type) {
            case 'short_text':
            case 'long_text':
                return typeof currentAnswer.value === 'string' && currentAnswer.value.trim() !== '';

            case 'single_choice':
            case 'dropdown':
                if (typeof currentAnswer.value === 'string' && currentAnswer.value === 'etc') {
                    // 기타 선택 시 기타 값이 입력되어야 함
                    const hasEtcOption = currentQuestion.hasEtc || currentQuestion.options?.some(opt => opt.key === 'etc');
                    return hasEtcOption && etcValues[currentQuestion.id]?.trim() !== '';
                }
                return typeof currentAnswer.value === 'string' && currentAnswer.value !== '';

            case 'multiple_choice':
                if (Array.isArray(currentAnswer.value) && currentAnswer.value.length > 0) {
                    // 기타가 포함되어 있고 기타 값이 비어있으면 유효하지 않음
                    const hasEtcOption = currentQuestion.hasEtc || currentQuestion.options?.some(opt => opt.key === 'etc');
                    if (currentAnswer.value.includes('etc') && hasEtcOption && !etcValues[currentQuestion.id]?.trim()) {
                        return false;
                    }
                    return true;
                }
                return false;

            case 'composite_single':
            case 'composite_multiple':
                if (typeof currentAnswer.value === 'object' && currentAnswer.value !== null) {
                    const compositeAnswer = currentAnswer.value as Record<string, string>;
                    // 필수 항목들이 모두 입력되었는지 확인
                    return currentQuestion.composite_items?.every(item =>
                        item.required ? compositeAnswer[item.key]?.trim() !== '' : true
                    ) ?? false;
                }
                return false;

            case 'description':
                return true; // 안내문은 항상 유효

            default:
                return true;
        }
    }, [currentQuestion, answers, etcValues]);

    // 다음 패널을 결정하는 함수
    const getNextPanel = React.useCallback((currentAnswer: string | string[] | Record<string, string>): number => {
        const currentQuestion = visibleQuestions[currentPanel];

        // 0. 다음 문항 연결 체크 (가장 우선순위)
        if (currentQuestion.next_question_id) {
            const targetIndex = visibleQuestions.findIndex(q => q.id === currentQuestion.next_question_id);
            if (targetIndex !== -1) {
                return targetIndex;
            }
        }

        // 1. single_choice 옵션별 직접 이동 로직
        if (currentQuestion.question_type === "single_choice" && typeof currentAnswer === 'string') {
            const selectedOption = currentQuestion.options?.find(opt => opt.key === currentAnswer);

            if (selectedOption?.next_question_id) {
                const targetIndex = visibleQuestions.findIndex(q => q.id === selectedOption.next_question_id);
                if (targetIndex !== -1) {
                    return targetIndex;
                }
            }
        }

        // 2. composite_single 문항의 분기 로직
        if (currentQuestion.question_type === "composite_single" && typeof currentAnswer === 'object' && currentAnswer !== null) {
            // composite_single에서 입력된 항목들 중 next_question_id가 있는 항목 찾기
            for (const item of currentQuestion.composite_items || []) {
                const itemValue = (currentAnswer as Record<string, string>)[item.key];

                if (itemValue && itemValue.trim() !== '' && item.next_question_id) {
                    const targetIndex = visibleQuestions.findIndex(q => q.id === item.next_question_id);
                    if (targetIndex !== -1) {
                        return targetIndex;
                    }
                }
            }
        }

        // 3. 분기 로직 체크
        if (currentQuestion.branch_logic) {
            for (const logic of currentQuestion.branch_logic) {
                let allConditionsMet = true;

                for (const condition of logic.conditions) {
                    if (!checkCondition(condition)) {
                        allConditionsMet = false;
                        break;
                    }
                }

                if (allConditionsMet) {
                    const targetIndex = visibleQuestions.findIndex(q => q.id === logic.next_question_id);
                    if (targetIndex !== -1) {
                        return targetIndex;
                    }
                }
            }
        }

        // 기본적으로 다음 패널로 이동
        return currentPanel + 1;
    }, [currentPanel, visibleQuestions, checkCondition]);

    const handleNext = React.useCallback(() => {
        // 필수 문항 검증
        if (!isCurrentQuestionValid()) {
            alert('필수 문항을 응답해주세요.');
            return;
        }

        const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

        if (currentAnswer) {
            const nextPanel = getNextPanel(currentAnswer.value);

            if (nextPanel >= visibleQuestions.length) {
                setIsCompleted(true);
            } else {
                setCurrentPanel(nextPanel);
            }
        } else {
            // 답변이 없어도 다음 패널로 이동 (선택사항인 경우)
            const nextPanel = currentPanel + 1;

            if (nextPanel >= visibleQuestions.length) {
                setIsCompleted(true);
            } else {
                setCurrentPanel(nextPanel);
            }
        }
    }, [currentPanel, visibleQuestions.length, isCurrentQuestionValid, currentQuestion, answers, getNextPanel]);

    const handlePrevious = React.useCallback(() => {
        if (currentPanel > 0) {
            setCurrentPanel(currentPanel - 1);
        }
    }, [currentPanel]);

    // 설문 제출/완료 함수
    const handleSubmit = React.useCallback(async () => {
        if (onSubmit) {
            setIsSubmitting(true);
            setSubmitError('');

            try {
                await onSubmit(answers, etcValues, respondentId || undefined);

                if (isPreview) {
                    // 미리보기 모드에서는 onComplete 호출 (모달 표시를 위해)
                    if (onComplete) {
                        onComplete();
                    }
                } else {
                    // 실제 제출 모드에서는 redirectUrl이 있으면 리다이렉트, 없으면 제출 완료 화면 표시
                    if (redirectUrl) {
                        // tokenMetadata가 있으면 URL에 추가하여 리다이렉트
                        let finalRedirectUrl = redirectUrl;
                        if (metadata) {
                            const url = new URL(redirectUrl);
                            // metadata의 각 속성을 URL 파라미터로 추가
                            Object.entries(metadata).forEach(([key, value]) => {
                                if (value !== undefined && value !== null) {
                                    url.searchParams.set(key, String(value));
                                }
                            });
                            finalRedirectUrl = url.toString();
                        }
                        window.location.href = finalRedirectUrl;
                        return;
                    }

                    setIsSubmitted(true);
                    // 중복 허용이 되지 않는 설문의 경우 현재 응답을 existingResponse에 저장
                    if (!survey.allow_duplicate_responses) {
                        setExistingResponse({
                            answers: answers.reduce((acc, answer) => {
                                acc[answer.questionId] = answer.value;
                                return acc;
                            }, {} as Record<string, any>),
                            completed_at: new Date().toISOString(),
                            respondent: respondentId || null,
                            email: survey.email_required ? respondentId : null
                        });
                    }
                }
            } catch (error) {
                setSubmitError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
            } finally {
                setIsSubmitting(false);
            }
        } else if (onComplete) {
            onComplete();
        }
    }, [answers, etcValues, respondentId, onSubmit, onComplete, isPreview, survey.allow_duplicate_responses, survey.email_required, redirectUrl, metadata]);


    // 리셋 함수
    const handleReset = React.useCallback(() => {
        setIsCompleted(false);
        setIsSubmitted(false);
        setCurrentPanel(0);
        setAnswers([]);
        setEtcValues({});
        setSubmitError('');
        setIsDuplicateResponse(false);
        setExistingResponse(null);
        setShowResponseReview(false);
        if (!isPreview) {
            setRespondentId(audience || email || '');
        }
    }, [isPreview, audience, email]);

    // 중복 응답 화면
    if (isDuplicateResponse) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-yellow-50 px-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">이미 응답하셨습니다</h2>
                        <p className="text-gray-600 leading-relaxed">
                            해당 식별자로 이미 설문에 응답하셨습니다.<br />
                            {survey.allow_response_modification ?
                                (survey.allow_duplicate_responses ? '기존 응답을 수정하거나 새로 응답할 수 있습니다.' : '기존 응답을 수정할 수 있습니다.')
                                : '중복 응답은 허용되지 않습니다.'
                            }
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-yellow-800 font-semibold">응답자: {respondentId}</span>
                        </div>
                        {existingResponse && (
                            <div className="mt-4">
                                <p className="text-yellow-700 text-sm mb-3">
                                    응답 일시: {new Date(existingResponse.completed_at).toLocaleString('ko-KR')}
                                </p>
                            </div>
                        )}
                        <p className="text-yellow-700 text-sm">
                            {survey.allow_response_modification
                                ? (survey.allow_duplicate_responses
                                    ? '아래 버튼을 통해 기존 응답을 수정하거나 새로 응답할 수 있습니다.'
                                    : '아래 버튼을 통해 기존 응답을 수정할 수 있습니다.')
                                : '중복 응답이 허용되지 않아 추가 응답을 할 수 없습니다.'
                            }
                        </p>
                    </div>


                    <div className="text-center space-y-4">
                        {/* 수정 허용 시 버튼들 */}
                        {survey.allow_response_modification && existingResponse && !existingResponse.is_overwritten && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        // 수정 페이지로 리다이렉트
                                        const currentUrl = new URL(window.location.href);
                                        const editUrl = `/${survey.id}/edit/${existingResponse.id}${currentUrl.search}`;
                                        window.location.href = editUrl;
                                    }}
                                    className="w-full px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-all duration-200"
                                >
                                    기존 응답 수정하기
                                </button>
                                {survey.allow_duplicate_responses && (
                                    <button
                                        onClick={() => {
                                            // 새로 응답 시작
                                            setAnswers([]);
                                            setEtcValues({});
                                            setIsDuplicateResponse(false);
                                            setCurrentPanel(0);
                                        }}
                                        className="w-full px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-all duration-200"
                                    >
                                        새로 응답하기
                                    </button>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    }


    // 설문 제출 완료 화면
    if (isSubmitted) {
        // 응답 내용 확인 화면
        if (showResponseReview && existingResponse && existingResponse.answers) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl p-10">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">제출된 응답 내역</h1>
                            <p className="text-gray-600">
                                {new Date(existingResponse.completed_at).toLocaleString('ko-KR')}에 제출된 응답입니다.
                            </p>
                        </div>

                        <div className="space-y-6 max-h-96 overflow-y-auto mb-8">
                            {Object.entries(existingResponse.answers).map(([questionId, answer], index) => {
                                const question = survey.questions.find(q => q.id === questionId);
                                if (!question) return null;

                                return (
                                    <div key={index} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-3">{question.title}</h3>
                                        <div className="text-gray-700">
                                            {(() => {
                                                if (Array.isArray(answer)) {
                                                    return answer.map((item, idx) => (
                                                        <span key={idx} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                                                            {question.options?.find(opt => opt.key === item)?.label || item}
                                                        </span>
                                                    ));
                                                } else if (typeof answer === 'object' && answer !== null) {
                                                    return (
                                                        <div className="space-y-2">
                                                            {Object.entries(answer as Record<string, string>).map(([key, value]) => (
                                                                <div key={key} className="flex justify-between items-center bg-white p-3 rounded border">
                                                                    <span className="text-gray-600 font-medium">{key}:</span>
                                                                    <span className="text-gray-900">{value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                } else {
                                                    const displayValue = question.options?.find(opt => opt.key === answer)?.label || String(answer);
                                                    return <div className="bg-white p-3 rounded border text-gray-900">{displayValue}</div>;
                                                }
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="text-center">
                            <button
                                onClick={() => setShowResponseReview(false)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                돌아가기
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // 제출 완료 메인 화면
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4">
                <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
                    <div className="mb-10">
                        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">제출 완료!</h1>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            설문에 참여해 주셔서 감사합니다.<br />
                            소중한 의견이 잘 전달되었습니다.
                        </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-800 font-semibold">응답이 성공적으로 저장되었습니다</span>
                        </div>
                        <p className="text-green-700 text-sm">
                            제출하신 응답은 안전하게 보관되며, 추후 분석에 활용됩니다.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* 중복 허용이 되지 않는 설문의 경우 응답 확인 버튼만 표시 */}
                        {!survey.allow_duplicate_responses ? (
                            <button
                                onClick={() => setShowResponseReview(true)}
                                className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                제출한 응답 확인하기
                            </button>
                        ) : (
                            /* 중복 허용이 되는 설문의 경우 새로운 응답 작성 버튼 표시 */
                            <button
                                onClick={handleReset}
                                className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                새로운 응답 작성하기
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 설문 완료 확인 화면 (제출 전)
    if (isCompleted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">{completionTitle}</h2>
                        <p className="text-gray-600 leading-relaxed">{completionMessage}</p>
                    </div>

                    {submitError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm">{submitError}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`w-full px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${isSubmitting
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    처리 중...
                                </div>
                            ) : (
                                submitButtonText
                            )}
                        </button>

                        <button
                            onClick={handleReset}
                            disabled={isSubmitting}
                            className="w-full px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            처음부터 다시하기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center">
                <p>로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-center mb-2">{survey.title}</h1>
                {survey.description && (
                    <p className="text-gray-600 text-center">{survey.description}</p>
                )}
            </div>

            <div className="space-y-6">
                <div className="text-center mb-8">
                    <div className="text-sm text-gray-500 mb-2">
                        {currentPanel + 1} / {visibleQuestions.length}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentPanel + 1) / visibleQuestions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {currentQuestion.title}
                        </h2>
                        {currentQuestion.description && (
                            <p className="text-gray-600 text-sm">{currentQuestion.description}</p>
                        )}
                        {currentQuestion.required && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full ml-2">
                                필수
                            </span>
                        )}
                    </div>

                    {/* 문항 타입별 렌더링 */}
                    {currentQuestion.question_type === 'short_text' && (
                        <input
                            type="text"
                            value={answers.find(a => a.questionId === currentQuestion.id)?.value as string || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="답변을 입력하세요"
                        />
                    )}

                    {currentQuestion.question_type === 'long_text' && (
                        <textarea
                            value={answers.find(a => a.questionId === currentQuestion.id)?.value as string || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                            placeholder="답변을 입력하세요"
                        />
                    )}

                    {currentQuestion.question_type === 'single_choice' && currentQuestion.options && (
                        <div className="space-y-2">
                            {currentQuestion.options.map((option, index) => (
                                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={currentQuestion.id}
                                        value={option.key}
                                        checked={answers.find(a => a.questionId === currentQuestion.id)?.value === option.key}
                                        onChange={(e) => {
                                            handleAnswerChange(currentQuestion.id, e.target.value);
                                            if (option.key === 'etc') {
                                                setEtcValues(prev => ({
                                                    ...prev,
                                                    [currentQuestion.id]: ''
                                                }));
                                            }
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">{option.label}</span>
                                    {option.key === 'etc' && answers.find(a => a.questionId === currentQuestion.id)?.value === 'etc' && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[currentQuestion.id] || ''}
                                            onChange={(e) => {
                                                setEtcValues(prev => ({
                                                    ...prev,
                                                    [currentQuestion.id]: e.target.value
                                                }));
                                            }}
                                            className="flex-1 ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            ))}

                            {/* 기타 옵션 */}
                            {currentQuestion.hasEtc && !currentQuestion.options?.some(option => option.key === 'etc') && (
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={currentQuestion.id}
                                        value="etc"
                                        checked={answers.find(a => a.questionId === currentQuestion.id)?.value === 'etc'}
                                        onChange={(e) => {
                                            handleAnswerChange(currentQuestion.id, e.target.value);
                                            setEtcValues(prev => ({
                                                ...prev,
                                                [currentQuestion.id]: ''
                                            }));
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">기타</span>
                                    {answers.find(a => a.questionId === currentQuestion.id)?.value === 'etc' && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[currentQuestion.id] || ''}
                                            onChange={(e) => {
                                                setEtcValues(prev => ({
                                                    ...prev,
                                                    [currentQuestion.id]: e.target.value
                                                }));
                                            }}
                                            className="flex-1 ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            )}
                        </div>
                    )}

                    {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                        <div className="space-y-2">
                            {currentQuestion.options.map((option, index) => (
                                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={option.key}
                                        checked={(answers.find(a => a.questionId === currentQuestion.id)?.value as string[] || []).includes(option.key)}
                                        onChange={(e) => {
                                            const currentValues = answers.find(a => a.questionId === currentQuestion.id)?.value as string[] || [];
                                            if (e.target.checked) {
                                                handleAnswerChange(currentQuestion.id, [...currentValues, option.key]);
                                            } else {
                                                handleAnswerChange(currentQuestion.id, currentValues.filter(v => v !== option.key));
                                                if (option.key === 'etc') {
                                                    setEtcValues(prev => {
                                                        const newValues = { ...prev };
                                                        delete newValues[currentQuestion.id];
                                                        return newValues;
                                                    });
                                                }
                                            }
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">{option.label}</span>
                                    {option.key === 'etc' && (answers.find(a => a.questionId === currentQuestion.id)?.value as string[] || []).includes('etc') && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[currentQuestion.id] || ''}
                                            onChange={(e) => {
                                                setEtcValues(prev => ({
                                                    ...prev,
                                                    [currentQuestion.id]: e.target.value
                                                }));
                                            }}
                                            className="flex-1 ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            ))}

                            {/* 기타 옵션 */}
                            {currentQuestion.hasEtc && !currentQuestion.options?.some(option => option.key === 'etc') && (
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value="etc"
                                        checked={(answers.find(a => a.questionId === currentQuestion.id)?.value as string[] || []).includes('etc')}
                                        onChange={(e) => {
                                            const currentValues = answers.find(a => a.questionId === currentQuestion.id)?.value as string[] || [];
                                            if (e.target.checked) {
                                                handleAnswerChange(currentQuestion.id, [...currentValues, 'etc']);
                                            } else {
                                                handleAnswerChange(currentQuestion.id, currentValues.filter(v => v !== 'etc'));
                                                setEtcValues(prev => {
                                                    const newValues = { ...prev };
                                                    delete newValues[currentQuestion.id];
                                                    return newValues;
                                                });
                                            }
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">기타</span>
                                    {(answers.find(a => a.questionId === currentQuestion.id)?.value as string[] || []).includes('etc') && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[currentQuestion.id] || ''}
                                            onChange={(e) => {
                                                setEtcValues(prev => ({
                                                    ...prev,
                                                    [currentQuestion.id]: e.target.value
                                                }));
                                            }}
                                            className="flex-1 ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            )}
                        </div>
                    )}

                    {currentQuestion.question_type === 'dropdown' && currentQuestion.options && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    const dropdownId = `dropdown-${currentQuestion.id}`;
                                    const isOpen = document.getElementById(dropdownId)?.classList.contains('hidden');
                                    // 모든 드롭다운 닫기
                                    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
                                        dropdown.classList.add('hidden');
                                    });
                                    // 현재 드롭다운 토글
                                    if (isOpen) {
                                        document.getElementById(dropdownId)?.classList.remove('hidden');
                                    }
                                }}
                                onBlur={(e) => {
                                    setTimeout(() => {
                                        if (!e.currentTarget?.contains(document.activeElement)) {
                                            document.getElementById(`dropdown-${currentQuestion.id}`)?.classList.add('hidden');
                                        }
                                    }, 100);
                                }}
                                className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <span className="block truncate">
                                    {answers.find(a => a.questionId === currentQuestion.id)?.value
                                        ? currentQuestion.options?.find(opt => opt.key === answers.find(a => a.questionId === currentQuestion.id)?.value)?.label || '선택됨'
                                        : '선택하세요'
                                    }
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <svg
                                        className="h-5 w-5 text-gray-400 transition-transform duration-200"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </span>
                            </button>

                            <div
                                id={`dropdown-${currentQuestion.id}`}
                                className="custom-dropdown absolute z-10 mt-1 w-full hidden bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAnswerChange(currentQuestion.id, '');
                                        document.getElementById(`dropdown-${currentQuestion.id}`)?.classList.add('hidden');
                                    }}
                                    className="relative cursor-default select-none py-2 pl-3 pr-9 w-full text-left hover:bg-blue-600 hover:text-white"
                                >
                                    <span className="block truncate">선택하세요</span>
                                </button>

                                {currentQuestion.options.map((option, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            handleAnswerChange(currentQuestion.id, option.key);
                                            document.getElementById(`dropdown-${currentQuestion.id}`)?.classList.add('hidden');
                                        }}
                                        className="relative cursor-default select-none py-2 pl-3 pr-9 w-full text-left hover:bg-blue-600 hover:text-white"
                                    >
                                        <span className="block truncate">{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentQuestion.question_type === 'composite_single' && currentQuestion.composite_items && (
                        <div className="space-y-4">
                            {currentQuestion.composite_items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                                        {item.label}
                                        {item.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type={item.input_type === 'number' ? 'number' : 'text'}
                                        value={(answers.find(a => a.questionId === currentQuestion.id)?.value as Record<string, string>)?.[item.key] || ''}
                                        onChange={(e) => {
                                            const currentValues = answers.find(a => a.questionId === currentQuestion.id)?.value as Record<string, string> || {};
                                            handleAnswerChange(currentQuestion.id, {
                                                ...currentValues,
                                                [item.key]: e.target.value
                                            });
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={item.placeholder}
                                    />
                                    {item.unit && (
                                        <span className="text-sm text-gray-500">{item.unit}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {currentQuestion.question_type === 'composite_multiple' && currentQuestion.composite_items && (
                        <div className="space-y-4">
                            {currentQuestion.composite_items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                                        {item.label}
                                        {item.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type={item.input_type === 'number' ? 'number' : 'text'}
                                        value={(answers.find(a => a.questionId === currentQuestion.id)?.value as Record<string, string>)?.[item.key] || ''}
                                        onChange={(e) => {
                                            const currentValues = answers.find(a => a.questionId === currentQuestion.id)?.value as Record<string, string> || {};
                                            handleAnswerChange(currentQuestion.id, {
                                                ...currentValues,
                                                [item.key]: e.target.value
                                            });
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={item.placeholder}
                                    />
                                    {item.unit && (
                                        <span className="text-sm text-gray-500">{item.unit}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                    onClick={handlePrevious}
                    disabled={currentPanel === 0}
                    className={`px-6 py-2 rounded-lg transition-colors ${currentPanel === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    이전
                </button>

                <button
                    onClick={handleNext}
                    disabled={!isCurrentQuestionValid()}
                    className={`px-6 py-2 rounded-lg transition-colors ${isCurrentQuestionValid()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {currentPanel === visibleQuestions.length - 1 ? '완료' : '다음'}
                </button>
            </div>
        </div>
    );
}