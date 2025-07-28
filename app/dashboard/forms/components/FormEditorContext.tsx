"use client"

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from "react";
import { TSurvey, TQuestion } from "@/app/components";
import { v4 as uuidv4 } from 'uuid';

interface FormEditorContextValue {
    // Form State - 분리된 상태
    questions: TQuestion[];
    formBasicInfo: Omit<TSurvey, 'questions'>;
    activeQuestionIndex: number | null;
    deletingQuestionId: string | null;
    isSaving: boolean;

    // Form Actions - 분리된 액션
    updateFormBasicInfo: (updates: Partial<Omit<TSurvey, 'questions'>>) => void;
    updateQuestion: (updatedQuestion: TQuestion) => void;
    updateQuestions: (questions: TQuestion[]) => void;
    addQuestion: () => void;
    copyQuestion: (questionId: string) => void;
    deleteQuestion: (questionId: string) => void;

    // UI Actions
    setActiveQuestionIndex: (index: number | null) => void;
    setDeletingQuestionId: (id: string | null) => void;
    setIsSaving: (saving: boolean) => void;


    // Utility Functions
    findQuestionElement: (questionId: string) => HTMLElement | null;
    findSidebarElement: (questionId: string) => HTMLElement | null;
    clearAllAnimations: () => void;
    findQuestionByIndex: (index: number) => TQuestion | undefined;
    findQuestionById: (id: string) => TQuestion | undefined;
    findQuestionIndexById: (id: string) => number;

    // Scroll Detection
    registerQuestionObserver: (questionId: string, questionIndex: number) => void;
    unregisterQuestionObserver: (questionId: string) => void;

    // 전체 폼 데이터 (필요시에만 사용)
    getFullForm: () => TSurvey;
    getQuestions: () => TQuestion[];
}

const FormEditorContext = createContext<FormEditorContextValue | null>(null);

interface FormEditorProviderProps {
    children: ReactNode;
    initialData?: TSurvey;
    onSave: (formData: TSurvey, surveyId?: string) => Promise<any>;
}

