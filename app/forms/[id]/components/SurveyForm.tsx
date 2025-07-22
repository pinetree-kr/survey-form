"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion, TBranchCondition } from "@/app/components";

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

interface SurveyFormProps {
    survey: TSurvey;
    initialRespondentId?: string;
}

export function SurveyForm({ survey, initialRespondentId }: SurveyFormProps) {
    const [currentPanel, setCurrentPanel] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [etcValues, setEtcValues] = useState<Record<string, string>>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string>('');
    const [respondentId, setRespondentId] = useState<string>(initialRespondentId || '');
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(!!initialRespondentId);
    const [emailError, setEmailError] = useState<string>('');

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

    // 설문 제출 함수
    const handleSubmit = React.useCallback(async () => {
        setIsSubmitting(true);
        setSubmitError('');

        try {
            // 응답자 ID 결정
            let finalRespondentId: string | undefined;
            
            // 이메일 입력이 필수인 경우
            if (survey.email_required) {
                finalRespondentId = respondentId;
            }
            // URL 파라미터가 허용된 경우
            else if (survey.allow_url_param && initialRespondentId) {
                finalRespondentId = initialRespondentId;
            }
            // 익명 응답이 허용된 경우
            else if (survey.allow_anonymous) {
                finalRespondentId = undefined;
            }

            // API로 응답 전송
            const response = await fetch(`/api/surveys/${survey.id}/responses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: answers.reduce((acc, answer) => {
                        acc[answer.questionId] = answer.value;
                        return acc;
                    }, {} as Record<string, any>),
                    respondent_id: finalRespondentId
                }),
            });

            if (response.ok) {
                // 성공 시 완료 페이지로 이동하거나 성공 메시지 표시
                alert('설문이 성공적으로 제출되었습니다!');
                // 여기서 성공 페이지로 리다이렉트하거나 상태를 변경할 수 있습니다
            } else {
                const errorData = await response.json() as { error?: string };
                setSubmitError(errorData.error || '알 수 없는 오류가 발생했습니다.');
            }
        } catch (error) {
            setSubmitError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    }, [survey, answers, respondentId, initialRespondentId]);

    // 이메일 유효성 검사 함수
    const validateEmail = React.useCallback((email: string): string => {
        if (!email.trim()) {
            return '이메일 주소를 입력해주세요.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return '유효한 이메일 주소를 입력해주세요.';
        }
        return '';
    }, []);

    // 이메일 입력 변경 핸들러
    const handleEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;
        setRespondentId(email);
        setEmailError(validateEmail(email));
    }, [validateEmail]);

    // 이메일 입력 UI (설문 시작 전)
    if (survey.email_required && !isEmailVerified) {
        const isEmailValid = !emailError && respondentId.trim() !== '';
        
        return (
            <div className="max-w-2xl mx-auto p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-center mb-2">{survey.title}</h1>
                    {survey.description && (
                        <p className="text-gray-600 text-center">{survey.description}</p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">이메일 주소 입력</h2>
                    <p className="text-gray-600 mb-4">
                        설문을 시작하기 전에 이메일 주소를 입력해주세요.
                    </p>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            이메일 주소 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={respondentId}
                            onChange={handleEmailChange}
                            onBlur={() => setEmailError(validateEmail(respondentId))}
                            placeholder="example@email.com"
                            className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${
                                emailError 
                                    ? 'border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            required
                        />
                        {emailError && (
                            <p className="mt-1 text-sm text-red-600">{emailError}</p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsEmailVerified(true)}
                            disabled={!isEmailValid}
                            className={`px-6 py-2 rounded-lg transition-colors ${
                                isEmailValid
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            설문 시작하기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">설문이 완료되었습니다!</h2>
                    <p className="text-gray-600">설문을 제출하시겠습니까?</p>
                </div>

                {submitError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{submitError}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-6 py-3 rounded-lg transition-colors ${
                            isSubmitting
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {isSubmitting ? '제출 중...' : '설문 제출하기'}
                    </button>

                    <button
                        onClick={() => {
                            setIsCompleted(false);
                            setCurrentPanel(0);
                            setAnswers([]);
                            setSubmitError('');
                        }}
                        disabled={isSubmitting}
                        className="px-6 py-3 ml-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        다시 시작하기
                    </button>
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

                    {currentQuestion.question_type === 'description' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <p className="text-blue-800 text-sm">
                                {currentQuestion.description || '안내 문구가 없습니다.'}
                            </p>
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