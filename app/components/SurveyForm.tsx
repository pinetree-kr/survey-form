"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion, TBranchCondition } from "./types";

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

export default function SurveyForm({ survey }: { survey: TSurvey }) {
    const [currentPanel, setCurrentPanel] = useState(0);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);

    // 조건을 확인하는 함수
    const checkCondition = (condition: TBranchCondition): boolean => {
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

        switch (condition.operator) {
            case "eq":
                return valueToCompare === condition.value;
            case "neq":
                return valueToCompare !== condition.value;
            case "contains":
                return typeof valueToCompare === 'string' &&
                    valueToCompare.includes(condition.value as string);
            case "gt":
                const numValue = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                return typeof numValue === 'number' && !isNaN(numValue) &&
                    numValue > (condition.value as number);
            case "lt":
                const numValue2 = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                return typeof numValue2 === 'number' && !isNaN(numValue2) &&
                    numValue2 < (condition.value as number);
            case "gte":
                const numValue3 = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                return typeof numValue3 === 'number' && !isNaN(numValue3) &&
                    numValue3 >= (condition.value as number);
            case "lte":
                const numValue4 = typeof valueToCompare === 'string' ? parseFloat(valueToCompare) : valueToCompare;
                return typeof numValue4 === 'number' && !isNaN(numValue4) &&
                    numValue4 <= (condition.value as number);
            default:
                return false;
        }
    };

    // show_condition을 확인하는 함수
    const checkShowCondition = (question: TQuestion): boolean => {
        if (!question.show_conditions || question.show_conditions.length === 0) {
            return true; // 조건이 없으면 항상 보여줌
        }

        for (const condition of question.show_conditions) {
            if (!checkCondition(condition)) {
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

    const handleAnswerChange = (questionId: string, value: string | string[] | Record<string, string>) => {
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

    const getNextPanel = (currentAnswer: string | string[] | Record<string, string>): number => {
        const currentQuestion = visibleQuestions[currentPanel];

        // 1. 옵션별 직접 이동 로직 (단일/중복 객관식의 경우)
        if ((currentQuestion.question_type === "single_choice" || currentQuestion.question_type === "multiple_choice") &&
            typeof currentAnswer === 'string') {
            const selectedOption = currentQuestion.options?.find(opt => opt.value === currentAnswer);
            if (selectedOption?.next_question_id) {
                const targetIndex = visibleQuestions.findIndex(q => q.id === selectedOption.next_question_id);
                if (targetIndex !== -1) {
                    return targetIndex;
                }
            }
        }

        // 2. composite_single 문항의 분기 로직
        if (currentQuestion.question_type === "composite_single" && typeof currentAnswer === 'object' && currentAnswer !== null) {
            // composite_single에서 선택된 항목 찾기
            const selectedItem = currentQuestion.composite_items?.find(item => {
                const itemValue = (currentAnswer as Record<string, string>)[item.key];
                return itemValue && itemValue.trim() !== '';
            });
            
            if (selectedItem?.next_question_id) {
                const targetIndex = visibleQuestions.findIndex(q => q.id === selectedItem.next_question_id);
                if (targetIndex !== -1) {
                    return targetIndex;
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
    };

    const handleNext = () => {
        if (!currentQuestion) return;

        const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

        if (!currentAnswer && currentQuestion.required && currentQuestion.question_type !== "description") {
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
                        {question.required && question.question_type !== "description" && <span className="text-red-500 ml-1">*</span>}
                    </h2>

                    {question.description && (
                        <p className="text-gray-600">{question.description}</p>
                    )}

                    {/* 단순 질문 렌더링 */}
                    {(question.question_type === "single_choice"
                        || question.question_type === "multiple_choice"
                        || question.question_type === "short_text"
                        || question.question_type === "long_text"
                        || question.question_type === "description") && (
                            <>
                                {/* 단일 객관식 */}
                                {question.question_type === "single_choice" && (
                                    <div className="space-y-3">
                                        {question.options?.map((opt, idx) => (
                                            <label key={idx} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={question.id}
                                                    value={opt.value}
                                                    checked={currentAnswer?.value === opt.value}
                                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    className="form-radio text-blue-600"
                                                />
                                                <span className="text-lg">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* 중복 객관식 */}
                                {question.question_type === "multiple_choice" && (
                                    <div className="space-y-3">
                                        {question.options?.map((opt, idx) => (
                                            <label key={idx} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name={question.id}
                                                    value={opt.value}
                                                    checked={Array.isArray(currentAnswer?.value) &&
                                                        (currentAnswer?.value as string[]).includes(opt.value)}
                                                    onChange={(e) => {
                                                        const currentValues = Array.isArray(currentAnswer?.value)
                                                            ? (currentAnswer?.value as string[])
                                                            : [];
                                                        const newValues = e.target.checked
                                                            ? [...currentValues, opt.value]
                                                            : currentValues.filter(v => v !== opt.value);
                                                        handleAnswerChange(question.id, newValues);
                                                    }}
                                                    className="form-checkbox text-blue-600"
                                                />
                                                <span className="text-lg">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {/* 단문대답 */}
                                {question.question_type === "short_text" && (
                                    <input
                                        type="text"
                                        value={currentAnswer?.value as string || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="답변을 입력해주세요"
                                    />
                                )}

                                {/* 장문대답 */}
                                {question.question_type === "long_text" && (
                                    <textarea
                                        value={currentAnswer?.value as string || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={4}
                                        placeholder="답변을 입력해주세요"
                                    />
                                )}

                                {/* 안내문 */}
                                {question.question_type === "description" && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <span className="text-blue-600 mr-2 mt-0.5">ℹ️</span>
                                            <div className="text-blue-800">
                                                <p className="text-sm leading-relaxed">{question.title}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                    {/* 복합 질문 렌더링 */}
                    {question.question_type === "composite_single" && (
                        <div className="space-y-4">
                            {question.composite_items?.map((item) => (
                                <div key={item.key} className="flex items-center space-x-4">
                                    <label className="w-24 font-medium">
                                        {item.label}
                                        {item.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
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
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {currentPanel === visibleQuestions.length - 1 ? '완료' : '다음'}
                </button>
            </div>
        </div>
    );
}
