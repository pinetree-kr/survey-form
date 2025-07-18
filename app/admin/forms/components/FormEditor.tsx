"use client"

import React, { useState } from "react";
import { TSurvey, TQuestion, TBranchCondition } from "@/app/components";
import { toast, ToastContainer } from "react-toastify";
import { ImageUrlModal, BranchModal, ConditionModal, QuestionPanel, JsonImportModal, JsonExportModal } from ".";
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

interface FormEditorProps {
    onSave: (formData: TSurvey, surveyId?: string) => Promise<any>
    data?: TSurvey
}

export function FormEditor({
    onSave,
    data,
}: FormEditorProps) {
    const [form, setForm] = useState<TSurvey>({
        "id": data?.id || "",
        "title": data?.title || "",
        "description": data?.description || "",
        "questions": data?.questions || []
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

    // JSON 가져오기 모달 상태
    const [showJsonImportModal, setShowJsonImportModal] = useState(false);

    // JSON 미리보기 모달 상태
    const [showJsonExportModal, setShowJsonExportModal] = useState(false);

    // 현재 활성화된 문항 인덱스 (스크롤 감지용)
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

    // 삭제 중인 문항 ID 추적
    const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

    // DOM 요소를 찾는 헬퍼 함수
    const findQuestionElement = React.useCallback((questionId: string) => {
        return document.getElementById(`question-${questionId}`);
    }, []);

    const findSidebarElement = React.useCallback((questionId: string) => {
        return document.getElementById(`sidebar-question-${questionId}`);
    }, []);

    const addQuestion = React.useCallback(() => {
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

        setForm(prev => {
            const newQuestions = [...prev.questions, newQuestion];
            return {
                ...prev,
                questions: newQuestions
            };
        });

        // 새로 추가된 문항으로 스크롤 (React 상태 업데이트 후 실행)
        setTimeout(() => {
            const newQuestionIndex = form.questions.length;
            const questionElement = document.getElementById(`question-${newQuestionIndex}`);
            const sidebarQuestionElement = document.getElementById(`sidebar-question-${newQuestionIndex}`);

            if (questionElement) {
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // 스크롤 완료 후 하이라이트 효과
                setTimeout(() => {
                    // 기존 하이라이트 제거
                    document.querySelectorAll('.question-highlight').forEach(el => {
                        el.classList.remove('question-highlight');
                    });
                    document.querySelectorAll('.sidebar-question-highlight').forEach(el => {
                        el.classList.remove('sidebar-question-highlight');
                    });

                    // 새 문항에 하이라이트 추가
                    questionElement.classList.add('question-highlight');

                    // 3초 후 하이라이트 제거
                    setTimeout(() => {
                        questionElement.classList.remove('question-highlight');
                    }, 3000);
                }, 500);
            }

            // 사이드바 문항 목록도 스크롤 및 하이라이트
            if (sidebarQuestionElement) {
                sidebarQuestionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });

                // 사이드바 하이라이트 효과
                setTimeout(() => {
                    sidebarQuestionElement.classList.add('sidebar-question-highlight');

                    // 3초 후 하이라이트 제거
                    setTimeout(() => {
                        sidebarQuestionElement.classList.remove('sidebar-question-highlight');
                    }, 3000);
                }, 500);
            }
        }, 100); // React 상태 업데이트 대기
    }, [setForm, form.questions.length]);

    // 스크롤 감지를 위한 Intersection Observer 설정
    React.useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px', // 화면 중앙 부분을 감지
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const questionId = entry.target.id.replace('question-', '');
                    const questionIndex = form.questions.findIndex(q => q.id === questionId);
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

        // 모든 문항 요소를 관찰 대상으로 등록
        form.questions.forEach((question) => {
            const element = findQuestionElement(question.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            observer.disconnect();
        };
    }, [form.questions.length]);

    const updateQuestion = React.useCallback((index: number, updatedQuestion: TQuestion) => {
        setForm(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => i === index ? updatedQuestion : q)
        }));
    }, [setForm]);

    const deleteQuestion = React.useCallback((index: number) => {
        // 삭제할 문항의 ID 저장
        const questionToDelete = form.questions[index];
        if (!questionToDelete) return;

        // 이미 삭제 중인 문항이 있으면 무시
        if (deletingQuestionId) return;

        // 삭제 중인 문항 ID 설정
        setDeletingQuestionId(questionToDelete.id);

        // 애니메이션 완료 후 실제 삭제
        setTimeout(() => {
            setForm(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== questionToDelete.id)
            }));
            // 삭제 중인 문항 ID 초기화
            setDeletingQuestionId(null);
        }, 500); // 애니메이션 지속 시간과 동일
    }, [setForm, form.questions, deletingQuestionId]);



    const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.title.trim()) {
            toast.error("설문 제목을 입력해주세요.");
            return;
        }

        if (!form.questions || form.questions.length === 0) {
            toast.error("최소 하나의 문항을 추가해주세요.");
            return;
        }

        // 문항 제목 검증
        const emptyTitleIndex = form.questions.findIndex(question => !question.title.trim());
        if (emptyTitleIndex !== -1) {
            toast.error(`문항 ${emptyTitleIndex + 1}의 제목을 입력해주세요.`);

            // 해당 문항으로 스크롤 및 포커스
            setTimeout(() => {
                const questionElement = document.getElementById(`question-${emptyTitleIndex}`);
                const sidebarElement = document.getElementById(`sidebar-question-${emptyTitleIndex}`);

                if (questionElement) {
                    // 문항으로 스크롤
                    questionElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // 하이라이트 효과
                    setTimeout(() => {
                        // 기존 하이라이트 제거
                        document.querySelectorAll('.question-highlight').forEach(el => {
                            el.classList.remove('question-highlight');
                        });
                        document.querySelectorAll('.sidebar-question-highlight').forEach(el => {
                            el.classList.remove('sidebar-question-highlight');
                        });

                        // 현재 문항에 하이라이트 추가
                        questionElement.classList.add('question-highlight');

                        // 사이드바에서도 하이라이트
                        if (sidebarElement) {
                            sidebarElement.classList.add('sidebar-question-highlight');
                        }

                        // 5초 후 하이라이트 제거 (오류 문항이므로 더 오래 표시)
                        setTimeout(() => {
                            questionElement.classList.remove('question-highlight');
                            if (sidebarElement) {
                                sidebarElement.classList.remove('sidebar-question-highlight');
                            }
                        }, 5000);
                    }, 500);

                    // 문항 제목 입력 필드에 포커스
                    setTimeout(() => {
                        const titleInput = questionElement.querySelector('textarea[placeholder="질문을 입력하세요"]') as HTMLTextAreaElement;
                        if (titleInput) {
                            titleInput.focus();
                            titleInput.select();
                        }
                    }, 1000);
                }
            }, 100);

            return;
        }

        // 옵션이 필요한 문항의 옵션 검증
        const optionRequiredTypes = ['single_choice', 'multiple_choice', 'dropdown'];
        const emptyOptionIndex = form.questions.findIndex(question => {
            if (!optionRequiredTypes.includes(question.question_type)) return false;

            // 옵션이 없거나 모든 옵션이 비어있는지 확인
            if (!question.options || question.options.length === 0) return true;

            // 모든 옵션이 비어있는지 확인
            return question.options.every(option => !option.label.trim() && !option.value.trim());
        });

        if (emptyOptionIndex !== -1) {
            const question = form.questions[emptyOptionIndex];
            const questionTypeText = question.question_type === 'single_choice' ? '단일선택' :
                question.question_type === 'multiple_choice' ? '다중선택' : '드롭다운';

            toast.error(`문항 ${emptyOptionIndex + 1}의 ${questionTypeText} 옵션을 입력해주세요.`);

            // 해당 문항으로 스크롤 및 포커스
            setTimeout(() => {
                const questionElement = document.getElementById(`question-${emptyOptionIndex}`);
                const sidebarElement = document.getElementById(`sidebar-question-${emptyOptionIndex}`);

                if (questionElement) {
                    // 문항으로 스크롤
                    questionElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // 하이라이트 효과
                    setTimeout(() => {
                        // 기존 하이라이트 제거
                        document.querySelectorAll('.question-highlight').forEach(el => {
                            el.classList.remove('question-highlight');
                        });
                        document.querySelectorAll('.sidebar-question-highlight').forEach(el => {
                            el.classList.remove('sidebar-question-highlight');
                        });

                        // 현재 문항에 하이라이트 추가
                        questionElement.classList.add('question-highlight');

                        // 사이드바에서도 하이라이트
                        if (sidebarElement) {
                            sidebarElement.classList.add('sidebar-question-highlight');
                        }

                        // 5초 후 하이라이트 제거 (오류 문항이므로 더 오래 표시)
                        setTimeout(() => {
                            questionElement.classList.remove('question-highlight');
                            if (sidebarElement) {
                                sidebarElement.classList.remove('sidebar-question-highlight');
                            }
                        }, 5000);
                    }, 500);

                    // 첫 번째 옵션 입력 필드에 포커스
                    setTimeout(() => {
                        const optionInput = questionElement.querySelector('input[placeholder="옵션 텍스트"]') as HTMLInputElement;
                        if (optionInput) {
                            optionInput.focus();
                            optionInput.select();
                        }
                    }, 1000);
                }
            }, 100);

            return;
        }

        try {
            await onSave(form, form.id);
            toast.success(form.id ? "설문이 성공적으로 수정되었습니다." : "설문이 성공적으로 생성되었습니다.");

            // 성공 후 설문 목록 페이지로 이동
            setTimeout(() => {
                window.location.href = '/admin/forms';
            }, 1500);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : (form.id ? "설문 수정에 실패했습니다." : "설문 생성에 실패했습니다."));
        }
    }, [onSave, form]);

    // 문항 복사 (해당 문항 아래에 추가)
    const copyQuestion = React.useCallback((index: number) => {
        setForm(prev => {
            const q = prev.questions[index];

            const copy: TQuestion = { ...q, id: uuidv4() };
            const newQuestions = [
                ...prev.questions.slice(0, index + 1),
                copy,
                ...prev.questions.slice(index + 1)
            ];
            return { ...prev, questions: newQuestions };
        });

        // 복사된 문항으로 스크롤 (React 상태 업데이트 후 실행)
        setTimeout(() => {
            const copiedQuestionIndex = index + 1; // 복사된 문항의 인덱스
            const questionElement = document.getElementById(`question-${copiedQuestionIndex}`);
            const sidebarQuestionElement = document.getElementById(`sidebar-question-${copiedQuestionIndex}`);

            if (questionElement) {
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // 스크롤 완료 후 하이라이트 효과
                setTimeout(() => {
                    // 기존 하이라이트 제거
                    document.querySelectorAll('.question-highlight').forEach(el => {
                        el.classList.remove('question-highlight');
                    });
                    document.querySelectorAll('.sidebar-question-highlight').forEach(el => {
                        el.classList.remove('sidebar-question-highlight');
                    });

                    // 복사된 문항에 하이라이트 추가
                    questionElement.classList.add('question-highlight');

                    // 3초 후 하이라이트 제거
                    setTimeout(() => {
                        questionElement.classList.remove('question-highlight');
                    }, 3000);
                }, 500);
            }

            // 사이드바 문항 목록도 스크롤 및 하이라이트
            if (sidebarQuestionElement) {
                sidebarQuestionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });

                // 사이드바 하이라이트 효과
                setTimeout(() => {
                    sidebarQuestionElement.classList.add('sidebar-question-highlight');

                    // 3초 후 하이라이트 제거
                    setTimeout(() => {
                        sidebarQuestionElement.classList.remove('sidebar-question-highlight');
                    }, 3000);
                }, 500);
            }
        }, 100); // React 상태 업데이트 대기
    }, [setForm]);

    // 이미지 저장 핸들러
    const handleImageSave = React.useCallback((urls: string[]) => {
        if (!imageModal) return;
        setForm(prev => {
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
    }, [setForm, imageModal]);

    // 드래그 앤 드롭 핸들러
    const handleDragEnd = React.useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setForm(prev => {
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
    }, [setForm]);

    // 분기 추가 핸들러
    const handleBranchAdd = React.useCallback((qIdx: number, optIdx: number, nextQuestionId: string) => {
        setForm(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];

            if (question.question_type === 'composite_single') {
                // composite_single 문항의 경우 composite_items 수정
                const compositeItems = [...(question.composite_items || [])];
                compositeItems[optIdx] = {
                    ...compositeItems[optIdx],
                    next_question_id: nextQuestionId
                };

                questions[qIdx] = {
                    ...question,
                    composite_items: compositeItems
                };
            } else {
                // 기존 로직 (single_choice, multiple_choice 등)
                const options = [...(question.options || [])];
                options[optIdx] = {
                    ...options[optIdx],
                    next_question_id: nextQuestionId
                };

                questions[qIdx] = {
                    ...question,
                    options
                };
            }

            return { ...prev, questions };
        });
        setBranchModal(null);
    }, [setForm, setBranchModal]);

    // 분기 제거 핸들러
    const handleBranchDelete = React.useCallback((qIdx: number, optIdx: number) => {
        setForm(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];

            if (question.question_type === 'composite_single') {
                // composite_single 문항의 경우 composite_items 수정
                const compositeItems = [...(question.composite_items || [])];
                compositeItems[optIdx] = {
                    ...compositeItems[optIdx],
                    next_question_id: undefined
                };

                questions[qIdx] = {
                    ...question,
                    composite_items: compositeItems
                };
            } else {
                // 기존 로직 (single_choice, multiple_choice 등)
                const options = [...(question.options || [])];
                options[optIdx] = {
                    ...options[optIdx],
                    next_question_id: undefined
                };

                questions[qIdx] = {
                    ...question,
                    options
                };
            }

            return { ...prev, questions };
        });
        setBranchModal(null);
    }, [setForm, setBranchModal]);

    // 조건부 표시 추가 핸들러
    const handleShowConditionAdd = React.useCallback((qIdx: number, condition: TBranchCondition) => {
        setForm(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];

            questions[qIdx] = {
                ...question,
                show_conditions: [condition]
            };

            return { ...prev, questions };
        });
        setConditionModal(null);
    }, [setForm, setConditionModal]);

    const handleShowConditionDelete = React.useCallback((qIdx: number, idx: number) => {
        setForm(prev => {
            const questions = [...prev.questions];
            const question = questions[qIdx];
            questions[qIdx] = { ...question, show_conditions: question.show_conditions?.filter((_, i) => i !== idx) };
            return { ...prev, questions };
        });
    }, [setForm]);

    // JSON 가져오기 핸들러
    const handleJsonImport = React.useCallback((surveyData: TSurvey) => {
        setForm(prev => ({
            ...surveyData,
            id: prev.id || undefined
        }));
        toast.success('JSON에서 설문이 성공적으로 가져와졌습니다.');
    }, [setForm]);

    const MemoizedSimpleQuestionList = React.useMemo(() => {
        return form.questions.map((question, index) => ({
            title: question.title,
            id: question.id,
            question_type: question.question_type,
            options: question.options,
            composite_items: question.composite_items
        }))
    }, [form.questions])

    const MemoizedConditionModal = React.useMemo(() => {
        return <ConditionModal
            isOpen={!!conditionModal}
            onClose={() => setConditionModal(null)}
            questions={MemoizedSimpleQuestionList}
            onAdd={(condition) => handleShowConditionAdd(conditionModal!.qIdx, condition)}
        />
    }, [conditionModal, MemoizedSimpleQuestionList, handleShowConditionAdd]);

    return (
        <div className="flex h-[calc(100vh-168px)] bg-gray-50 relative">
            {/* 좌측 사이드바 - 문항 목록 (상위 컨테이너 기준 고정) */}
            <div className="w-[280px] bg-white border-r rounded-md shadow-md border-gray-200 flex flex-col fixed top-[170px] left-[16px] bottom-[80px] z-30">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">문항 목록</h2>
                    <p className="text-sm text-gray-500 mt-1">총 {form.questions.length}개 문항</p>
                </div>

                <div className="flex-1 overflow-y-auto pb-8">
                    {form.questions.length === 0 ? (
                        <div className="p-8 text-center">
                            <div className="text-gray-400 mb-2">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm">문항을 추가해주세요</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {form.questions.map((question, index) => (
                                <div
                                    key={`sidebar-${question.id}`}
                                    id={`sidebar-question-${question.id}`}
                                    className={`border rounded-md p-3 cursor-pointer transition-all duration-200 ${activeQuestionIndex === index
                                        ? 'bg-blue-50 border-blue-300 shadow-md'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        } ${question.id === deletingQuestionId ? 'sidebar-question-delete' : ''}`}
                                    onClick={() => {
                                        // 문항 클릭 시 해당 문항으로 스크롤
                                        const questionElement = findQuestionElement(question.id);
                                        if (questionElement) {
                                            questionElement.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start'
                                            });

                                            // 스크롤 완료 후 하이라이트 효과
                                            setTimeout(() => {
                                                // 기존 하이라이트 제거
                                                document.querySelectorAll('.question-highlight').forEach(el => {
                                                    el.classList.remove('question-highlight');
                                                });
                                                document.querySelectorAll('.sidebar-question-highlight').forEach(el => {
                                                    el.classList.remove('sidebar-question-highlight');
                                                });

                                                // 현재 문항에 하이라이트 추가
                                                questionElement.classList.add('question-highlight');

                                                // 사이드바에서도 하이라이트
                                                const sidebarElement = findSidebarElement(question.id);
                                                if (sidebarElement) {
                                                    sidebarElement.classList.add('sidebar-question-highlight');
                                                }

                                                // 3초 후 하이라이트 제거
                                                setTimeout(() => {
                                                    questionElement.classList.remove('question-highlight');
                                                    if (sidebarElement) {
                                                        sidebarElement.classList.remove('sidebar-question-highlight');
                                                    }
                                                }, 3000);
                                            }, 500); // 스크롤 애니메이션 완료 후 실행
                                        }
                                    }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    {index + 1}
                                                </span>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                    {question.question_type === 'single_choice' ? '단일선택' :
                                                        question.question_type === 'multiple_choice' ? '다중선택' :
                                                            question.question_type === 'short_text' ? '단답형' :
                                                                question.question_type === 'long_text' ? '서술형' :
                                                                    question.question_type === 'dropdown' ? '드롭다운' : question.question_type}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {question.title || '제목 없음'}
                                            </h3>
                                            {question.required && (
                                                <span className="text-xs text-red-500 mt-1 block">필수</span>
                                            )}
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyQuestion(index);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 p-1"
                                                title="복사"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteQuestion(index);
                                                }}
                                                disabled={deletingQuestionId === question.id}
                                                className={`p-1 ${deletingQuestionId === question.id
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-gray-400 hover:text-red-600'}`}
                                                title="삭제"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={addQuestion}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        문항 추가
                    </button>
                </div>
            </div>

            {/* 우측 메인 영역 (사이드바 너비만큼 여백 추가, 고정 높이) */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 px-8 pb-100">
                    {/* <div className="max-w-4xl mx-auto"> */}
                    <div className="w-full relative">
                        <div>
                            <div className="ml-[280px]">
                                {/* <div className="flex justify-end items-center mb-4">
                                    <h1 className="text-3xl font-bold">{form.id ? '설문 편집' : '설문 생성'}</h1>
                                </div> */}

                                {/* 설문 기본 정보 */}
                                <div className="bg-white p-6 rounded-md shadow-md mb-6">
                                    <h2 className="text-xl font-semibold mb-4">설문 기본 정보</h2>
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                설문 ID
                                            </label>
                                            <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500">
                                                {form.id || "자동생성"}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                설문 제목 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.title}
                                                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full border rounded px-3 py-2 text-base min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="설문 제목을 입력하세요"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            설문 설명
                                        </label>
                                        <textarea
                                            value={form.description}
                                            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full border rounded px-3 py-2 text-base min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            placeholder="설문에 대한 설명을 입력하세요"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 my-6"></div>

                                {/* 문항 편집 영역 */}
                                <div className="space-y-6 mb-6">
                                    <h2 className="text-xl font-semibold mb-2">문항 편집</h2>
                                    {form.questions.length === 0 ? (
                                        <div className="bg-white p-8 rounded-md shadow-md text-center">
                                            <p className="text-gray-500">좌측에서 문항을 추가해주세요.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {form.questions.map((question, index, questions) => (
                                                <QuestionPanel
                                                    key={`p${question.id}`}
                                                    question={question}
                                                    questionIndex={index}
                                                    questions={questions}
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
                                                    deletingQuestionId={deletingQuestionId}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 저장 버튼 - 화면 하단 고정 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
                <div className="px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowJsonImportModal(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Import
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowJsonExportModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export
                            </button>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => window.location.href = '/admin/forms'}
                                className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                            >
                                {form.id ? '설문 수정' : '설문 저장'}
                            </button>
                        </div>
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
                questions={form.questions}
                onAdd={(nextQuestionId) => handleBranchAdd(branchModal!.qIdx, branchModal!.optIdx, nextQuestionId)}
            />

            {/* 조건부 표시 모달 */}
            {MemoizedConditionModal}

            {/* JSON 가져오기 모달 */}
            <JsonImportModal
                isOpen={showJsonImportModal}
                onClose={() => setShowJsonImportModal(false)}
                onImport={handleJsonImport}
            />

            {/* JSON 미리보기 모달 */}
            <JsonExportModal
                isOpen={showJsonExportModal}
                onClose={() => setShowJsonExportModal(false)}
                surveyData={form}
            />

            <ToastContainer />
        </div>
    );
}



