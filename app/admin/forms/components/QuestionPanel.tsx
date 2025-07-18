"use client"

import { TQuestion, TQuestionType } from "@/app/components";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, RadioGroup, Checkbox, Textarea, Switch } from "@headlessui/react";
import { TCompositeItem } from "@/app/components";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { QUESTION_TYPE_OPTIONS, COMPOSITE_INPUT_TYPE_OPTIONS, OPERATORS } from "@/app/components";
import { ImagePreview, CompositeItemCombobox } from "./";

// 문항 패널 컴포넌트
export function QuestionPanel({
    question,
    questionIndex,
    onUpdate,
    onDelete,
    onCopy,
    onImageClick,
    questions,
    onBranchAdd,
    onBranchDelete,
    onShowConditionAdd,
    onShowConditionDelete,
    deletingQuestionId,
}: {
    question: TQuestion;
    questionIndex: number;
    onUpdate: (question: TQuestion) => void;
    onDelete: () => void;
    onCopy: () => void;
    onImageClick: (type: 'question' | 'option', optIdx?: number) => void;
    questions: TQuestion[];
    onBranchAdd: (optIdx: number) => void;
    onBranchDelete: (optIdx: number) => void;
    onShowConditionAdd: () => void;
    onShowConditionDelete: (idx: number) => void;
    deletingQuestionId?: string | null;
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
    const updateOption = (idx: number, value: string) => handleChange({ options: question.options?.map((opt, i) => i === idx ? { ...opt, label: value, value } : opt) });
    const updateOptionValue = (idx: number, value: string) => handleChange({ options: question.options?.map((opt, i) => i === idx ? { ...opt, value } : opt) });
    const addEtcOption = () => handleChange({ hasEtc: true });
    // 필수 토글
    const toggleRequired = () => handleChange({ required: !question.required });
    // 질문 유형 변경
    const handleTypeChange = (qt: TQuestionType) => handleChange({ question_type: qt });
    // 질문 텍스트 변경
    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange({ title: e.target.value });


    return (
        <div
            ref={setNodeRef}
            style={style}
            id={`question-${question.id}`}
            className={`bg-white rounded-lg shadow-md border-l-4 border-blue-500 p-6 mb-6 ${question.id === deletingQuestionId ? 'question-delete' : ''}`}
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
                    <span className="text-gray-400 font-bold select-none ml-1" style={{ minWidth: 32, textAlign: 'center' }}>{questions.findIndex(q => q.id === question.id) + 1}번</span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-blue-500" title="이미지 추가" onClick={() => onImageClick('question')}><span>🖼️</span></button>
                    <Listbox value={question.question_type} onChange={qt => {
                        const patch: Partial<TQuestion> = { question_type: qt };
                        if (["single_choice", "multiple_choice", "dropdown"].includes(qt)) {
                            patch.options = question.options && question.options.length > 0 ? question.options : [{ label: '', value: '' }];
                            patch.composite_items = undefined;
                        } else if (["composite_single", "composite_multiple"].includes(qt)) {
                            patch.composite_items = question.composite_items && question.composite_items.length > 0 ? question.composite_items : [{ label: '', input_type: 'text' as TCompositeItem["input_type"], key: '', unit: '' }];
                            patch.options = undefined;
                        } else if (qt === "description") {
                            patch.options = undefined;
                            patch.composite_items = undefined;
                            patch.required = false; // 안내문은 필수가 될 수 없음
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
                                        key={`${option.value}-${option.label}`}
                                        value={option.value}
                                        className={({ focus }) => `relative cursor-pointer select-none py-2 pl-10 pr-4 ${focus ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`}
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
                onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
                        <div key={`${questionIndex}-${idx}`} className="flex flex-row gap-2 mt-1 items-center">
                            <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2 self-center" />
                            <div className="flex items-center text-blue-600 cursor-pointer flex-1">
                                <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                    className="border-b-2 border-blue-200 border-dashed bg-transparent text-blue-600 flex-1 min-w-0 focus:ring-0 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="옵션 텍스트"
                                />
                            </div>
                            <div className="flex items-center gap-1 min-w-[150px] justify-end">
                                {
                                    question.question_type === "single_choice" && (
                                        opt.next_question_id ? (
                                            <>
                                                {/* <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                                    → {parseInt(opt.next_question_id) + 1}번
                                                </span> */}
                                                <button
                                                    onClick={() => onBranchDelete(idx)}
                                                    className="px-2 py-1 text-green-600 bg-green-100 hover:bg-green-200 text-xs"
                                                >
                                                    → {questions.findIndex(q => q.id === opt.next_question_id) + 1}번
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => onBranchAdd(idx)}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                                            >
                                                선택시 이동
                                            </button>
                                        )
                                    )}
                                <button onClick={() => onImageClick('option', idx)} className="p-1 text-gray-400 hover:bg-blue-200 rounded" title="이미지 추가">🖼️</button>
                                <button onClick={() => deleteOption(idx)} className="p-1 text-red-400 hover:bg-red-200 rounded" title="삭제">✕</button>
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
                        <div key={`${questionIndex}-${idx}`} className="flex flex-row gap-2 mt-1 items-center">
                            <Checkbox checked={false} onChange={() => { }} className="border-blue-400 bg-white mr-2 w-4 h-4 rounded border self-center" />
                            <div className="flex items-center text-blue-600 cursor-pointer flex-1">
                                <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                    className="border-b-2 border-blue-200 bg-transparent text-blue-600 flex-1 min-w-0 focus:ring-0 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="옵션 텍스트"
                                />
                            </div>
                            <div className="flex items-center gap-1 min-w-[150px] justify-end">
                                <button onClick={() => onImageClick('option', idx)} className="p-1 text-gray-400 hover:text-blue-500" title="이미지 추가">📷</button>
                                <button onClick={() => deleteOption(idx)} className="p-1 text-gray-400 hover:text-red-500" title="삭제">✕</button>
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
                </div>
            )}
            {/* 복합질문 하위 항목 UI */}
            {["composite_single", "composite_multiple"].includes(question.question_type) && (
                <div className="mb-2">
                    <div className="font-semibold mb-1">복합질문 항목</div>
                    {(question.composite_items || []).map((item, idx) => (
                        <div key={`${questionIndex}-${idx}`} className="flex items-center gap-2 mb-3">
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
                                className="border-b-2 border-blue-200 border-dashed bg-transparent text-blue-600 flex-1 min-w-0 focus:ring-0 focus:outline-none focus:border-blue-500 transition-colors"
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
                                                key={`${questionIndex}-${idx}-${option.value}`}
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
                            <div className="flex items-center gap-1 ml-auto min-w-[150px] justify-end">
                                {
                                    question.question_type === "composite_single" && (
                                        item.next_question_id ? (
                                            <button
                                                onClick={() => onBranchDelete(idx)}
                                                className="px-2 py-1 text-green-600 bg-green-100 hover:bg-green-200 text-xs"
                                            >
                                                → {questions.findIndex(q => q.id === item.next_question_id) + 1}번
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onBranchAdd(idx)}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                                            >
                                                선택시 이동
                                            </button>
                                        )
                                    )}
                                <button className="p-1 text-gray-400 hover:text-red-500" title="삭제" onClick={() => {
                                    const newItems = (question.composite_items || []).filter((_, i) => i !== idx);
                                    handleChange({ composite_items: newItems });
                                }}>✕</button>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center text-blue-600 cursor-pointer" onClick={() => {
                        const newItems = [...(question.composite_items || []), { label: '', input_type: 'text' as TCompositeItem["input_type"], key: '', unit: '' }];
                        handleChange({ composite_items: newItems });
                    }}>
                        <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2" />
                        <span>&nbsp;옵션 추가</span>
                    </div>
                    {/* <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs" onClick={() => {
                        const newItems = [...(question.composite_items || []), { label: '', input_type: 'text' as TCompositeItem["input_type"], key: '', unit: '' }];
                        handleChange({ composite_items: newItems });
                    }}>+ 항목 추가</button> */}
                </div>
            )}
            {/* 주관식(단문/장문) 안내 */}
            {(question.question_type === "short_text" || question.question_type === "long_text") && (
                <div className="text-gray-400 italic mb-2">응답자가 직접 답변을 입력합니다.</div>
            )}
            {/* 안내문 안내 */}
            {question.question_type === "description" && (
                <div className="text-gray-400 italic mb-2">응답을 받지 않고 안내사항을 표시합니다.</div>
            )}

            {/* 문항 패널 하단에 분기/조건부 표시 UI 추가 */}
            <div className="mt-6 space-y-4">
                {/* 접근 조건 버튼 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onShowConditionAdd}
                        className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 text-sm"
                    >
                        접근 조건 추가
                    </button>
                </div>
                {(question.show_conditions?.length) ? (
                    <div className="border-l-4 border-amber-500">
                        {question.show_conditions?.map((condition, idx) => (
                            <button key={idx}
                                className="px-2 h-7 text-green-600 bg-green-100 hover:bg-green-200 text-xs"
                                onClick={() => onShowConditionDelete(idx)}>
                                {
                                    `${questions.find(q => q.id == condition.question_id)?.title} 문항에서 \`${condition.value}\` 선택 시`
                                }
                            </button>

                        ))}
                    </div>
                ) : null}
            </div>

            {/* 하단 */}
            <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2">
                    <button onClick={onCopy} className="p-2 text-gray-500 hover:text-blue-500" title="복사">복사</button>
                    <button 
                        onClick={onDelete} 
                        className="p-2 text-gray-500 hover:text-red-500" 
                        title="삭제"
                        style={{ pointerEvents: 'auto' }}
                    >
                        삭제
                    </button>
                </div>
                <label className={`flex items-center gap-1 select-none ${question.question_type === "description" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                    <span className="text-sm">필수</span>
                    <Switch
                        checked={!!question.required}
                        onChange={toggleRequired}
                        disabled={question.question_type === "description"}
                        className={`${question.required ? 'bg-blue-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${question.question_type === "description" ? "opacity-50" : ""}`}
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