export function FormEditorProvider({
    children,
    initialData,
    onSave
}: FormEditorProviderProps) {
    // 분리된 Form State
    const [questions, setQuestions] = React.useState<TQuestion[]>(initialData?.questions || []);
    const [formBasicInfo, setFormBasicInfo] = React.useState<Omit<TSurvey, 'questions'>>({
        "id": initialData?.id || "",
        "title": initialData?.title || "",
        "description": initialData?.description || "",
        "is_active": initialData?.is_active ?? true,
        "allow_anonymous": initialData?.allow_anonymous ?? true,
        "allow_url_param": initialData?.allow_url_param ?? false,
        "email_required": initialData?.email_required ?? false,
        "url_param_name": initialData?.url_param_name ?? 'rid',
        "allow_email_response_view": initialData?.allow_email_response_view ?? false,
        "allow_duplicate_responses": initialData?.allow_duplicate_responses ?? true,
        "opens_at": initialData?.opens_at || null,
        "closes_at": initialData?.closes_at || null,
    });

    // UI State
    const [activeQuestionIndex, setActiveQuestionIndex] = React.useState<number | null>(null);
    const [deletingQuestionId, setDeletingQuestionId] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);

    // Utility Functions
    const findQuestionElement = React.useCallback((questionId: string) => {
        return document.getElementById(`question-${questionId}`);
    }, []);

    const findSidebarElement = React.useCallback((questionId: string) => {
        return document.getElementById(`sidebar-question-${questionId}`);
    }, []);

    const clearAllAnimations = React.useCallback(() => {
        const animationClasses = [
            'question-highlight', 'question-error-highlight', 'question-fade-in', 'question-copy',
            'sidebar-question-highlight', 'sidebar-question-error-highlight', 'sidebar-question-fade-in', 'sidebar-question-copy'
        ];

        animationClasses.forEach(className => {
            document.querySelectorAll(`.${className}`).forEach(el => {
                el.classList.remove(className);
            });
        });
    }, []);

    // Intersection Observer 관련
    const observerRef = React.useRef<IntersectionObserver | null>(null);

    // Observer 초기화
    React.useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // 화면 중앙 부분을 감지
            threshold: 0.1
        };

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const questionId = entry.target.id.replace('question-', '');
                    const questionIndex = questions.findIndex(q => q.id === questionId);
                    if (questionIndex !== -1) {
                        setActiveQuestionIndex(questionIndex);

                        // 사이드바에서 해당 문항으로 스크롤
                        const sidebarElement = findSidebarElement(questionId);
                        if (sidebarElement) {
                            // 사이드바 컨테이너 찾기
                            const sidebarContainer = sidebarElement.closest('.overflow-y-auto');
                            if (sidebarContainer) {
                                // 현재 활성화된 문항이 사이드바에서 보이는지 확인
                                const containerRect = sidebarContainer.getBoundingClientRect();
                                const elementRect = sidebarElement.getBoundingClientRect();

                                // 요소가 컨테이너 밖에 있으면 스크롤
                                if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
                                    sidebarElement.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'nearest'
                                    });
                                }
                            }
                        }
                    }
                }
            });
        }, observerOptions);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [questions, setActiveQuestionIndex, findSidebarElement]);

    // 문항 Observer 등록/해제 함수
    const registerQuestionObserver = useCallback((questionId: string, questionIndex: number) => {
        if (observerRef.current) {
            const element = findQuestionElement(questionId);
            if (element) {
                observerRef.current.observe(element);
            }
        }
    }, [findQuestionElement]);

    const unregisterQuestionObserver = useCallback((questionId: string) => {
        if (observerRef.current) {
            const element = findQuestionElement(questionId);
            if (element) {
                observerRef.current.unobserve(element);
            }
        }
    }, [findQuestionElement]);

    // Form Actions - 분리된 액션
    const updateFormBasicInfo = useCallback((updates: Partial<Omit<TSurvey, 'questions'>>) => {
        setFormBasicInfo(prev => ({
            ...prev,
            ...updates
        }));
    }, []);

    const updateQuestion = useCallback((updatedQuestion: TQuestion) => {
        setQuestions(prev =>
            prev.map((q) => q.id === updatedQuestion.id ? updatedQuestion : q)
        );
    }, []);

    const updateQuestions = useCallback((newQuestions: TQuestion[]) => {
        setQuestions(newQuestions);
    }, []);

    const findQuestionByIndex = useCallback((index: number) => {
        return questions[index]
    }, [questions])

    const findQuestionById = useCallback((id: string) => {
        return questions.find(q => q.id === id)
    }, [questions])

    const findQuestionIndexById = useCallback((id: string) => {
        return questions.findIndex(q => q.id === id)
    }, [questions])

    const addQuestion = useCallback(() => {
        const newQuestion: TQuestion = {
            id: uuidv4(),
            title: "",
            description: "",
            question_type: "single_choice",
            required: false,
            options: [{ label: '', key: '' }],
            show_conditions: []
        };

        setQuestions(prev => {
            const insertIndex = activeQuestionIndex !== null ? activeQuestionIndex + 1 : prev.length;
            const newQuestions = [...prev];
            newQuestions.splice(insertIndex, 0, newQuestion);
            return newQuestions;
        });

        // 새로 추가된 문항으로 스크롤 및 포커스
        setTimeout(() => {
            const questionElement = document.getElementById(`question-${newQuestion.id}`);
            const sidebarQuestionElement = document.getElementById(`sidebar-question-${newQuestion.id}`);

            if (questionElement) {
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                setTimeout(() => {
                    clearAllAnimations();
                    questionElement.classList.add('question-fade-in');

                    const titleInput = questionElement.querySelector('textarea[placeholder="질문을 입력하세요"]') as HTMLTextAreaElement;
                    if (titleInput) {
                        titleInput.focus();
                        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
                    }

                    setTimeout(() => {
                        questionElement.classList.remove('question-fade-in');
                    }, 1000);
                }, 500);
            }

            if (sidebarQuestionElement) {
                sidebarQuestionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });

                setTimeout(() => {
                    clearAllAnimations();
                    sidebarQuestionElement.classList.add('sidebar-question-fade-in');

                    setTimeout(() => {
                        sidebarQuestionElement.classList.remove('sidebar-question-fade-in');
                    }, 1000);
                }, 500);
            }
        }, 100);
    }, [activeQuestionIndex, clearAllAnimations]);

    const copyQuestion = useCallback((questionId: string) => {
        const originalQuestion = questions.find(q => q.id === questionId);
        if (!originalQuestion) return;

        const copiedQuestion: TQuestion = { ...originalQuestion, id: uuidv4() };

        setQuestions(prev => {
            const index = prev.findIndex(q => q.id === questionId);
            const newQuestions = [
                ...prev.slice(0, index + 1),
                copiedQuestion,
                ...prev.slice(index + 1)
            ];
            return newQuestions;
        });

        // 복사된 문항으로 스크롤 및 애니메이션
        setTimeout(() => {
            const questionElement = document.getElementById(`question-${copiedQuestion.id}`);
            const sidebarQuestionElement = document.getElementById(`sidebar-question-${copiedQuestion.id}`);

            if (questionElement) {
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                setTimeout(() => {
                    clearAllAnimations();
                    questionElement.classList.add('question-copy');

                    const titleInput = questionElement.querySelector('textarea[placeholder="질문을 입력하세요"]') as HTMLTextAreaElement;
                    if (titleInput) {
                        titleInput.focus();
                        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
                    }

                    setTimeout(() => {
                        questionElement.classList.remove('question-copy');
                    }, 800);
                }, 500);
            }

            if (sidebarQuestionElement) {
                sidebarQuestionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });

                setTimeout(() => {
                    clearAllAnimations();
                    sidebarQuestionElement.classList.add('sidebar-question-copy');

                    setTimeout(() => {
                        sidebarQuestionElement.classList.remove('sidebar-question-copy');
                    }, 800);
                }, 500);
            }
        }, 100);
    }, [questions, clearAllAnimations]);

    const deleteQuestion = useCallback((questionId: string) => {
        // 애니메이션 완료 후 실제 삭제
        setTimeout(() => {
            setQuestions(prev => {
                if (deletingQuestionId) return prev;
                return prev.filter(q => q.id !== questionId);
            });
        }, 500);
    }, [deletingQuestionId]);

    const getQuestions = useCallback((): TQuestion[] => questions, [questions])

    // 전체 폼 데이터를 반환하는 함수
    const getFullForm = useCallback((): TSurvey => ({
        ...formBasicInfo,
        questions
    }), [formBasicInfo, questions]);

    // Context Value
    const contextValue = useMemo(() => ({
        questions,
        formBasicInfo,
        activeQuestionIndex,
        deletingQuestionId,
        isSaving,
        updateFormBasicInfo,
        updateQuestion,
        updateQuestions,
        addQuestion,
        copyQuestion,
        deleteQuestion,
        setActiveQuestionIndex,
        setDeletingQuestionId,
        setIsSaving,
        findQuestionElement,
        findSidebarElement,
        clearAllAnimations,
        findQuestionByIndex,
        findQuestionById,
        findQuestionIndexById,
        registerQuestionObserver,
        unregisterQuestionObserver,
        getQuestions,
        getFullForm
    }), [
        questions,
        formBasicInfo,
        activeQuestionIndex,
        deletingQuestionId,
        isSaving,
        updateFormBasicInfo,
        updateQuestion,
        updateQuestions,
        addQuestion,
        copyQuestion,
        deleteQuestion,
        findQuestionElement,
        findSidebarElement,
        clearAllAnimations,
        findQuestionByIndex,
        findQuestionById,
        findQuestionIndexById,
        registerQuestionObserver,
        unregisterQuestionObserver,
        getQuestions,
        getFullForm
    ]);

    return (
        <FormEditorContext.Provider value={contextValue}>
            {children}
        </FormEditorContext.Provider>
    );
}

