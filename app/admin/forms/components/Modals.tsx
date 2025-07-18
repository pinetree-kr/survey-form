"use client"

import { TQuestion, TBranchCondition, OPERATORS } from "@/app/components";
import { useState, useEffect } from "react";
import { Transition, TransitionChild, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckCircleIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";
import React from "react";

// 분기 모달 컴포넌트
export function BranchModal({
    isOpen,
    onClose,
    questions,
    onAdd
}: {
    isOpen: boolean;
    onClose: () => void;
    questions: TQuestion[];
    onAdd: (nextQuestionId: string) => void;
}) {
    const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = () => {
        if (selectedQuestionId) {
            onAdd(selectedQuestionId);
        }
    };

    // 클라이언트에서만 렌더링
    if (!mounted) return null;

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/30" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                    분기 추가
                                </DialogTitle>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        선택시 다음으로 이동
                                    </label>
                                    <Listbox value={selectedQuestionId} onChange={setSelectedQuestionId}>
                                        <div className="relative">
                                            <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <span className="block truncate">
                                                    {selectedQuestionId ? `${parseInt(selectedQuestionId) + 1}번 ${questions[parseInt(selectedQuestionId)]?.title || ''}` : '문항 선택'}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                            </ListboxButton>
                                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                                                {questions.map((q, qIdx) => (
                                                    <ListboxOption
                                                        key={qIdx}
                                                        value={qIdx.toString()}
                                                        className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className="absolute left-2 top-2 flex items-center">
                                                                    {selected ? <CheckCircleIcon className="h-5 w-5 text-blue-500" /> : <span className="inline-block w-5" />}
                                                                </span>
                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                    {qIdx + 1}번 {q.title ? `- ${q.title}` : ''}
                                                                </span>
                                                            </>
                                                        )}
                                                    </ListboxOption>
                                                ))}
                                            </ListboxOptions>
                                        </div>
                                    </Listbox>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        type="button"
                                        className="flex-1 justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        onClick={onClose}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        onClick={handleSubmit}
                                        disabled={!selectedQuestionId}
                                    >
                                        적용
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

type TSimpleQuestion = {
    title: string;
    question_type: string;
    id: string;
    options?: {
        label: string;
        value: string;
    }[];
    composite_items?: {
        label: string;
        key: string;
    }[];
}

