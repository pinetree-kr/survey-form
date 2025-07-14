"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion } from "./types";

type Answer = {
    questionId: string;
    value: string | Record<string, string>;
};

export default function SurveyForm({ survey }: { survey: TSurvey }) {
    const [currentPanel, setCurrentPanel] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);

    // show_condition을 확인하는 함수
    const checkShowCondition = (question: TQuestion): boolean => {
        if (!question.show_condition) {
            return true; // 조건이 없으면 항상 보여줌
        }

        for (const condition of question.show_condition.conditions) {
            const conditionAnswer = answers.find(a => a.questionId === condition.question_id);
            if (!conditionAnswer) {
                return false; // 조건에 필요한 답변이 없으면 보여주지 않음
            }

            const conditionValue = conditionAnswer.value;
            let valueToCompare = conditionValue;

            // composite 타입의 경우 특정 키의 값을 확인
            if (typeof conditionValue === 'object' && conditionValue !== null) {
                const keys = Object.keys(conditionValue);
                if (keys.length > 0) {
                    // 첫 번째 키의 값을 사용 (실제로는 더 정교한 로직이 필요할 수 있음)
                    valueToCompare = (conditionValue as Record<string, string>)[keys[0]];
                }
            }

            let conditionMet = false;
            switch (condition.operator) {
                case "equals":
                    conditionMet = valueToCompare === condition.value;
                    break;
                case "not_equals":
                    conditionMet = valueToCompare !== condition.value;
                    break;
                case "contains":
                    conditionMet = typeof valueToCompare === 'string' && 
                                  valueToCompare.includes(condition.value as string);
                    break;
                case "greater_than":
                    const numValue = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                    conditionMet = typeof numValue === 'number' && !isNaN(numValue) && 
                                  numValue > (condition.value as number);
                    break;
                case "less_than":
                    const numValue2 = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                    conditionMet = typeof numValue2 === 'number' && !isNaN(numValue2) && 
                                  numValue2 < (condition.value as number);
                    break;
            }

            if (!conditionMet) {
                return false; // 조건이 만족되지 않으면 보여주지 않음
            }
        }

        return true; // 모든 조건이 만족되면 보여줌
    };

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

    const handleAnswerChange = (questionId: string, value: string | Record<string, string>) => {
        setAnswers(prev => {
            const existingIndex = prev.findIndex(a => a.questionId === questionId);
            if (existingIndex >= 0) {
                const newAnswers = [...prev];
                newAnswers[existingIndex] = { questionId, value };
                return newAnswers;
            }
            return [...prev, { questionId, value }];
        });
    };

    const getNextPanel = (currentAnswer: string | Record<string, string>): number => {
        const currentQuestion = visibleQuestions[currentPanel];
        
        // 1. 옵션별 직접 이동 로직 (multiple_choice의 경우)
        if (currentQuestion.type === "multiple_choice" && typeof currentAnswer === 'string') {
            const selectedOption = currentQuestion.options?.find(opt => opt.label === currentAnswer);
            if (selectedOption?.next_question_id) {
                const targetIndex = visibleQuestions.findIndex(q => q.id === selectedOption.next_question_id);
                if (targetIndex !== -1) {
                    return targetIndex;
                }
            }
        }
        
        // 2. 조건부 로직 체크
        if (currentQuestion.conditional_logic) {
            for (const logic of currentQuestion.conditional_logic) {
                let allConditionsMet = true;
                
                for (const condition of logic.conditions) {
                    const conditionAnswer = answers.find(a => a.questionId === condition.question_id);
                    if (!conditionAnswer) {
                        allConditionsMet = false;
                        break;
                    }
                    
                    const conditionValue = conditionAnswer.value;
                    let valueToCompare = conditionValue;
                    
                    // composite 타입의 경우 특정 키의 값을 확인
                    if (typeof conditionValue === 'object' && conditionValue !== null) {
                        const keys = Object.keys(conditionValue);
                        if (keys.length > 0) {
                            // 첫 번째 키의 값을 사용 (실제로는 더 정교한 로직이 필요할 수 있음)
                            valueToCompare = (conditionValue as Record<string, string>)[keys[0]];
                        }
                    }
                    
                    let conditionMet = false;
                    switch (condition.operator) {
                        case "equals":
                            conditionMet = valueToCompare === condition.value;
                            break;
                        case "not_equals":
                            conditionMet = valueToCompare !== condition.value;
                            break;
                        case "contains":
                            conditionMet = typeof valueToCompare === 'string' && 
                                          valueToCompare.includes(condition.value as string);
                            break;
                        case "greater_than":
                            const numValue = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                            conditionMet = typeof numValue === 'number' && !isNaN(numValue) && 
                                          numValue > (condition.value as number);
                            break;
                        case "less_than":
                            const numValue2 = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                            conditionMet = typeof numValue2 === 'number' && !isNaN(numValue2) && 
                                          numValue2 < (condition.value as number);
                            break;
                    }
                    
                    if (!conditionMet) {
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
        
        // 3. 기본 로직 (기존 예시)
        if (currentPanel === 0 && typeof currentAnswer === 'string') {
            if (currentAnswer === '예') {
                return 2; // 3번째 패널 (인덱스 2)
            } else if (currentAnswer === '아니오') {
                return 1; // 2번째 패널 (인덱스 1)
            }
        }
        
        // 기본적으로 다음 패널로 이동
        return currentPanel + 1;
    };

    const handleNext = () => {
        if (!currentQuestion) return;
        
        const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);
        
        if (!currentAnswer && currentQuestion.required) {
            alert('이 질문은 필수입니다.');
            return;
        }

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
    };

    const handlePrevious = () => {
        if (currentPanel > 0) {
            setCurrentPanel(currentPanel - 1);
        }
    };

    const handleSubmit = () => {
        console.log('설문 완료:', answers);
        // 여기에 제출 로직 추가
    };

    const renderQuestion = (question: TQuestion) => {
        const currentAnswer = answers.find(a => a.questionId === question.id);

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

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                        {question.title}
                        {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h2>
                    
                    {question.description && (
                        <p className="text-gray-600">{question.description}</p>
                    )}

                    {question.type === "multiple_choice" && (
                        <div className="space-y-3">
                            {question.options?.map((opt, idx) => (
                                <label key={idx} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={question.id}
                                        value={opt.label}
                                        checked={currentAnswer?.value === opt.label}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        className="form-radio text-blue-600"
                                    />
                                    <span className="text-lg">{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {question.type === "composite" && (
                        <div className="space-y-4">
                            {question.composite_items?.map((item) => (
                                <div key={item.key} className="flex items-center space-x-4">
                                    <label className="w-24 font-medium">{item.label}</label>
                                    <input
                                        name={`${question.id}_${item.key}`}
                                        type={item.input_type}
                                        placeholder={item.placeholder}
                                        value={(currentAnswer?.value as Record<string, string>)?.[item.key] || ''}
                                        onChange={(e) => {
                                            const compositeValue = currentAnswer?.value as Record<string, string> || {};
                                            handleAnswerChange(question.id, {
                                                ...compositeValue,
                                                [item.key]: e.target.value
                                            });
                                        }}
                                        className="border px-3 py-2 rounded-lg w-48 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {item.unit && <span className="text-sm text-gray-500">{item.unit}</span>}
                                </div>
                            ))}
                        </div>
                    )}

                    {question.type === "comment" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800">{question.description}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
                    <p className="text-gray-600">소중한 의견을 주셔서 감사합니다.</p>
                </div>
                
                <div className="space-y-4">
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        제출하기
                    </button>
                    
                    <button
                        onClick={() => {
                            setIsCompleted(false);
                            setCurrentPanel(0);
                            setAnswers([]);
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
            </div>

            {renderQuestion(currentQuestion)}

            <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                    onClick={handlePrevious}
                    disabled={currentPanel === 0}
                    className={`px-6 py-2 rounded-lg transition-colors ${
                        currentPanel === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    이전
                </button>

                <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {currentPanel === visibleQuestions.length - 1 ? '완료' : '다음'}
                </button>
            </div>
        </div>
    );
}
