"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion, TSimpleQuestionType, TCompositeItem, TOption, TBranchCondition, TBranchLogic, TShowCondition } from "@/app/components/types";
import { toast, ToastContainer } from "react-toastify";
import ImagePreview from "./ImagePreview";
import ImageUrlModal from "./ImageUrlModal";
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
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function CreateForm() {
    const [survey, setSurvey] = useState<TSurvey>({
        id: "",
        title: "",
        description: "",
        questions: []
    });

    // DnD 센서 훅은 최상단에서 한 번만 호출
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // 페이지 진입 시 문항이 없으면 기본 문항 추가
    useEffect(() => {
        if (survey.questions.length === 0) {
            const newQuestion: TQuestion = {
                id: `q1`,
                title: "",
                description: "",
                type: "simple",
                simple_type: "single_choice",
                required: false,
                options: [{ label: '', value: '' }]
            };
            setSurvey(prev => ({
                ...prev,
                questions: [newQuestion]
            }));
        }
    }, []);

    // 이미지 모달 상태
    const [imageModal, setImageModal] = useState<null | { type: 'question' | 'option', qIdx: number, optIdx?: number, urls: string[] }>(null);

    const addQuestion = () => {
        const newQuestion: TQuestion = {
            id: `q${survey.questions.length + 1}`,
            title: "",
            description: "",
            type: "simple",
            simple_type: "single_choice",
            required: false,
            options: [{ label: '', value: '' }]
        };

        setSurvey(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    const updateQuestion = (index: number, updatedQuestion: TQuestion) => {
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

            console.log(q);
            const copy: TQuestion = { ...q, id: q.id + '_copy' };
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

                return {
                    ...prev,
                    questions: arrayMove(prev.questions, oldIndex, newIndex)
                };
            });
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
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
                                        key={question.id}
                                        question={question}
                                        questionIndex={index}
                                        onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                                        onDelete={() => deleteQuestion(index)}
                                        onCopy={() => copyQuestion(index)}
                                        onImageClick={(type, optIdx) => {
                                            let urls: string[] = [];
                                            if (type === 'question' && question.images) urls = question.images;
                                            if (type === 'option' && optIdx !== undefined && question.options && question.options[optIdx]?.images) urls = question.options[optIdx].images;
                                            setImageModal({ type, qIdx: index, optIdx, urls });
                                        }}
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
            <ToastContainer />
        </div>
    );
}

