"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion, TBranchCondition } from "@/app/components";
import { ResponseJsonModal } from './ResponseJsonModal';


type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

export function SurveyFormPreview({ survey }: { survey: TSurvey }) {
    const [currentPanel, setCurrentPanel] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [etcValues, setEtcValues] = useState<Record<string, string>>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [respondentId, setRespondentId] = useState<string>('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
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
    }, [answers, survey.questions]);

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
                    // hasEtc가 true이거나 기존 옵션에 기타가 있는 경우
                    const hasEtcOption = currentQuestion.hasEtc || currentQuestion.options?.some(opt => opt.key === 'etc');
                    return hasEtcOption && etcValues[currentQuestion.id]?.trim() !== '';
                }
                return typeof currentAnswer.value === 'string' && currentAnswer.value !== '';

            case 'multiple_choice':
                if (Array.isArray(currentAnswer.value) && currentAnswer.value.length > 0) {

                    // 기타가 포함되어 있고 기타 값이 비어있으면 유효하지 않음
                    // hasEtc가 true이거나 기존 옵션에 기타가 있는 경우
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

    const handlePreviewSubmit = React.useCallback(() => {
        setShowResponseModal(true);
    }, []);

    // 응답 데이터를 준비하는 함수
    const prepareResponseData = React.useCallback(() => {
        // etcValues에서 값이 비어있는 키들을 제거
        const filteredEtcValues = Object.fromEntries(
            Object.entries(etcValues).filter(([key, value]) =>
                value && value.trim() !== ''
            )
        );

        const responseData = {
            survey_id: survey.id,
            survey_title: survey.title,
            response_time: new Date().toISOString(),
            respondent_id: survey.email_required ? respondentId : undefined,
            answers: answers.map(answer => {
                const question = survey.questions.find(q => q.id === answer.questionId);
                const etcValue = etcValues[answer.questionId];
                // etcValues가 존재하는 경우 처리
                let finalValue: any = answer.value;
                if (etcValue && etcValue.trim() !== '') {
                    if (Array.isArray(answer.value) || question?.question_type === 'multiple_choice') {
                        // 배열이거나 multiple_choice인 경우 기타 값을 추가
                        if (Array.isArray(answer.value)) {
                            finalValue = answer.value.map(v => v === 'etc' ? etcValue : v);
                        } else {
                            finalValue = [answer.value, etcValue];
                        }
                    } else if (question?.question_type === 'composite_multiple') {
                        // composite_multiple인 경우 기존 객체에 etc_value 필드 추가
                        finalValue = {
                            ...answer.value as Record<string, string>,
                            etc_value: etcValue
                        };
                    } else {
                        // 배열이 아닌 경우 기타 값으로 교체
                        finalValue = etcValue;
                    }
                }

                return {
                    question_id: answer.questionId,
                    question_title: question?.title || 'Unknown Question',
                    question_type: question?.question_type || 'unknown',
                    value: finalValue,
                };
            }),
            etc_values: filteredEtcValues,
            total_questions: survey.questions.length,
            answered_questions: answers.length,
            is_preview: true
        };
        return responseData;
    }, [survey, answers, etcValues, respondentId]);

    const renderQuestion = React.useCallback((question: TQuestion) => {
        const currentAnswer = answers.find(a => a.questionId === question.id);
        const isRequired = question.required;
        const hasError = isRequired && !isCurrentQuestionValid();


        return (
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
                            {question.title}
                        </h2>
                        {question.description && (
                            <p className="text-gray-600 text-sm">{question.description}</p>
                        )}
                        {question.required && (
                            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full ml-2">
                                필수
                            </span>
                        )}
                    </div>

                    {/* 문항 타입별 렌더링 */}
                    {question.question_type === 'short_text' && (
                        <input
                            type="text"
                            value={currentAnswer?.value as string || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${hasError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="답변을 입력하세요"
                        />
                    )}

                    {question.question_type === 'long_text' && (
                        <textarea
                            value={currentAnswer?.value as string || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 min-h-[100px] resize-none ${hasError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            placeholder="답변을 입력하세요"
                        />
                    )}

                    {question.question_type === 'single_choice' && question.options && (
                        <div className="space-y-2">
                            {question.options.map((option, index) => (
                                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={question.id}
                                        value={option.key}
                                        checked={currentAnswer?.value === option.key}
                                        onChange={(e) => {
                                            handleAnswerChange(question.id, e.target.value);
                                            // 기타 선택 시 etcValues 초기화 (빈 값으로 설정)
                                            if (option.key === 'etc') {
                                                setEtcValues(prev => ({
                                                    ...prev,
                                                    [question.id]: ''
                                                }));
                                            }
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">{option.label}</span>
                                    {option.key === 'etc' && currentAnswer?.value === 'etc' && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[question.id] || ''}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                setEtcValues(prev => {
                                                    const updated = {
                                                        ...prev,
                                                        [question.id]: newValue
                                                    };
                                                    return updated;
                                                });
                                            }}
                                            className={`flex-1 ml-2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 ${hasError && currentAnswer?.value === 'etc'
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            ))}

                            {/* 기타 옵션 */}
                            {question.hasEtc && !question.options?.some(option => option.key === 'etc') && (
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={question.id}
                                        value="etc"
                                        checked={currentAnswer?.value === 'etc'}
                                        onChange={(e) => {
                                            handleAnswerChange(question.id, e.target.value);
                                            // 기타 선택 시 etcValues 초기화 (빈 값으로 설정)
                                            setEtcValues(prev => ({
                                                ...prev,
                                                [question.id]: ''
                                            }));
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">기타</span>
                                    {currentAnswer?.value === 'etc' && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[question.id] || ''}
                                            onFocus={() => {
                                                console.log('단일선택 기타 input 포커스:', {
                                                    questionId: question.id,
                                                    currentValue: etcValues[question.id],
                                                    allEtcValues: etcValues
                                                });
                                            }}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                console.log('기타 값 변경:', {
                                                    questionId: question.id,
                                                    newValue: newValue,
                                                    currentEtcValues: etcValues
                                                });
                                                setEtcValues(prev => {
                                                    const updated = {
                                                        ...prev,
                                                        [question.id]: newValue
                                                    };
                                                    console.log('업데이트된 etcValues:', updated);
                                                    return updated;
                                                });
                                            }}
                                            className={`flex-1 ml-2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 ${hasError && currentAnswer?.value === 'etc'
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            )}
                        </div>
                    )}

                    {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-2">
                            {question.options.map((option, index) => (
                                <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={option.key}
                                        checked={(currentAnswer?.value as string[] || []).includes(option.key)}
                                        onChange={(e) => {
                                            const currentValues = currentAnswer?.value as string[] || [];
                                            if (e.target.checked) {
                                                handleAnswerChange(question.id, [...currentValues, option.key]);
                                            } else {
                                                handleAnswerChange(question.id, currentValues.filter(v => v !== option.key));
                                                // 기타 선택 해제 시 기타 값도 삭제
                                                if (option.key === 'etc') {
                                                    setEtcValues(prev => {
                                                        const newValues = { ...prev };
                                                        delete newValues[question.id];
                                                        return newValues;
                                                    });
                                                }
                                            }
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">{option.label}</span>
                                    {option.key === 'etc' && (currentAnswer?.value as string[] || []).includes('etc') && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[question.id] || ''}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                setEtcValues(prev => {
                                                    const updated = {
                                                        ...prev,
                                                        [question.id]: newValue
                                                    };
                                                    return updated;
                                                });
                                            }}
                                            className={`flex-1 ml-2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 ${hasError && (currentAnswer?.value as string[] || []).includes('etc')
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            ))}

                            {/* 기타 옵션 */}
                            {question.hasEtc && !question.options?.some(option => option.key === 'etc') && (
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value="etc"
                                        checked={(currentAnswer?.value as string[] || []).includes('etc')}
                                        onChange={(e) => {
                                            const currentValues = currentAnswer?.value as string[] || [];
                                            if (e.target.checked) {
                                                handleAnswerChange(question.id, [...currentValues, 'etc']);
                                            } else {
                                                handleAnswerChange(question.id, currentValues.filter(v => v !== 'etc'));
                                                // 기타 선택 해제 시 기타 값도 삭제
                                                setEtcValues(prev => {
                                                    const newValues = { ...prev };
                                                    delete newValues[question.id];
                                                    return newValues;
                                                });
                                            }
                                        }}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-900">기타</span>
                                    {(currentAnswer?.value as string[] || []).includes('etc') && (
                                        <input
                                            type="text"
                                            placeholder="기타 답변을 입력하세요"
                                            value={etcValues[question.id] || ''}

                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                console.log('다중선택 기타 값 변경:', {
                                                    questionId: question.id,
                                                    newValue: newValue,
                                                    currentEtcValues: etcValues
                                                });
                                                setEtcValues(prev => {
                                                    const updated = {
                                                        ...prev,
                                                        [question.id]: newValue
                                                    };
                                                    console.log('업데이트된 etcValues (다중선택):', updated);
                                                    return updated;
                                                });
                                            }}
                                            className={`flex-1 ml-2 px-3 py-1 border rounded-md focus:outline-none focus:ring-2 ${hasError && (currentAnswer?.value as string[] || []).includes('etc')
                                                ? 'border-red-500 focus:ring-red-500'
                                                : 'border-gray-300 focus:ring-blue-500'
                                                }`}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </label>
                            )}
                        </div>
                    )}

                    {question.question_type === 'dropdown' && question.options && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    const dropdownId = `dropdown-${question.id}`;
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
                                    // 포커스가 드롭다운 내부로 이동하는 경우를 위해 지연
                                    setTimeout(() => {
                                        if (!e.currentTarget?.contains(document.activeElement)) {
                                            document.getElementById(`dropdown-${question.id}`)?.classList.add('hidden');
                                        }
                                    }, 100);
                                }}
                                className={`relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 ${hasError
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                            >
                                <span className={`block truncate ${!currentAnswer?.value ? 'text-gray-500' : 'text-gray-900'}`}>
                                    {currentAnswer?.value
                                        ? question.options?.find(opt => opt.key === currentAnswer.value)?.label || '선택됨'
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
                                id={`dropdown-${question.id}`}
                                className="custom-dropdown absolute z-10 mt-1 w-full hidden bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleAnswerChange(question.id, '');
                                        document.getElementById(`dropdown-${question.id}`)?.classList.add('hidden');
                                    }}
                                    className={`relative cursor-default select-none py-2 pl-3 pr-9 w-full text-left hover:bg-blue-600 hover:text-white ${!currentAnswer?.value ? 'bg-blue-600 text-white' : 'text-gray-900'
                                        }`}
                                >
                                    <span className={`block truncate ${!currentAnswer?.value ? 'font-medium' : 'font-normal'}`}>
                                        선택하세요
                                    </span>
                                    {!currentAnswer?.value && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </button>

                                {question.options.map((option, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                            handleAnswerChange(question.id, option.key);
                                            document.getElementById(`dropdown-${question.id}`)?.classList.add('hidden');
                                        }}
                                        className={`relative cursor-default select-none py-2 pl-3 pr-9 w-full text-left hover:bg-blue-600 hover:text-white ${currentAnswer?.value === option.key ? 'bg-blue-600 text-white' : 'text-gray-900'
                                            }`}
                                    >
                                        <span className={`block truncate ${currentAnswer?.value === option.key ? 'font-medium' : 'font-normal'}`}>
                                            {option.label}
                                        </span>
                                        {currentAnswer?.value === option.key && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {question.question_type === 'composite_single' && question.composite_items && (
                        <div className="space-y-4">
                            {question.composite_items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                                        {item.label}
                                        {item.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type={item.input_type === 'number' ? 'number' : 'text'}
                                        value={(currentAnswer?.value as Record<string, string>)?.[item.key] || ''}
                                        onChange={(e) => {
                                            const currentValues = currentAnswer?.value as Record<string, string> || {};
                                            handleAnswerChange(question.id, {
                                                ...currentValues,
                                                [item.key]: e.target.value
                                            });
                                        }}
                                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${hasError && item.required
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                        placeholder={item.placeholder}
                                    />
                                    {item.unit && (
                                        <span className="text-sm text-gray-500">{item.unit}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {question.question_type === 'composite_multiple' && question.composite_items && (
                        <div className="space-y-4">
                            {question.composite_items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                    <label className="text-sm font-medium text-gray-700 min-w-[80px]">
                                        {item.label}
                                        {item.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type={item.input_type === 'number' ? 'number' : 'text'}
                                        value={(currentAnswer?.value as Record<string, string>)?.[item.key] || ''}
                                        onChange={(e) => {
                                            const currentValues = currentAnswer?.value as Record<string, string> || {};
                                            handleAnswerChange(question.id, {
                                                ...currentValues,
                                                [item.key]: e.target.value
                                            });
                                        }}
                                        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${hasError && item.required
                                            ? 'border-red-500 focus:ring-red-500'
                                            : 'border-gray-300 focus:ring-blue-500'
                                            }`}
                                        placeholder={item.placeholder}
                                    />
                                    {item.unit && (
                                        <span className="text-sm text-gray-500">{item.unit}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {question.question_type === 'description' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <p className="text-blue-800 text-sm">
                                {question.description || '안내 문구가 없습니다.'}
                            </p>
                        </div>
                    )}

                    {/* 필수 문항 에러 메시지 */}
                    {hasError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-700 text-sm">
                                필수 문항을 응답해주세요.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }, [currentPanel, visibleQuestions.length, answers, handleAnswerChange, etcValues]);

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
                    <p className="text-gray-600">미리보기 모드에서 응답을 확인해보세요.</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handlePreviewSubmit}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        응답 확인하기
                    </button>

                    <button
                        onClick={() => {
                            setIsCompleted(false);
                            setCurrentPanel(0);
                            setAnswers([]);
                            setRespondentId('');
                            setIsEmailVerified(false);
                            setEmailError('');
                        }}
                        className="px-6 py-3 ml-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        다시 시작하기
                    </button>
                </div>

                {/* 응답 JSON 모달 */}
                <ResponseJsonModal
                    isOpen={showResponseModal}
                    onClose={() => setShowResponseModal(false)}
                    responseData={prepareResponseData()}
                />
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
        <>
            <div className="max-w-2xl mx-auto p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-center mb-2">{survey.title}</h1>
                    {survey.description && (
                        <p className="text-gray-600 text-center">{survey.description}</p>
                    )}
                </div>

                {renderQuestion(currentQuestion)}

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

        </>
    );
} 