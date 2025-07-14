"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion, TSimpleQuestionType, TCompositeItem, TOption, TBranchCondition, TBranchLogic, TShowCondition, TQuestionType } from "@/app/components/types";
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
import { Checkbox, Listbox, ListboxButton, ListboxOption, ListboxOptions, Radio, RadioGroup, Textarea, Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { CheckCircleIcon, ChevronUpDownIcon, EnvelopeIcon, PhoneIcon, HashtagIcon, PencilIcon } from '@heroicons/react/24/solid';
import { Switch } from '@headlessui/react';

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
                question_type: "single_choice",
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
            question_type: "single_choice",
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
    const handleTypeChange = (qt: TQuestionType) => handleChange({ question_type: qt });
    // 질문 텍스트 변경
    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange({ title: e.target.value });

    // 문항 유형 리스트
    const QUESTION_TYPE_OPTIONS: { value: TQuestionType; label: string; icon: React.ReactNode }[] = [
        { value: 'short_text', label: '단답형', icon: <span>📝</span> },
        { value: 'long_text', label: '장문형', icon: <span>📄</span> },
        { value: 'single_choice', label: '객관식 질문', icon: <span>🔘</span> },
        { value: 'multiple_choice', label: '체크 박스', icon: <span>☑️</span> },
        { value: 'dropdown', label: '드롭다운', icon: <span>⬇️</span> },
        { value: 'composite_single', label: '복합 단일', icon: <span>🔲</span> },
        { value: 'composite_multiple', label: '복합 다중', icon: <span>🗂️</span> },
    ];

    const COMPOSITE_INPUT_TYPE_OPTIONS = [
        { value: 'text', label: '텍스트', icon: <PencilIcon className="h-4 w-4 mr-1 text-gray-400" /> },
        { value: 'number', label: '숫자', icon: <HashtagIcon className="h-4 w-4 mr-1 text-gray-400" /> },
        { value: 'email', label: '이메일', icon: <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" /> },
        { value: 'tel', label: '전화번호', icon: <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" /> },
    ];

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
                    <Listbox value={question.question_type} onChange={qt => {
                        let patch: Partial<TQuestion> = { question_type: qt };
                        if (["single_choice", "multiple_choice", "dropdown"].includes(qt)) {
                            patch.options = question.options && question.options.length > 0 ? question.options : [{ label: '', value: '' }];
                            patch.composite_items = undefined;
                        } else if (["composite_single", "composite_multiple"].includes(qt)) {
                            patch.composite_items = question.composite_items && question.composite_items.length > 0 ? question.composite_items : [{ label: '', input_type: 'text' as TCompositeItem["input_type"], key: '', unit: '' }];
                            patch.options = undefined;
                        } else {
                            patch.options = undefined;
                            patch.composite_items = undefined;
                        }
                        handleChange(patch);
                    }}>
                        <div className="relative w-48">
                            <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <span className="flex items-center gap-2">
                                    {QUESTION_TYPE_OPTIONS.find(o => o.value === question.question_type)?.icon}
                                    {QUESTION_TYPE_OPTIONS.find(o => o.value === question.question_type)?.label}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </span>
                            </ListboxButton>
                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                {QUESTION_TYPE_OPTIONS.map(option => (
                                    <ListboxOption
                                        key={option.value}
                                        value={option.value}
                                        className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                    >
                                        {({ selected }) => (
                                            <>
                                                <span className="absolute left-2 top-2 flex items-center">{option.icon}</span>
                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                                {selected ? (
                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <CheckCircleIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </ListboxOption>
                                ))}
                            </ListboxOptions>
                        </div>
                    </Listbox>
                </div>
            </div>
            {/* 질문 텍스트 */}
            <Textarea
                className="w-full border rounded px-3 py-2 text-base min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            {/* 옵션 목록 (객관식/드롭다운) */}
            {["single_choice", "dropdown"].includes(question.question_type) && (
                <RadioGroup value={question.options?.[0]?.value || ''} onChange={() => { }} className="space-y-2 mb-2">
                    {question.options?.map((opt, idx) => (
                        <div className="flex flex-row gap-2 mt-1">
                            <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2 self-center" />
                            <div className="flex items-center text-blue-600 cursor-pointer">
                                <OptionCombobox
                                    value={opt.label}
                                    onChange={v => updateOption(idx, v)}
                                    options={question.options?.map(o => o.label).filter(l => l && l !== opt.label) || []}
                                />
                                <button className="p-1 text-gray-400 hover:text-blue-500 min-h-[40px]" title="이미지 추가" onClick={() => onImageClick('option', idx)}><span>🖼️</span></button>
                                {idx !== 0 && (
                                    <button onClick={() => deleteOption(idx)} className="p-1 text-gray-400 hover:text-red-500 min-h-[40px]"><span>✕</span></button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-row gap-2 mt-1">
                        <div className="flex items-center text-blue-600 cursor-pointer" onClick={addOption}>
                            <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2" />
                            <span>&nbsp;옵션 추가</span>
                        </div>
                        {question.question_type === "single_choice" && question.hasEtc ? null : (
                            <div className="flex items-center text-blue-600 cursor-pointer" onClick={addEtcOption}>
                                <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2" />
                                <span>&nbsp;기타...</span>
                            </div>
                        )}
                    </div>
                    {question.question_type === "single_choice" && question.hasEtc ? (
                        <div className="flex items-center text-blue-600 cursor-default mt-1">
                            <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2" />
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
                </RadioGroup>
            )}
            {question.question_type === "multiple_choice" && (
                <div className="space-y-2 mb-2">
                    {question.options?.map((opt, idx) => (
                        <div key={opt.value + idx} className="flex flex-row gap-2 mt-1">
                            <Checkbox checked={false} onChange={() => { }} className="border-blue-400 bg-white mr-2 w-4 h-4 rounded border self-center" />
                            <div className="flex items-center text-blue-600 cursor-pointer" onClick={addOption}>
                                <OptionCombobox
                                    value={opt.label}
                                    onChange={v => updateOption(idx, v)}
                                    options={question.options?.map(o => o.label).filter(l => l && l !== opt.label) || []}
                                />
                                <button className="p-1 text-gray-400 hover:text-blue-500 min-h-[40px]" title="이미지 추가" onClick={() => onImageClick('option', idx)}><span>🖼️</span></button>
                                {idx !== 0 && (
                                    <button onClick={() => deleteOption(idx)} className="p-1 text-gray-400 hover:text-red-500 min-h-[40px]"><span>✕</span></button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex flex-row gap-2 mt-1">
                        <div className="flex items-center text-blue-600 cursor-pointer" onClick={addOption}>
                            <Checkbox checked={false} onChange={() => { }} className="border-blue-400 bg-white mr-2 w-4 h-4 rounded border" />
                            <span>&nbsp;옵션 추가</span>
                        </div>
                        {question.hasEtc ? null : (
                            <div className="flex items-center text-blue-600 cursor-pointer" onClick={addEtcOption}>
                                <Checkbox checked={false} onChange={() => { }} className="border-blue-400 bg-white mr-2 w-4 h-4 rounded border" />
                                <span>&nbsp;기타...</span>
                            </div>
                        )}
                    </div>
                    {question.hasEtc ? (
                        <div className="flex items-center text-blue-600 cursor-default mt-1">
                            <Checkbox checked={false} onChange={() => { }} className="border-blue-400 bg-white mr-2 w-4 h-4 rounded border" />
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
            {/* 복합질문 하위 항목 UI */}
            {["composite_single", "composite_multiple"].includes(question.question_type) && (
                <div className="mb-2">
                    <div className="font-semibold mb-1">복합질문 항목</div>
                    {(question.composite_items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-1 min-h-[44px]">
                            {question.question_type === 'composite_multiple' ? (
                                <Checkbox checked={false} onChange={() => { }} className="border-blue-400 bg-white mr-2 w-4 h-4 rounded border self-center" />
                            ) : (
                                <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2 self-center" />
                            )}
                            <CompositeItemCombobox
                                value={item.label}
                                onChange={v => {
                                    const newItems = [...(question.composite_items || [])];
                                    newItems[idx] = { ...item, label: v };
                                    handleChange({ composite_items: newItems });
                                }}
                                options={question.composite_items?.map(i => i.label).filter(l => l && l !== item.label) || []}
                            />
                            <Listbox value={item.input_type} onChange={v => {
                                const newItems = [...(question.composite_items || [])];
                                newItems[idx] = { ...item, input_type: v as TCompositeItem["input_type"] };
                                handleChange({ composite_items: newItems });
                            }}>
                                <div className="relative w-32">
                                    <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-8 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <span className="flex items-center gap-1">
                                            {COMPOSITE_INPUT_TYPE_OPTIONS.find(o => o.value === item.input_type)?.icon}
                                            {COMPOSITE_INPUT_TYPE_OPTIONS.find(o => o.value === item.input_type)?.label}
                                        </span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </ListboxButton>
                                    <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                        {COMPOSITE_INPUT_TYPE_OPTIONS.map(option => (
                                            <ListboxOption
                                                key={option.value}
                                                value={option.value}
                                                className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                            >
                                                {({ selected }) => (
                                                    <>
                                                        <span className="absolute left-2 top-2 flex items-center">{option.icon}</span>
                                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                                        {selected ? (
                                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                                <CheckCircleIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </ListboxOption>
                                        ))}
                                    </ListboxOptions>
                                </div>
                            </Listbox>
                            <input
                                className="border rounded px-3 py-2 text-base min-h-[40px] w-20"
                                placeholder="단위"
                                value={item.unit || ''}
                                onChange={e => {
                                    const newItems = [...(question.composite_items || [])];
                                    newItems[idx] = { ...item, unit: e.target.value };
                                    handleChange({ composite_items: newItems });
                                }}
                            />
                            <button className="p-1 text-gray-400 hover:text-red-500" title="삭제" onClick={() => {
                                const newItems = (question.composite_items || []).filter((_, i) => i !== idx);
                                handleChange({ composite_items: newItems });
                            }}>✕</button>
                        </div>
                    ))}

                    <div className="flex items-center text-blue-600 cursor-pointer" onClick={() => {
                        const newItems = [...(question.composite_items || []), { label: '', input_type: 'text' as TCompositeItem["input_type"], key: '', unit: '' }];
                        handleChange({ composite_items: newItems });
                    }}>
                        <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2" />
                        <span>&nbsp;옵션 추가</span>
                    </div>
                    {/* <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm" onClick={() => {
                        const newItems = [...(question.composite_items || []), { label: '', input_type: 'text' as TCompositeItem["input_type"], key: '', unit: '' }];
                        handleChange({ composite_items: newItems });
                    }}>+ 항목 추가</button> */}
                </div>
            )}
            {/* 주관식(단문/장문) 안내 */}
            {(question.question_type === "short_text" || question.question_type === "long_text") && (
                <div className="text-gray-400 italic mb-2">응답자가 직접 답변을 입력합니다.</div>
            )}
            {/* 드롭다운 미리보기 렌더링 (question_type === 'dropdown'일 때) */}
            {/* {question.question_type === 'dropdown' && question.options && question.options.length > 0 && (
                <div className="mb-2">
                    <DropdownPreview
                        options={question.options}
                        value={question.options[0].value}
                        onChange={() => { }}
                    />
                </div>
            )} */}
            {/* 하단 */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                    <button onClick={onCopy} className="p-2 text-gray-500 hover:text-blue-500" title="복사">복사</button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-500" title="삭제">삭제</button>
                </div>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                    <span className="text-sm">필수</span>
                    <Switch
                        checked={!!question.required}
                        onChange={toggleRequired}
                        className={`${question.required ? 'bg-blue-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    >
                        <span
                            className={`${question.required ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
                        />
                    </Switch>
                </label>
            </div>
        </div>
    );
}

// 옵션 미리보기(드롭다운) 컴포넌트
function DropdownPreview({ options, value, onChange }: { options: TOption[]; value: string; onChange: (v: string) => void }) {
    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative w-64">
                <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="block truncate">{options.find(o => o.value === value)?.label || '선택하세요'}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                </ListboxButton>
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                    {options.map((option) => (
                        <ListboxOption
                            key={option.value}
                            className={({ active }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                            value={option.value}
                        >
                            {({ selected }) => (
                                <>
                                    <span className={`absolute left-2 top-2 flex items-center`}>{selected ? <CheckCircleIcon className="h-5 w-5 text-blue-500" /> : <span className="inline-block w-5" />}</span>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                </>
                            )}
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}

// 체크박스 그룹(다중 선택) 컴포넌트
function CheckboxGroup({ options, value, onChange, renderOption }: { options: TOption[]; value: string[]; onChange: (v: string[]) => void; renderOption: (opt: TOption, checked: boolean, idx: number) => React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            {options.map((opt, idx) => {
                const checked = value.includes(opt.value);
                return (
                    <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded ${checked ? 'bg-blue-50' : ''}`}>
                        <Checkbox
                            checked={checked}
                            onChange={() => {
                                if (checked) onChange(value.filter((v: string) => v !== opt.value));
                                else onChange([...value, opt.value]);
                            }}
                            className={`${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'} mr-2 w-4 h-4 rounded border-2`}
                        />
                        {renderOption(opt, checked, idx)}
                    </label>
                );
            })}
        </div>
    );
}

// 옵션 입력 Combobox
function OptionCombobox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <Combobox value={value} onChange={onChange}>
            <div className="relative w-full">
                <ComboboxInput
                    className="w-full border-b focus:outline-none focus:border-blue-500 bg-transparent py-2 text-base min-h-[40px] px-3 rounded"
                    displayValue={(v: string) => v}
                    onChange={e => onChange(e.target.value)}
                />
                <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {options.map((option, idx) => (
                        <ComboboxOption key={option + idx} value={option} className={({ active }) => `cursor-pointer select-none py-2 px-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>{option}</ComboboxOption>
                    ))}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}

// 복합질문 항목명 Combobox
function CompositeItemCombobox({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
        <Combobox value={value} onChange={onChange}>
            <div className="relative w-32">
                <ComboboxInput
                    className="w-full border rounded px-3 py-2 text-base min-h-[40px]"
                    displayValue={(v: string) => v}
                    onChange={e => onChange(e.target.value)}
                />
                <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                    {options.map((option, idx) => (
                        <ComboboxOption key={option + idx} value={option} className={({ active }) => `cursor-pointer select-none py-2 px-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}>{option}</ComboboxOption>
                    ))}
                </ComboboxOptions>
            </div>
        </Combobox>
    );
}