// 문항 패널 컴포넌트
function QuestionPanel({
    question,
    questionIndex,
    onUpdate,
    onDelete,
    onCopy,
    onImageClick
}: {
    question: TQuestion;
    questionIndex: number;
    onUpdate: (question: TQuestion) => void;
    onDelete: () => void;
    onCopy: () => void;
    onImageClick: (type: 'question' | 'option', optIdx?: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: questionIndex });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // 상태를 제거하고, 입력값 변경 시 바로 onUpdate 호출
    const handleChange = (patch: Partial<TQuestion>) => {
        onUpdate({ ...question, ...patch });
    };
    // 옵션 관련 핸들러
    const addOption = () => handleChange({ options: [...(question.options || []), { label: "", value: "" }] });
    const deleteOption = (idx: number) => handleChange({ options: question.options?.filter((_, i) => i !== idx) });
    const updateOption = (idx: number, value: string) => handleChange({ options: question.options?.map((opt, i) => i === idx ? { ...opt, label: value } : opt) });
    const updateOptionValue = (idx: number, value: string) => handleChange({ options: question.options?.map((opt, i) => i === idx ? { ...opt, value } : opt) });
    const addEtcOption = () => handleChange({ hasEtc: true });
    // 필수 토글
    const toggleRequired = () => handleChange({ required: !question.required });
    // 질문 유형 변경
    const handleTypeChange = (type: TSimpleQuestionType) => handleChange({ type: "simple", simple_type: type, options: type === "single_choice" || type === "multiple_choice" ? question.options || [] : undefined });
    // 질문 텍스트 변경
    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange({ title: e.target.value });

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6 mb-6"
        >
            {/* 드래그 핸들 & 상단 */}
            <div className="flex justify-between items-center mb-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex flex-row items-center cursor-move hover:bg-gray-100 rounded px-1"
                >
                    <span
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="드래그하여 순서 변경"
                    >
                        ⋮⋮
                    </span>
                    <span className="text-gray-400 font-bold select-none ml-1" style={{ minWidth: 32, textAlign: 'center' }}>{questionIndex + 1}번</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-blue-500" title="이미지 추가" onClick={() => onImageClick('question')}><span>🖼️</span></button>
                    <select
                        value={question.simple_type}
                        onChange={e => handleTypeChange(e.target.value as TSimpleQuestionType)}
                        className="border rounded px-2 py-1 text-sm"
                    >
                        <option value="single_choice">객관식 질문</option>
                        <option value="multiple_choice">중복 객관식</option>
                        <option value="short_text">단문 주관식</option>
                        <option value="long_text">장문 주관식</option>
                    </select>
                </div>
            </div>
            {/* 질문 텍스트 */}
            <textarea
                className="w-full border-b mb-4 text-lg font-semibold resize-none focus:outline-none focus:border-blue-500"
                placeholder="질문을 입력하세요"
                value={question.title}
                onChange={handleTitleChange}
                onInput={e => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                }}
                style={{ minHeight: 40, overflow: 'hidden' }}
            />
            {/* 이미지 미리보기 */}
            <ImagePreview images={question.images} />
            {/* 옵션 목록 (객관식) */}
            {(question.simple_type === "single_choice" || question.simple_type === "multiple_choice") && (
                <div className="space-y-2 mb-2">
                    {question.options?.map((opt, idx) => (
                        <div key={idx} className="flex flex-col">
                            <div className="flex items-center gap-2 group">
                                <input type={question.simple_type === "single_choice" ? "radio" : "checkbox"} disabled />
                                <input
                                    className="flex-1 border-b focus:outline-none focus:border-blue-500"
                                    placeholder="옵션 입력"
                                    value={opt.label}
                                    onChange={e => updateOption(idx, e.target.value)}
                                />
                                <button className="p-1 text-gray-400 hover:text-blue-500" title="이미지 추가" onClick={() => onImageClick('option', idx)}><span>🖼️</span></button>
                                {idx !== 0 && (
                                    <button onClick={() => deleteOption(idx)} className="p-1 text-gray-400 hover:text-red-500"><span>✕</span></button>
                                )}
                            </div>
                            {opt.images && opt.images.length > 0 && (
                                <div className="mt-1 ml-8">
                                    <ImagePreview images={opt.images} />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* 옵션 추가 & 기타 옵션 */}
                    <div className="flex flex-row gap-2">
                        <div className="flex items-center text-blue-600 cursor-pointer" onClick={addOption}>
                            <input type={question.simple_type === "single_choice" ? "radio" : "checkbox"} disabled />
                            <span>&nbsp;옵션 추가</span>
                        </div>
                        {question.hasEtc ? null : (
                            <div className="flex items-center text-blue-600 cursor-pointer" onClick={addEtcOption}>
                                <input type={question.simple_type === "single_choice" ? "radio" : "checkbox"} disabled />
                                <span>&nbsp;기타...</span>
                            </div>
                        )}
                    </div>
                    {/* 기타 옵션 렌더링 */}
                    {question.hasEtc ? (
                        <div className="flex items-center text-blue-600 cursor-default">
                            <input type={question.simple_type === "single_choice" ? "radio" : "checkbox"} disabled />
                            <span>&nbsp;기타...</span>
                            <button
                                className="ml-1 p-1 text-gray-400 hover:text-red-500"
                                title="기타 옵션 제거"
                                onClick={() => handleChange({ hasEtc: false })}
                                type="button"
                            >
                                ✕
                            </button>
                        </div>
                    ) : null}
                </div>
            )}
            {/* 주관식(단문/장문) 안내 */}
            {(question.simple_type === "short_text" || question.simple_type === "long_text") && (
                <div className="text-gray-400 italic mb-2">응답자가 직접 답변을 입력합니다.</div>
            )}
            {/* 하단 */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                    <button onClick={onCopy} className="p-2 text-gray-500 hover:text-blue-500" title="복사">복사</button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-500" title="삭제">삭제</button>
                </div>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                    <span className="text-sm">필수</span>
                    <span className="relative inline-block w-10 h-6 align-middle select-none">
                        <input
                            type="checkbox"
                            checked={!!question.required}
                            onChange={toggleRequired}
                            className="sr-only peer"
                        />
                        <span
                            className="block w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-colors duration-200"
                        ></span>
                        <span
                            className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 peer-checked:translate-x-4"
                        ></span>
                    </span>
                </label>
            </div>
        </div>
    );
}