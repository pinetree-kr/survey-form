"use client"

import React, { useState } from "react";
import { TSurvey, TQuestion, TBranchCondition } from "@/app/components";
import { toast, ToastContainer } from "react-toastify";
import { ImageUrlModal, BranchModal, ConditionModal, QuestionPanel } from "./";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';


import { v4 as uuidv4 } from 'uuid';

export function CreateForm() {
    const [survey, setSurvey] = useState<TSurvey>({
        // id: "",
        // title: "",
        // description: "",
        // questions: [{
        //     id: uuidv4(),
        //     title: "",
        //     description: "",
        //     question_type: "single_choice",
        //     required: false,
        //     options: [{ label: '', value: '' }]
        // }],
        "id": "",
        "title": "",
        "description": "",
        "questions": [
            {
                "id": "bd158251-6b24-426c-9c58-daab52a415cf",
                "title": "테스트항목1",
                "description": "",
                "question_type": "single_choice",
                "required": false,
                "options": [
                    {
                        "label": "예",
                        "value": "예"
                    },
                    {
                        "label": "아니오",
                        "value": "아니오"
                    }
                ]
            },
            {
                "id": "81c6c94d-e717-4255-b27e-2d4e661f67fc",
                "title": "테스트항목2",
                "description": "",
                "question_type": "single_choice",
                "required": false,
                "options": [
                    {
                        "label": "예",
                        "value": "예"
                    },
                    {
                        "label": "아니오",
                        "value": "아니오"
                    }
                ]
            },
            {
                "id": "429d62cc-f8f3-450a-97cf-38daae6344d1",
                "title": "테스트항목3",
                "description": "",
                "question_type": "single_choice",
                "required": false,
                "options": [
                    {
                        "label": "예",
                        "value": "예"
                    },
                    {
                        "label": "아니오",
                        "value": "아니오"
                    }
                ]
            },
            {
                "id": "4c7d7ec2-4c69-4ae5-9242-50ad0b44729e",
                "title": "테스트항목4",
                "description": "",
                "question_type": "single_choice",
                "required": false,
                "options": [
                    {
                        "label": "예",
                        "value": "예"
                    },
                    {
                        "label": "아니오",
                        "value": "아니오"
                    }
                ]
            }
        ]
    });

    // DnD 센서 훅은 최상단에서 한 번만 호출
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // 이미지 모달 상태
    const [imageModal, setImageModal] = useState<null | { type: 'question' | 'option', qIdx: number, optIdx?: number, urls: string[] }>(null);

    // 분기 모달 상태 추가
    const [branchModal, setBranchModal] = useState<null | { qIdx: number, optIdx: number }>(null);

    const [conditionModal, setConditionModal] = useState<null | { qIdx: number }>(null);

    const addQuestion = () => {
        const newQuestion: TQuestion = {
            // id: `q${survey.questions.length + 1}`,
            id: uuidv4(),
            title: "",
            description: "",
            question_type: "single_choice",
            required: false,
            options: [{ label: '', value: '' }],
            show_conditions: []
        };

        setSurvey(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    const updateQuestion = (index: number, updatedQuestion: TQuestion) => {
        console.log(index, updatedQuestion);

        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? updatedQuestion : q)
        }));
    };

    const deleteQuestion = (index: number) => {
        setSurvey(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const copyInClipboard = () => {
        // 클립보드에 복사하기
        const jsonString = JSON.stringify(survey, null, 2);
        navigator.clipboard.writeText(jsonString);

        // 토스트 메시지 출력
        toast.success("설문이 클립보드에 복사되었습니다.");
    };

    // 문항 복사 (해당 문항 아래에 추가)
    const copyQuestion = (index: number) => {
        setSurvey(prev => {
            const q = prev.questions[index];

            const copy: TQuestion = { ...q, id: uuidv4() };
            const newQuestions = [
                ...prev.questions.slice(0, index + 1),
                copy,
                ...prev.questions.slice(index + 1)
            ];
            return { ...prev, questions: newQuestions };
        });
    };

    // 이미지 저장 핸들러
    const handleImageSave = (urls: string[]) => {
        if (!imageModal) return;
        setSurvey(prev => {
            const questions = [...prev.questions];
            if (imageModal.type === 'question') {
                questions[imageModal.qIdx] = {
                    ...questions[imageModal.qIdx],
                    images: urls
                };
            } else if (imageModal.type === 'option' && imageModal.optIdx !== undefined) {
                const opts = [...(questions[imageModal.qIdx].options || [])];
                opts[imageModal.optIdx] = {
                    ...opts[imageModal.optIdx],
                    images: urls
                };
                questions[imageModal.qIdx] = {
                    ...questions[imageModal.qIdx],
                    options: opts
                };
            }
            return { ...prev, questions };
        });
        setImageModal(null);
    };

    // 드래그 앤 드롭 핸들러
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSurvey(prev => {
                const oldIndex = prev.questions.findIndex((_, index) => index === active.id);
                const newIndex = prev.questions.findIndex((_, index) => index === over?.id);

                console.log({
                    ...prev,
                    questions: arrayMove(prev.questions, oldIndex, newIndex)
                })

                return {
                    ...prev,
                    questions: arrayMove(prev.questions, oldIndex, newIndex)
                };
            });
        }
    };

    // 분기 추가 핸들러
    const handleBranchAdd = (qIdx: number, optIdx: number, nextQuestionId: string) => {
        setSurvey(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];
            const options = [...(question.options || [])];

            options[optIdx] = {
                ...options[optIdx],
                next_question_id: nextQuestionId
            };

            questions[qIdx] = {
                ...question,
                options
            };

            return { ...prev, questions };
        });
        setBranchModal(null);
    };

    // 분기 제거 핸들러
    const handleBranchDelete = (qIdx: number, optIdx: number) => {
        setSurvey(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];

            const options = [...(question.options || [])];

            options[optIdx] = {
                ...options[optIdx],
                next_question_id: undefined
            };

            questions[qIdx] = {
                ...question,
                options
            };

            return { ...prev, questions };
        });
        setBranchModal(null);
    };

    // 조건부 표시 추가 핸들러
    const handleShowConditionAdd = (qIdx: number, condition: TBranchCondition) => {
        setSurvey(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];

            questions[qIdx] = {
                ...question,
                show_conditions: [condition]
            };

            return { ...prev, questions };
        });
        setConditionModal(null);
    };

    const handleShowConditionDelete = (qIdx: number, idx: number) => {
        setSurvey(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];
            questions[qIdx] = { ...question, show_conditions: question.show_conditions?.filter((_, i) => i !== idx) };
            return { ...prev, questions };
        });
    };

    return (
        <div className="max-w-2xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">설문 생성기</h1>

                {/* 설문 기본 정보 */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">설문 기본 정보</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                설문 ID
                            </label>
                            <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500">
                                {survey.id ? survey.id : "자동생성"}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                설문 제목
                            </label>
                            <input
                                type="text"
                                value={survey.title}
                                onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full border rounded px-3 py-2 text-base min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full border rounded px-3 py-2 text-base min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="설문에 대한 설명을 입력하세요"
                        />
                    </div>
                </div>

                {/* 문항 패널 목록 */}
                <div className="space-y-6 mb-6">
                    <h2 className="text-xl font-semibold mb-2">문항 목록</h2>
                    {survey.questions.length === 0 ? (
                        <div className="bg-white p-8 rounded-lg shadow-md text-center">
                            <p className="text-gray-500">문항을 추가해주세요.</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={survey.questions.map((_, index) => index)}
                                strategy={verticalListSortingStrategy}
                            >
                                {survey.questions.map((question, index) => (
                                    <QuestionPanel
                                        key={`p${index}`}
                                        question={question}
                                        questionIndex={index}
                                        questions={survey.questions}
                                        onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                                        onDelete={() => deleteQuestion(index)}
                                        onCopy={() => copyQuestion(index)}
                                        onImageClick={(type, optIdx) => {
                                            let urls: string[] = [];
                                            if (type === 'question' && question.images) urls = question.images;
                                            if (type === 'option' && optIdx !== undefined && question.options && question.options[optIdx]?.images) urls = question.options[optIdx].images;
                                            setImageModal({ type, qIdx: index, optIdx, urls });
                                        }}
                                        onBranchAdd={(optIdx) => setBranchModal({ qIdx: index, optIdx })}
                                        onBranchDelete={(optIdx) => handleBranchDelete(index, optIdx)}
                                        onShowConditionAdd={() => setConditionModal({ qIdx: index })}
                                        onShowConditionDelete={(idx) => handleShowConditionDelete(index, idx)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    )}
                    {/* 문항 추가 버튼 - 목록의 마지막 아래 */}
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={addQuestion}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            문항 추가
                        </button>
                    </div>
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
            {/* 이미지 URL 입력 모달 */}
            <ImageUrlModal
                open={!!imageModal}
                urls={imageModal?.urls || []}
                onChange={urls => setImageModal(imageModal ? { ...imageModal, urls } : null)}
                onCancel={() => setImageModal(null)}
                onSave={handleImageSave}
            />
            {/* 분기 모달 */}
            <BranchModal
                isOpen={!!branchModal}
                onClose={() => setBranchModal(null)}
                questions={survey.questions}
                onAdd={(nextQuestionId) => handleBranchAdd(branchModal!.qIdx, branchModal!.optIdx, nextQuestionId)}
            />

            {/* 조건부 표시 모달 */}
            <ConditionModal
                isOpen={!!conditionModal}
                onClose={() => setConditionModal(null)}
                questions={survey.questions}
                onAdd={(condition) => handleShowConditionAdd(conditionModal!.qIdx, condition)}
            />
            <ToastContainer />
        </div>
    );
}



