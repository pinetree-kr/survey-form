"use client"

import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { COMPOSITE_INPUT_TYPE_OPTIONS, TQuestion, TQuestionType, TOption, TBranchCondition } from "@/app/components";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, RadioGroup, Checkbox, Textarea, Switch } from "@headlessui/react";
import { TCompositeItem } from "@/app/components";
import { ChevronUpDownIcon } from "@heroicons/react/24/solid";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { QUESTION_TYPE_OPTIONS } from "@/app/components";
import { ImagePreview, CompositeItemCombobox, ImageUrlModal, BranchModal, ConditionModal, useFormEditor } from "./";
import { formatCondition } from '@/lib/survey-utils'

// 디바운스 훅
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// 옵션 비교 함수 수정 - next_question_id도 포함
const areOptionsEqual = (options1: TOption[] | undefined, options2: TOption[] | undefined): boolean => {
    if (!options1 && !options2) return true;
    if (!options1 || !options2) return false;
    if (options1.length !== options2.length) return false;

    return options1.every((opt1, index) => {
        const opt2 = options2[index];
        return opt1.key === opt2.key &&
            opt1.label === opt2.label &&
            opt1.next_question_id === opt2.next_question_id; // next_question_id도 비교
    });
};

// QuestionPanel 메모이제이션 비교 함수
const areQuestionPropsEqual = (prevProps: any, nextProps: any) => {
    return (
        prevProps.questionIndex === nextProps.questionIndex &&
        prevProps.question.id === nextProps.question.id &&
        prevProps.question.title === nextProps.question.title &&
        JSON.stringify(prevProps.question.options) === JSON.stringify(nextProps.question.options) &&
        prevProps.question.question_type === nextProps.question.question_type &&
        prevProps.question.required === nextProps.question.required &&
        prevProps.question.is_hidden === nextProps.question.is_hidden &&
        JSON.stringify(prevProps.question.show_conditions) === JSON.stringify(nextProps.question.show_conditions) &&
        prevProps.question.hasEtc === nextProps.question.hasEtc &&
        prevProps.question.next_question_id === nextProps.question.next_question_id
    );
};