// Custom Hook
export function useFormEditor() {
    const context = useContext(FormEditorContext);
    if (!context) {
        throw new Error('useFormEditor must be used within a FormEditorProvider');
    }
    return context;
}

// Selector Hooks for Performance
export function useFormData() {
    const { questions, formBasicInfo } = useFormEditor();
    return useMemo(() => ({
        ...formBasicInfo,
        questions
    }), [questions, formBasicInfo]);
}

export function useFormQuestions() {
    const { questions } = useFormEditor();
    return questions;
}

export function useFormBasicInfo() {
    const { formBasicInfo } = useFormEditor();
    return formBasicInfo;
}

export function useFormActions() {
    const { updateFormBasicInfo, updateQuestion, updateQuestions, addQuestion, copyQuestion, deleteQuestion } = useFormEditor();
    return useMemo(() => ({
        updateFormBasicInfo,
        updateQuestion,
        updateQuestions,
        addQuestion,
        copyQuestion,
        deleteQuestion
    }), [updateFormBasicInfo, updateQuestion, updateQuestions, addQuestion, copyQuestion, deleteQuestion]);
}

export function useFormUI() {
    const {
        activeQuestionIndex,
        deletingQuestionId,
        isSaving,
        setActiveQuestionIndex,
        setDeletingQuestionId,
        setIsSaving
    } = useFormEditor();

    return useMemo(() => ({
        activeQuestionIndex,
        deletingQuestionId,
        isSaving,
        setActiveQuestionIndex,
        setDeletingQuestionId,
        setIsSaving
    }), [activeQuestionIndex, deletingQuestionId, isSaving, setActiveQuestionIndex, setDeletingQuestionId, setIsSaving]);
} 