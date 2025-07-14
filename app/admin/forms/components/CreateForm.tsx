"use client"

import React, { useState } from "react";
import { TSurvey, TQuestion, TSimpleQuestionType, TCompositeItem, TOption, TBranchCondition, TBranchLogic, TShowCondition } from "@/app/components/types";
import { toast, ToastContainer } from "react-toastify";

export default function CreateForm() {
    const [survey, setSurvey] = useState<TSurvey>({
        id: "",
        title: "",
        description: "",
        questions: []
    });

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
    const [editingQuestion, setEditingQuestion] = useState<TQuestion | null>(null);

    const addQuestion = () => {
        const newQuestion: TQuestion = {
            id: `q${survey.questions.length + 1}`,
            title: "",
            description: "",
            type: "simple",
            simple_type: "single_choice",
            required: true,
            options: []
        };

        setSurvey(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));

        setCurrentQuestionIndex(survey.questions.length);
        setEditingQuestion(newQuestion);
    };

    const updateQuestion = (index: number, updatedQuestion: TQuestion) => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? updatedQuestion : q)
        }));
        setEditingQuestion(null);
        setCurrentQuestionIndex(-1);
    };

    const deleteQuestion = (index: number) => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
        setEditingQuestion(null);
        setCurrentQuestionIndex(-1);
    };

    const editQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        setEditingQuestion(survey.questions[index]);
    };

    const copyInClipboard = () => {
        // 클립보드에 복사하기
        const jsonString = JSON.stringify(survey, null, 2);
        navigator.clipboard.writeText(jsonString);

        // 토스트 메시지 출력
        toast.success("설문이 클립보드에 복사되었습니다.");
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">설문 생성기</h1>

                {/* 설문 기본 정보 */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">설문 기본 정보</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                설문 ID
                            </label>
                            <input
                                type="text"
                                value={survey.id}
                                onChange={(e) => setSurvey(prev => ({ ...prev, id: e.target.value }))}
                                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="survey-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                설문 제목
                            </label>
                            <input
                                type="text"
                                value={survey.title}
                                onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="설문 제목을 입력하세요"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            설문 설명
                        </label>
                        <textarea
                            value={survey.description}
                            onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="설문에 대한 설명을 입력하세요"
                        />
                    </div>
                </div>

                {/* 문항 목록 */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">문항 목록</h2>
                        <button
                            onClick={addQuestion}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            문항 추가
                        </button>
                    </div>

                    {survey.questions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">문항을 추가해주세요.</p>
                    ) : (
                        <div className="space-y-3">
                            {survey.questions.map((question, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <h3 className="font-medium">{question.title || `문항 ${index + 1}`}</h3>
                                        <p className="text-sm text-gray-500">
                                            {question.type === "simple" ?
                                                `단순 질문 (${question.simple_type})` :
                                                "복합 질문"
                                            }
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => editQuestion(index)}
                                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                        >
                                            편집
                                        </button>
                                        <button
                                            onClick={() => deleteQuestion(index)}
                                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* JSON 내보내기 */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">설문 내보내기</h2>
                        <button
                            onClick={copyInClipboard}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            클립보드에 복사
                        </button>
                    </div>
                    <div className="mt-4">
                        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                            {JSON.stringify(survey, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>

            {/* 문항 편집 모달 */}
            {editingQuestion && (
                <QuestionEditor
                    question={editingQuestion}
                    onSave={(updatedQuestion) => updateQuestion(currentQuestionIndex, updatedQuestion)}
                    onCancel={() => {
                        setEditingQuestion(null);
                        setCurrentQuestionIndex(-1);
                    }}
                />
            )}
            <ToastContainer />
        </div>
    );
}

// 문항 편집 컴포넌트
function QuestionEditor({
    question,
    onSave,
    onCancel
}: {
    question: TQuestion;
    onSave: (question: TQuestion) => void;
    onCancel: () => void;
}) {
    const [editedQuestion, setEditedQuestion] = useState<TQuestion>(question);

    const handleSave = () => {
        onSave(editedQuestion);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">문항 편집</h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    {/* 기본 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                문항 ID
                            </label>
                            <input
                                type="text"
                                value={editedQuestion.id}
                                onChange={(e) => setEditedQuestion(prev => ({ ...prev, id: e.target.value }))}
                                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                필수 여부
                            </label>
                            <select
                                value={editedQuestion.required ? "true" : "false"}
                                onChange={(e) => setEditedQuestion(prev => ({ ...prev, required: e.target.value === "true" }))}
                                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="true">필수</option>
                                <option value="false">선택</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            문항 제목
                        </label>
                        <input
                            type="text"
                            value={editedQuestion.title}
                            onChange={(e) => setEditedQuestion(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            문항 설명
                        </label>
                        <textarea
                            value={editedQuestion.description || ""}
                            onChange={(e) => setEditedQuestion(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            문항 유형
                        </label>
                        <select
                            value={editedQuestion.type}
                            onChange={(e) => {
                                const newType = e.target.value as "simple" | "composite";
                                setEditedQuestion(prev => ({
                                    ...prev,
                                    type: newType,
                                    simple_type: newType === "simple" ? "single_choice" : undefined,
                                    options: newType === "simple" ? [] : undefined,
                                    composite_items: newType === "composite" ? [] : undefined
                                }));
                            }}
                            className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="simple">단순 질문</option>
                            <option value="composite">복합 질문</option>
                        </select>
                    </div>

                    {/* 단순 질문 옵션 */}
                    {editedQuestion.type === "simple" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                질문 하위 유형
                            </label>
                            <select
                                value={editedQuestion.simple_type}
                                onChange={(e) => setEditedQuestion(prev => ({
                                    ...prev,
                                    simple_type: e.target.value as TSimpleQuestionType
                                }))}
                                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="short_text">단문대답</option>
                                <option value="long_text">장문대답</option>
                                <option value="single_choice">단일 객관식</option>
                                <option value="multiple_choice">중복 객관식</option>
                            </select>
                        </div>
                    )}

                    {/* 객관식 옵션 */}
                    {editedQuestion.type === "simple" &&
                        (editedQuestion.simple_type === "single_choice" || editedQuestion.simple_type === "multiple_choice") && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    옵션 목록
                                </label>
                                <div className="space-y-2">
                                    {editedQuestion.options?.map((option, index) => (
                                        <div key={index} className="flex space-x-2">
                                            <input
                                                type="text"
                                                value={option.label}
                                                onChange={(e) => {
                                                    const newOptions = [...(editedQuestion.options || [])];
                                                    newOptions[index] = { ...option, label: e.target.value };
                                                    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                                                }}
                                                className="flex-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="옵션 라벨"
                                            />
                                            <input
                                                type="text"
                                                value={option.value}
                                                onChange={(e) => {
                                                    const newOptions = [...(editedQuestion.options || [])];
                                                    newOptions[index] = { ...option, value: e.target.value };
                                                    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                                                }}
                                                className="w-32 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="값"
                                            />
                                            <input
                                                type="text"
                                                value={option.next_question_id || ""}
                                                onChange={(e) => {
                                                    const newOptions = [...(editedQuestion.options || [])];
                                                    newOptions[index] = { ...option, next_question_id: e.target.value };
                                                    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                                                }}
                                                className="w-32 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="다음 문항 ID"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newOptions = editedQuestion.options?.filter((_, i) => i !== index);
                                                    setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                                                }}
                                                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const newOptions = [...(editedQuestion.options || []), { label: "", value: "" }];
                                            setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                                        }}
                                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                        옵션 추가
                                    </button>
                                </div>
                            </div>
                        )}

                    {/* 복합 질문 항목 */}
                    {editedQuestion.type === "composite" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                복합 질문 항목
                            </label>
                            <div className="space-y-2">
                                {editedQuestion.composite_items?.map((item, index) => (
                                    <div key={index} className="grid grid-cols-6 gap-2">
                                        <input
                                            type="text"
                                            value={item.label}
                                            onChange={(e) => {
                                                const newItems = [...(editedQuestion.composite_items || [])];
                                                newItems[index] = { ...item, label: e.target.value };
                                                setEditedQuestion(prev => ({ ...prev, composite_items: newItems }));
                                            }}
                                            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="라벨"
                                        />
                                        <select
                                            value={item.input_type}
                                            onChange={(e) => {
                                                const newItems = [...(editedQuestion.composite_items || [])];
                                                newItems[index] = { ...item, input_type: e.target.value as any };
                                                setEditedQuestion(prev => ({ ...prev, composite_items: newItems }));
                                            }}
                                            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="text">텍스트</option>
                                            <option value="number">숫자</option>
                                            <option value="email">이메일</option>
                                            <option value="tel">전화번호</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={item.unit || ""}
                                            onChange={(e) => {
                                                const newItems = [...(editedQuestion.composite_items || [])];
                                                newItems[index] = { ...item, unit: e.target.value };
                                                setEditedQuestion(prev => ({ ...prev, composite_items: newItems }));
                                            }}
                                            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="단위"
                                        />
                                        <input
                                            type="text"
                                            value={item.placeholder || ""}
                                            onChange={(e) => {
                                                const newItems = [...(editedQuestion.composite_items || [])];
                                                newItems[index] = { ...item, placeholder: e.target.value };
                                                setEditedQuestion(prev => ({ ...prev, composite_items: newItems }));
                                            }}
                                            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="플레이스홀더"
                                        />
                                        <input
                                            type="text"
                                            value={item.key}
                                            onChange={(e) => {
                                                const newItems = [...(editedQuestion.composite_items || [])];
                                                newItems[index] = { ...item, key: e.target.value };
                                                setEditedQuestion(prev => ({ ...prev, composite_items: newItems }));
                                            }}
                                            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="키"
                                        />
                                        <button
                                            onClick={() => {
                                                const newItems = editedQuestion.composite_items?.filter((_, i) => i !== index);
                                                setEditedQuestion(prev => ({ ...prev, composite_items: newItems }));
                                            }}
                                            className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const newItems = [...(editedQuestion.composite_items || []), {
                                            label: "",
                                            input_type: "text",
                                            key: "",
                                            required: false
                                        }];
                                        setEditedQuestion(prev => ({ ...prev, composite_items: newItems as TCompositeItem[] }));
                                    }}
                                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    항목 추가
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    );
}