export const QuestionPanel = React.memo(({
    question,
    questionIndex
}: {
    question: TQuestion;
    questionIndex: number;
}) => {
    const { updateQuestion, deleteQuestion, copyQuestion, deletingQuestionId, registerQuestionObserver, unregisterQuestionObserver } = useFormEditor();

    // Observer 등록/해제
    useEffect(() => {
        registerQuestionObserver(question.id, questionIndex);

        return () => {
            unregisterQuestionObserver(question.id);
        };
    }, [question.id, questionIndex, registerQuestionObserver, unregisterQuestionObserver]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: questionIndex });

    // 모달 상태들
    const [imageModal, setImageModal] = useState<null | { type: 'question' | 'option', optIdx?: number, urls: string[] }>(null);
    const [branchModal, setBranchModal] = useState<null | { optIdx: number }>(null);
    const [conditionModal, setConditionModal] = useState<boolean>(false);
    const [nextQuestionModal, setNextQuestionModal] = useState<boolean>(false);

    // 로컬 상태로 즉시 반응하는 UI
    const [localTitle, setLocalTitle] = useState(question.title);
    const [localOptions, setLocalOptions] = useState(question.options || []);
    const [localRequired, setLocalRequired] = useState(question.required);
    const [localIsHidden, setLocalIsHidden] = useState(question.is_hidden);
    const [localHasEtc, setLocalHasEtc] = useState(question.hasEtc);
    const [localQuestionType, setLocalQuestionType] = useState(question.question_type);

    // 입력 소스 추적 (키보드 입력 vs 외부 데이터)
    const [isUserInput, setIsUserInput] = useState(false);

    // 디바운스된 값들 (키보드 입력에만 적용)
    const debouncedTitle = useDebounce(isUserInput ? localTitle : question.title, 300);
    const debouncedOptions = useDebounce(isUserInput ? localOptions : question.options || [], 300);
    const debouncedRequired = useDebounce(isUserInput ? localRequired : question.required, 300);
    const debouncedIsHidden = useDebounce(isUserInput ? localIsHidden : question.is_hidden, 300);
    const debouncedHasEtc = useDebounce(isUserInput ? localHasEtc : question.hasEtc, 300);
    const debouncedQuestionType = useDebounce(isUserInput ? localQuestionType : question.question_type, 300);

    // 디바운스 상태 추적
    const [isTitleDebouncing, setIsTitleDebouncing] = useState(false);
    const [isOptionsDebouncing, setIsOptionsDebouncing] = useState(false);

    const { findQuestionIndexById, findQuestionById } = useFormEditor();

    // 디바운스 상태 업데이트 (키보드 입력일 때만)
    useEffect(() => {
        if (isUserInput) {
            setIsTitleDebouncing(localTitle !== debouncedTitle);
        } else {
            setIsTitleDebouncing(false);
        }
    }, [localTitle, debouncedTitle, isUserInput]);

    useEffect(() => {
        if (isUserInput) {
            setIsOptionsDebouncing(JSON.stringify(localOptions) !== JSON.stringify(debouncedOptions));
        } else {
            setIsOptionsDebouncing(false);
        }
    }, [localOptions, debouncedOptions, isUserInput]);

    // 디바운스된 값이 변경되면 부모에게 업데이트 (키보드 입력일 때만)
    useEffect(() => {
        if (isUserInput && debouncedTitle !== question.title) {
            updateQuestion({ ...question, title: debouncedTitle });
        }
    }, [debouncedTitle, question, updateQuestion, isUserInput]);

    useEffect(() => {
        if (isUserInput && !areOptionsEqual(debouncedOptions, question.options)) {
            updateQuestion({ ...question, options: debouncedOptions });
        }
    }, [debouncedOptions, question, updateQuestion, isUserInput]);

    useEffect(() => {
        if (isUserInput && debouncedRequired !== question.required) {
            updateQuestion({ ...question, required: debouncedRequired });
        }
    }, [debouncedRequired, question, updateQuestion, isUserInput]);

    useEffect(() => {
        if (isUserInput && debouncedIsHidden !== question.is_hidden) {
            updateQuestion({ ...question, is_hidden: debouncedIsHidden });
        }
    }, [debouncedIsHidden, question, updateQuestion, isUserInput]);

    useEffect(() => {
        if (isUserInput && debouncedHasEtc !== question.hasEtc) {
            updateQuestion({ ...question, hasEtc: debouncedHasEtc });
        }
    }, [debouncedHasEtc, question, updateQuestion, isUserInput]);

    useEffect(() => {
        if (isUserInput && debouncedQuestionType !== question.question_type) {
            const patch: Partial<TQuestion> = { question_type: debouncedQuestionType };
            if (["single_choice", "multiple_choice", "dropdown"].includes(debouncedQuestionType)) {
                patch.options = localOptions && localOptions.length > 0 ? localOptions : [{ label: '', key: '' }];
                patch.composite_items = undefined;
            } else if (["composite_single", "composite_multiple"].includes(debouncedQuestionType)) {
                patch.composite_items = question.composite_items && question.composite_items.length > 0 ? question.composite_items : [{ label: '', input_type: 'text' as TCompositeItem["input_type"], key: '', unit: '' }];
                patch.options = undefined;
            } else if (debouncedQuestionType === "description") {
                patch.options = undefined;
                patch.composite_items = undefined;
                patch.required = false;
            } else {
                patch.options = undefined;
                patch.composite_items = undefined;
            }
            updateQuestion({ ...question, ...patch });
        }
    }, [debouncedQuestionType, question, updateQuestion, isUserInput, localOptions]);

    // question이 외부에서 변경되면 로컬 상태 동기화 (외부 데이터 로딩)
    useEffect(() => {
        setLocalTitle(question.title);
        setIsUserInput(false); // 외부 데이터 로딩임을 표시
    }, [question.title]);

    useEffect(() => {
        setLocalOptions(question.options || []);
        setIsUserInput(false); // 외부 데이터 로딩임을 표시
    }, [question.options]);

    useEffect(() => {
        setLocalRequired(question.required);
        setIsUserInput(false);
    }, [question.required]);

    useEffect(() => {
        setLocalIsHidden(question.is_hidden);
        setIsUserInput(false);
    }, [question.is_hidden]);

    useEffect(() => {
        setLocalHasEtc(question.hasEtc);
        setIsUserInput(false);
    }, [question.hasEtc]);

    useEffect(() => {
        setLocalQuestionType(question.question_type);
        setIsUserInput(false);
    }, [question.question_type]);

    // 스타일은 useMemo로 최적화 (계산이 필요함)
    const style = useMemo(() => ({
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }), [transform, transition, isDragging]);

    // 핵심 업데이트 함수만 useCallback 사용
    const handleChange = useCallback((patch: Partial<TQuestion>) => {
        updateQuestion({ ...question, ...patch });
    }, [question, updateQuestion]);

    // 단순한 이벤트 핸들러들은 useCallback 불필요
    const addOption = () => {
        setIsUserInput(true); // 키보드 입력임을 표시
        const newOptions = [...localOptions, { label: "", key: "" }];
        setLocalOptions(newOptions);
    };

    const deleteOption = (idx: number) => {
        setIsUserInput(true); // 키보드 입력임을 표시
        const newOptions = localOptions.filter((_, i) => i !== idx);
        setLocalOptions(newOptions);
    };

    const updateOption = (idx: number, value: string) => {
        setIsUserInput(true); // 키보드 입력임을 표시
        const newOptions = localOptions.map((opt, i) =>
            i === idx ? { ...opt, label: value, key: value } : opt
        );

        setLocalOptions(newOptions);
    };

    const addEtcOption = () => {
        setIsUserInput(true); // 클릭 입력임을 표시
        setLocalHasEtc(true);
    };

    const toggleRequired = () => {
        setIsUserInput(true); // 클릭 입력임을 표시
        setLocalRequired(!localRequired);
    };

    const toggleHidden = () => {
        setIsUserInput(true); // 클릭 입력임을 표시
        const newHiddenState = !localIsHidden;
        setLocalIsHidden(newHiddenState);

        // show_conditions는 즉시 업데이트 (조건부 로직이므로)
        if (!newHiddenState) {
            // 가리기를 비활성화하면 활성화 조건도 제거
            updateQuestion({ ...question, show_conditions: undefined });
        }
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setIsUserInput(true); // 키보드 입력임을 표시
        setLocalTitle(e.target.value);
    };

    // 복잡한 로직이 있는 함수만 useCallback 사용
    const handleTypeChange = useCallback((qt: TQuestionType) => {
        setIsUserInput(true); // 클릭 입력임을 표시
        setLocalQuestionType(qt);

        // question_type 변경 시 관련 속성들도 즉시 업데이트
        if (["single_choice", "multiple_choice", "dropdown"].includes(qt)) {
            setLocalOptions(localOptions && localOptions.length > 0 ? localOptions : [{ label: '', key: '' }]);
        } else if (qt === "description") {
            setLocalRequired(false);
        }
    }, [localOptions]);

    // 계산이 필요한 값들만 useMemo 사용
    // const questionNumber = useMemo(() => {
    //     return questions.findIndex(q => q.id === question.id) + 1;
    // }, [questions, question.id]);

    const questionNumber = useMemo(() => {
        return findQuestionIndexById(question.id) + 1;
    }, [findQuestionIndexById, question.id]);

    const nextQuestionNumber = useMemo(() => {
        if (!question.next_question_id) return null;
        return questionNumber + 1;
    }, [questionNumber, question.next_question_id]);

    const getQuestionNumber = useCallback((questionId: string) => {
        return questionNumber !== -1 ? questionNumber + 1 : '?';
    }, [questionNumber]);

    const handleShowConditionDelete = useCallback((condIndex: number) => {
        if (!question.show_conditions) return;

        const newConditions = question.show_conditions.filter((_, i) => i !== condIndex);
        const updatedQuestion = { ...question, show_conditions: newConditions };
        updateQuestion(updatedQuestion);
    }, [updateQuestion, question]);

    // 조건부 표시 정보는 useMemo로 최적화
    const showConditionsInfo = useMemo(() => {
        if (!question.show_conditions || question.show_conditions?.length === 0) return null;

        return question.show_conditions.map((condition, condIndex) => {

            const targetQuestion = findQuestionById(condition.question_id)
            const targetQuestionNumber = findQuestionIndexById(condition.question_id) + 1;

            return (
                <div key={condIndex}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-300 text-gray-800 text-xs rounded-full hover:bg-gray-400 transition-colors">
                    <span>{formatCondition(condition, targetQuestion, targetQuestionNumber)}</span>
                    <button
                        onClick={() => {
                            handleShowConditionDelete(condIndex)
                        }}
                        className="text-gray-600 hover:text-red-500 transition-colors font-bold text-sm"
                        title="조건 삭제"
                    >
                        ✕
                    </button>
                </div>
            )
        });
    }, [question, findQuestionById, findQuestionIndexById, handleShowConditionDelete]);

    // 브랜치 추가 함수 추가 (handleChange 함수 다음에 추가)
    const handleBranchAdd = useCallback((optIdx: number, nextQuestionId: string | null) => {

        if (nextQuestionId === null) {
            // "다음 문항으로 진행하기" 선택 시 연결 제거
            if (question.question_type === 'composite_single') {
                const compositeItems = [...(question.composite_items || [])];
                compositeItems[optIdx] = {
                    ...compositeItems[optIdx],
                    next_question_id: undefined
                };
                handleChange({ composite_items: compositeItems });
            } else {
                const updatedOptions = localOptions.map((opt, idx) =>
                    idx === optIdx
                        ? { ...opt, next_question_id: undefined }
                        : opt
                );
                setLocalOptions(updatedOptions);
            }
        } else {
            // 기존 로직 (문항 선택)
            if (question.question_type === 'composite_single') {
                // composite_single 문항의 경우 composite_items 수정
                const compositeItems = [...(question.composite_items || [])];
                compositeItems[optIdx] = {
                    ...compositeItems[optIdx],
                    next_question_id: nextQuestionId
                };
                handleChange({ composite_items: compositeItems });
            } else {
                // 기존 로직 (single_choice, multiple_choice 등)
                const updatedOptions = localOptions.map((opt, idx) =>
                    idx === optIdx
                        ? { ...opt, next_question_id: nextQuestionId }
                        : opt
                );
                setLocalOptions(updatedOptions);
            }
        }
        setBranchModal(null);
    }, [localOptions, question.composite_items, question.question_type, handleChange]);

    // 브랜치 삭제 함수 추가
    const handleBranchDelete = useCallback((optIdx: number) => {

        if (question.question_type === 'composite_single') {
            // composite_single 문항의 경우 composite_items 수정
            const compositeItems = [...(question.composite_items || [])];
            compositeItems[optIdx] = {
                ...compositeItems[optIdx],
                next_question_id: undefined
            };
            handleChange({ composite_items: compositeItems });
        } else {
            // 기존 로직 (single_choice, multiple_choice 등)
            const updatedOptions = localOptions.map((opt, idx) =>
                idx === optIdx
                    ? { ...opt, next_question_id: undefined }
                    : opt
            );
            setLocalOptions(updatedOptions);
        }
    }, [localOptions, question.composite_items, question.question_type, handleChange]);

    // 조건부 표시 추가 핸들러
    const handleShowConditionAdd = useCallback((condition: TBranchCondition) => {
        const existingConditions = question.show_conditions || [];
        const newConditions = [...existingConditions, condition];
        handleChange({ show_conditions: newConditions });
        setConditionModal(false);
    }, [handleChange, question.show_conditions]);


    // 다음 문항 연결 추가 핸들러
    const handleNextQuestionAdd = useCallback((nextQuestionId: string | null) => {
        if (nextQuestionId === null) {
            // "다음 문항으로 진행하기" 선택 시 연결 제거
            handleChange({ next_question_id: undefined });
        } else {
            // 기존 로직 (문항 선택)
            handleChange({ next_question_id: nextQuestionId });
        }
        setNextQuestionModal(false);
    }, [handleChange]);

    // 다음 문항 연결 제거 핸들러
    const handleNextQuestionDelete = useCallback(() => {
        const updatedQuestion = { ...question, next_question_id: undefined };

        updateQuestion(updatedQuestion);
    }, [updateQuestion, question]);

    // 이미지 저장 핸들러
    const handleImageSave = useCallback((urls: string[]) => {
        if (!imageModal) return;

        if (imageModal.type === 'question') {
            handleChange({ images: urls });
        } else if (imageModal.type === 'option' && imageModal.optIdx !== undefined) {
            const opts = [...(question.options || [])];
            opts[imageModal.optIdx] = {
                ...opts[imageModal.optIdx],
                images: urls
            };
            handleChange({ options: opts });
        }
        setImageModal(null);
    }, [imageModal, handleChange, question.options]);

    // 이미지 클릭 핸들러
    const handleImageClick = useCallback((type: 'question' | 'option', optIdx?: number) => {
        let urls: string[] = [];
        if (type === 'question' && question.images) urls = question.images;
        if (type === 'option' && optIdx !== undefined && question.options && question.options[optIdx]?.images) urls = question.options[optIdx].images;
        setImageModal({ type, optIdx, urls });
    }, [question.images, question.options]);

    // 분기 추가 클릭 핸들러
    const handleBranchAddClick = useCallback((optIdx: number) => {
        setBranchModal({ optIdx });
    }, []);

    // 조건부 표시 추가 클릭 핸들러
    const handleShowConditionAddClick = useCallback(() => {
        setConditionModal(true);
    }, []);

    // 다음 문항 연결 추가 클릭 핸들러
    const handleNextQuestionAddClick = useCallback(() => {
        setNextQuestionModal(true);
    }, []);

    return (
        <div
            ref={setNodeRef}
            style={style}
            id={`question-${question.id}`}
            className={`bg-white rounded-lg shadow-md border-l-4 ${question.is_hidden ? 'border-red-500 opacity-75' : 'border-blue-500'} p-6 mb-6 transition-all duration-200 question-panel-optimized ${question.id === deletingQuestionId ? 'question-delete' : ''} ${isDragging ? 'question-dragging' : ''}`}
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
                    <span className="text-gray-400 font-bold select-none ml-1" style={{ minWidth: 32, textAlign: 'center' }}>
                        {questionNumber}번
                        {question.is_hidden && <span className="ml-1 text-red-500" title="가려진 문항">👁️‍🗨️</span>}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-1 text-gray-400 hover:text-blue-500" title="이미지 추가" onClick={() => handleImageClick('question')}><span>🖼️</span></button>
                    <Listbox value={question.question_type} onChange={handleTypeChange}>
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
                className={`w-full border rounded px-3 py-2 text-base min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isTitleDebouncing ? 'input-debouncing' : ''}`}
                placeholder="질문을 입력하세요"
                value={localTitle}
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
                <RadioGroup value={localOptions?.[0]?.key || ''} onChange={() => { }} className="space-y-2 mb-2">
                    {localOptions?.map((opt, idx) => (
                        <div key={`${questionIndex}-${idx}`} className="flex flex-row gap-2 mt-1 items-center">
                            <span className="inline-block w-4 h-4 rounded-full border border-blue-400 bg-white mr-2 self-center" />
                            <div className="flex items-center text-blue-600 cursor-pointer flex-1">
                                <input
                                    type="text"
                                    value={opt.key}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                    onKeyDown={(e) => {
                                        // 스페이스바 입력 허용
                                        if (e.key === ' ') {
                                            e.stopPropagation();
                                        }
                                    }}
                                    className={`border-b-2 border-blue-200 border-dashed bg-transparent text-blue-600 flex-1 min-w-0 focus:ring-0 focus:outline-none focus:border-blue-500 transition-colors ${isOptionsDebouncing ? 'input-debouncing' : ''}`}
                                    placeholder="옵션 텍스트"
                                />
                            </div>
                            <div className="flex items-center gap-1 min-w-[150px] justify-end">
                                {
                                    question.question_type === "single_choice" && (
                                        opt.next_question_id ? (
                                            <button
                                                onClick={() => handleBranchDelete(idx)}
                                                className="px-2 py-1 text-green-600 bg-green-100 hover:bg-green-200 text-xs flex items-center gap-1"
                                            >
                                                → {findQuestionIndexById(opt.next_question_id) + 1}번
                                                <span className="text-red-500 font-bold">✕</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBranchAddClick(idx)}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                                            >
                                                선택시 이동
                                            </button>
                                        )
                                    )}
                                <button onClick={() => handleImageClick('option', idx)} className="p-1 text-gray-400 hover:bg-blue-200 rounded" title="이미지 추가">🖼️</button>
                                <button onClick={() => deleteOption(idx)} className="p-1 text-red-400 hover:text-red-200 rounded" title="삭제">✕</button>
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
                                className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer min-w-[20px] min-h-[20px] flex items-center justify-center"
                                title="기타 옵션 제거"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleChange({ hasEtc: false });
                                }}
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
                    {localOptions?.map((opt, idx) => (
                        <div key={`${questionIndex}-${idx}`} className="flex flex-row gap-2 mt-1 items-center">
                            <Checkbox checked={false} onChange={() => { }} className="border-blue-400 bg-white mr-2 w-4 h-4 rounded border self-center" />
                            <div className="flex items-center text-blue-600 cursor-pointer flex-1">
                                <input
                                    type="text"
                                    value={opt.key}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                    onKeyDown={(e) => {
                                        // 스페이스바 입력 허용
                                        if (e.key === ' ') {
                                            e.stopPropagation();
                                        }
                                    }}
                                    className={`border-b-2 border-blue-200 bg-transparent text-blue-600 flex-1 min-w-0 focus:ring-0 focus:outline-none focus:border-blue-500 transition-colors ${isOptionsDebouncing ? 'input-debouncing' : ''}`}
                                    placeholder="옵션 텍스트"
                                />
                            </div>
                            <div className="flex items-center gap-1 min-w-[150px] justify-end">
                                <button onClick={() => handleImageClick('option', idx)} className="p-1 text-gray-400 hover:text-blue-500" title="이미지 추가">📷</button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deleteOption(idx);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer min-w-[20px] min-h-[20px] flex items-center justify-center"
                                    title="삭제"
                                >
                                    ✕
                                </button>
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
                                className="ml-1 p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer min-w-[20px] min-h-[20px] flex items-center justify-center"
                                title="기타 옵션 제거"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleChange({ hasEtc: false });
                                }}
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
                                value={item.key}
                                onChange={v => {
                                    const newItems = [...(question.composite_items || [])];
                                    newItems[idx] = { ...item, label: v.trim(), key: v.trim() };
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
                                                onClick={() => handleBranchDelete(idx)}
                                                className="px-2 py-1 text-green-600 bg-green-100 hover:bg-green-200 text-xs flex items-center gap-1"
                                            >
                                                → {findQuestionIndexById(item.next_question_id) + 1}번
                                                <span className="text-red-500 font-bold">✕</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBranchAddClick(idx)}
                                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                                            >
                                                선택시 이동
                                            </button>
                                        )
                                    )}
                                <button
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer min-w-[20px] min-h-[20px] flex items-center justify-center"
                                    title="삭제"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const newItems = (question.composite_items || []).filter((_, i) => i !== idx);
                                        handleChange({ composite_items: newItems });
                                    }}
                                >
                                    ✕
                                </button>
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

            {/* 문항 설정 섹션 구분선 */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* 문항 설정 섹션 */}
            <div className="space-y-4">
                <div className="text-sm font-medium text-gray-700 mb-3">문항 설정</div>

                {/* 문항 토글 설정 */}
                <div className="flex items-center gap-4">
                    <label className={`flex items-center gap-1 select-none ${localQuestionType === "description" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
                        <span className="text-sm">필수</span>
                        <Switch
                            checked={!!localRequired}
                            onChange={toggleRequired}
                            disabled={localQuestionType === "description"}
                            className={`${localRequired ? 'bg-blue-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localQuestionType === "description" ? "opacity-50" : ""}`}
                        >
                            <span
                                className={`${localRequired ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
                            />
                        </Switch>
                    </label>
                    <label className="flex items-center gap-1 select-none cursor-pointer" title="문항을 가려서 조건부로만 표시">
                        <span className="text-sm">가리기</span>
                        <Switch
                            checked={!!localIsHidden}
                            onChange={toggleHidden}
                            className={`${localIsHidden ? 'bg-red-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                        >
                            <span
                                className={`${localIsHidden ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform`}
                            />
                        </Switch>
                    </label>
                </div>

                {/* 가려진 문항 안내 */}
                {localIsHidden && (
                    <div className="text-red-500 italic mb-2 bg-red-50 p-2 rounded">
                        ⚠️ 이 문항은 가려진 상태입니다. 활성화 조건을 설정해야 응답자에게 표시됩니다.
                    </div>
                )}

                {/* 문항 활성화 조건 섹션 */}
                {localIsHidden && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-amber-800">활성화 조건 (OR)</span>
                        </div>
                        {showConditionsInfo ? (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {showConditionsInfo}
                                </div>
                                <button
                                    onClick={handleShowConditionAddClick}
                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-xs transition-colors flex items-center gap-1 w-fit shadow-sm"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    추가
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="flex flex-col items-center gap-3 text-amber-700">
                                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm">
                                        <p className="font-medium mb-1">활성화 조건이 없습니다</p>
                                        <p className="text-amber-600">아래의 &#34;추가&#34; 버튼을 클릭하여 조건을 설정해주세요</p>
                                        <p className="text-amber-500 text-xs mt-1">※ 여러 조건을 설정하면 OR 조건으로 작동합니다</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleShowConditionAddClick}
                                    className="px-3 py-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 text-xs transition-colors flex items-center gap-1 mx-auto mt-4 shadow-sm"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    추가
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 다음 문항으로 이동 섹션 */}
                <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">응답 후 이동</div>
                    <button
                        onClick={handleNextQuestionAddClick}
                        className="px-3 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded text-sm border border-purple-200 flex items-center justify-between w-full"
                    >
                        <span>{nextQuestionNumber ? `${nextQuestionNumber}번 문항으로 진행하기` : '다음 문항으로 진행하기'}</span>
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* 문항 기본 설정 */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                        <button onClick={() => copyQuestion(question.id)} className="p-2 text-gray-500 hover:text-blue-500" title="복사">복사</button>
                        <button
                            onClick={() => deleteQuestion(question.id)}
                            className="p-2 text-gray-500 hover:text-red-500"
                            title="삭제"
                            style={{ pointerEvents: 'auto' }}
                        >
                            삭제
                        </button>
                    </div>
                </div>
            </div>

            {/* 모달들 */}
            <ImageUrlModal
                open={!!imageModal}
                urls={imageModal?.urls || []}
                onChange={urls => setImageModal(imageModal ? { ...imageModal, urls } : null)}
                onCancel={() => setImageModal(null)}
                onSave={handleImageSave}
            />

            <BranchModal
                isOpen={!!branchModal}
                onClose={() => setBranchModal(null)}
                onAdd={(nextQuestionId) => {
                    if (branchModal) {
                        handleBranchAdd(branchModal.optIdx, nextQuestionId);
                    }
                }}
            />

            <BranchModal
                isOpen={nextQuestionModal}
                onClose={() => setNextQuestionModal(false)}
                onAdd={(nextQuestionId) => {
                    handleNextQuestionAdd(nextQuestionId);
                }}
            />

            <ConditionModal
                isOpen={conditionModal}
                onClose={() => setConditionModal(false)}
                onAdd={handleShowConditionAdd}
            />
        </div>
    );
}, areQuestionPropsEqual);

QuestionPanel.displayName = 'QuestionPanel';