// 조건부 표시 모달 컴포넌트
export function ConditionModal({
    isOpen,
    onClose,
    questions,
    onAdd
}: {
    isOpen: boolean;
    onClose: () => void;
    questions: TSimpleQuestion[];
    onAdd: (condition: TBranchCondition) => void;
}) {
    const [selectedQuestion, setSelectedQuestion] = useState<number>(-1);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [selectedSubKey, setSelectedSubKey] = useState<string>('');
    const [operator, setOperator] = useState<"eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte">('eq');
    const [value, setValue] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const selectedQ = selectedQuestion >= 0 ? questions[selectedQuestion] : null;
    const isChoiceType = selectedQ && ['single_choice', 'multiple_choice'].includes(selectedQ.question_type);
    const isCompositeType = selectedQ && ['composite_single', 'composite_multiple'].includes(selectedQ.question_type);

    const handleSubmit = React.useCallback(() => {
        if (selectedQuestion < 0) return;

        const question = questions[selectedQuestion]

        const condition: TBranchCondition = {
            question_id: question.id,
            operator,
            value: isChoiceType ? selectedOption : value,
            ...(isCompositeType && selectedSubKey && { sub_key: selectedSubKey })
        };

        onAdd(condition);
    }, [selectedQuestion, questions, onAdd]);

    const handleClose = React.useCallback(() => {
        // 상태 초기화
        setSelectedQuestion(-1);
        setSelectedOption('');
        setSelectedSubKey('');
        setOperator('eq');
        setValue('');
        onClose();
    }, [onClose]);

    // 클라이언트에서만 렌더링
    if (!mounted) return null;

    return (
        <Transition show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/30" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[80vh] overflow-y-auto">
                                <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                                    접근 조건 설정
                                </DialogTitle>

                                {/* 1. 문항 선택 */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        번호(문항) 선택
                                    </label>
                                    <Listbox value={selectedQuestion} onChange={setSelectedQuestion}>
                                        <div className="relative">
                                            <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                <span className="block truncate">
                                                    {selectedQuestion >= 0 ? `${selectedQuestion + 1}번 ${questions[selectedQuestion]?.title || ''}` : '문항 선택'}
                                                </span>
                                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                </span>
                                            </ListboxButton>
                                            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                                                {questions.map((q, qIdx) => (
                                                    <ListboxOption
                                                        key={qIdx}
                                                        value={qIdx}
                                                        className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className="absolute left-2 top-2 flex items-center">
                                                                    {selected ? <CheckCircleIcon className="h-5 w-5 text-blue-500" /> : <span className="inline-block w-5" />}
                                                                </span>
                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                    {qIdx + 1}번 {q.title ? `- ${q.title}` : ''}
                                                                </span>
                                                            </>
                                                        )}
                                                    </ListboxOption>
                                                ))}
                                            </ListboxOptions>
                                        </div>
                                    </Listbox>
                                </div>

                                {/* 2. 응답 목록 선택 (choice 타입인 경우) */}
                                {isChoiceType && selectedQ?.options && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            응답 목록 선택
                                        </label>
                                        <Listbox value={selectedOption} onChange={(value) => {
                                            console.log({ value })
                                            setSelectedOption(value)
                                        }}>
                                            <div className="relative">
                                                <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                    <span className="block truncate">
                                                        {selectedOption || '응답 선택'}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </span>
                                                </ListboxButton>
                                                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                                                    {selectedQ.options.map((opt, optIdx) => (
                                                        <ListboxOption
                                                            key={optIdx}
                                                            value={opt.value}
                                                            className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className="absolute left-2 top-2 flex items-center">
                                                                        {selected ? <CheckCircleIcon className="h-5 w-5 text-blue-500" /> : <span className="inline-block w-5" />}
                                                                    </span>
                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                        {opt.label}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </ListboxOption>
                                                    ))}
                                                </ListboxOptions>
                                            </div>
                                        </Listbox>
                                    </div>
                                )}

                                {/* 3. 하위 항목 선택 (composite 타입인 경우) */}
                                {isCompositeType && selectedQ?.composite_items && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            하위 항목 선택
                                        </label>
                                        <Listbox value={selectedSubKey} onChange={setSelectedSubKey}>
                                            <div className="relative">
                                                <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                    <span className="block truncate">
                                                        {selectedSubKey || '하위 항목 선택'}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </span>
                                                </ListboxButton>
                                                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                                                    {selectedQ.composite_items.map((item) => (
                                                        <ListboxOption
                                                            key={item.key}
                                                            value={item.key}
                                                            className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className="absolute left-2 top-2 flex items-center">
                                                                        {selected ? <CheckCircleIcon className="h-5 w-5 text-blue-500" /> : <span className="inline-block w-5" />}
                                                                    </span>
                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                        {item.label}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </ListboxOption>
                                                    ))}
                                                </ListboxOptions>
                                            </div>
                                        </Listbox>
                                    </div>
                                )}

                                {/* 4. 연산자 선택 (composite 타입이거나 choice가 아닌 경우) */}
                                {(!isChoiceType || isCompositeType) && selectedQ && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            연산자
                                        </label>
                                        <Listbox value={operator} onChange={setOperator}>
                                            <div className="relative">
                                                <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                                    <span className="block truncate">
                                                        {OPERATORS.find(o => o.value === operator)?.label || operator}
                                                    </span>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                    </span>
                                                </ListboxButton>
                                                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
                                                    {OPERATORS.map(op => (
                                                        <ListboxOption
                                                            key={op.value}
                                                            value={op.value}
                                                            className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
                                                        >
                                                            {({ selected }) => (
                                                                <>
                                                                    <span className="absolute left-2 top-2 flex items-center">
                                                                        {selected ? <CheckCircleIcon className="h-5 w-5 text-blue-500" /> : <span className="inline-block w-5" />}
                                                                    </span>
                                                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                        {op.label}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </ListboxOption>
                                                    ))}
                                                </ListboxOptions>
                                            </div>
                                        </Listbox>
                                    </div>
                                )}

                                {/* 5. 값 입력 (composite 타입이거나 choice가 아닌 경우) */}
                                {(!isChoiceType || isCompositeType) && selectedQ && (
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            값
                                        </label>
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => setValue(e.target.value)}
                                            className="w-full border rounded px-3 py-2 text-base min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="값을 입력하세요"
                                        />
                                    </div>
                                )}

                                <div className="mt-6 flex gap-3">
                                    <button
                                        type="button"
                                        className="flex-1 justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                        onClick={handleClose}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        onClick={handleSubmit}
                                        disabled={selectedQuestion < 0 || (isChoiceType && !selectedOption) || (isCompositeType && !selectedSubKey) || (!isChoiceType && !value)}
                                    >
                                        추가
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
export function ImageUrlModal({
    open,
    urls,
    onChange,
    onCancel,
    onSave
}: {
    open: boolean;
    urls: string[];
    onChange: (urls: string[]) => void;
    onCancel: () => void;
    onSave: (urls: string[]) => void;
}) {
    // 모달이 열릴 때 urls가 비어있으면 빈 값 하나 추가
    useEffect(() => {
        if (open && (!urls || urls.length === 0)) {
            onChange([""]);
        }
        // eslint-disable-next-line
    }, [open]);

    const handleSave = () => {
        const filtered = (urls || []).map(s => s.trim()).filter(Boolean);
        onSave(filtered);
    };

    return (
        <Dialog open={open} onClose={onCancel} className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-gray-500/30" aria-hidden="true" />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 z-10">
                <h2 className="text-lg font-semibold mb-4">이미지 URL 입력</h2>
                <div className="space-y-2 mb-4">
                    {urls.map((url, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                            <input
                                type="text"
                                className="flex-1 border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="이미지 URL 입력"
                                value={url}
                                onChange={e => {
                                    const newUrls = [...urls];
                                    newUrls[idx] = e.target.value;
                                    onChange(newUrls);
                                }}
                            />
                            <button
                                onClick={() => {
                                    const newUrls = urls.filter((_, i) => i !== idx);
                                    onChange(newUrls.length === 0 ? [""] : newUrls);
                                }}
                                className="px-2 py-1 text-red-500 hover:text-white hover:bg-red-500 rounded"
                                title="삭제"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => onChange([...urls, ""])}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    >
                        URL 추가
                    </button>
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border rounded">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded">저장</button>
                </div>
            </div>
        </Dialog>
    );
} 