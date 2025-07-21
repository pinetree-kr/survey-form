"use client"

import React, { useState, useEffect } from "react";
import { TSurvey, TQuestion, TBranchCondition } from "@/app/components";
import { toast, ToastContainer } from "react-toastify";
import { ImageUrlModal, BranchModal, ConditionModal, QuestionPanel, JsonImportModal, JsonExportModal, SurveyBasicInfo } from ".";
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
import { useCallback } from 'react'


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

    // 설문 기본 정보 업데이트 핸들러
    const handleBasicInfoUpdate = useCallback((updates: { title: string; description: string; allow_anonymous?: boolean; is_active?: boolean }) => {
        setForm(prev => ({
            ...prev,
            title: updates.title,
            description: updates.description,
            allow_anonymous: updates.allow_anonymous,
            is_active: updates.is_active
        }));
    }, []);

    // DnD 센서 훅은 최상단에서 한 번만 호출
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor)
    );

    // 현재 활성화된 문항 인덱스 (스크롤 감지용)
    const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);

    // 삭제 중인 문항 ID 추적
    const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

    // 저장 중 로딩 상태
    const [isSaving, setIsSaving] = useState(false);

    // JSON 가져오기 모달 상태
    const [showJsonImportModal, setShowJsonImportModal] = useState(false);

    // JSON 미리보기 모달 상태
    const [showJsonExportModal, setShowJsonExportModal] = useState(false);

    // DOM 요소를 찾는 헬퍼 함수
    const findQuestionElement = React.useCallback((questionId: string) => {
        return document.getElementById(`question-${questionId}`);
    }, []);

    const findSidebarElement = React.useCallback((questionId: string) => {
        return document.getElementById(`sidebar-question-${questionId}`);
    }, []);

    // 모든 애니메이션 클래스를 제거하는 유틸리티 함수
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

    const addQuestion = React.useCallback(() => {
        const newQuestion: TQuestion = {
            id: uuidv4(),
            title: "",
            description: "",
            question_type: "single_choice",
            required: false,
            options: [{ label: '', key: '' }],
            show_conditions: []
        };

        console.log('addQuestion', { newQuestion })
        setForm(prev => {
            // 현재 활성화된 문항 인덱스 확인
            const insertIndex = activeQuestionIndex !== null ? activeQuestionIndex + 1 : prev.questions.length;

            const newQuestions = [...prev.questions];
            newQuestions.splice(insertIndex, 0, newQuestion);

            return {
                ...prev,
                questions: newQuestions
            };
        });

        // 새로 추가된 문항으로 스크롤 및 포커스 (React 상태 업데이트 후 실행)
        setTimeout(() => {
            // 새로 추가된 문항의 ID를 사용하여 DOM 요소 찾기
            const questionElement = document.getElementById(`question-${newQuestion.id}`);
            const sidebarQuestionElement = document.getElementById(`sidebar-question-${newQuestion.id}`);

            if (questionElement) {
                // 부드러운 스크롤 애니메이션
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // 스크롤 완료 후 애니메이션 효과
                setTimeout(() => {
                    // 기존 모든 애니메이션 클래스 제거
                    clearAllAnimations();

                    // 새 문항에 페이드인 애니메이션만 추가 (하이라이트는 나중에)
                    questionElement.classList.add('question-fade-in');

                    // 제목 입력 필드에 포커스
                    const titleInput = questionElement.querySelector('textarea[placeholder="질문을 입력하세요"]') as HTMLTextAreaElement;
                    if (titleInput) {
                        titleInput.focus();
                        // 커서를 맨 끝으로 이동
                        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
                    }

                    // 1초 후 페이드인 애니메이션 제거
                    setTimeout(() => {
                        questionElement.classList.remove('question-fade-in');
                    }, 1000);
                }, 500);
            }

            // 사이드바 문항 목록도 스크롤 및 하이라이트
            if (sidebarQuestionElement) {
                sidebarQuestionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });

                // 사이드바 애니메이션 효과
                setTimeout(() => {
                    // 기존 모든 애니메이션 클래스 제거
                    clearAllAnimations();

                    sidebarQuestionElement.classList.add('sidebar-question-fade-in');

                    // 1초 후 페이드인 애니메이션 제거
                    setTimeout(() => {
                        sidebarQuestionElement.classList.remove('sidebar-question-fade-in');
                    }, 1000);
                }, 500);
            }
        }, 100); // React 상태 업데이트 대기
    }, [activeQuestionIndex, form.questions, clearAllAnimations]);

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

    // 문항 업데이트 함수를 useCallback으로 메모이제이션
    const updateQuestion = useCallback((index: number, updatedQuestion: TQuestion) => {
        console.log('updateQuestion', { index, updatedQuestion })
        setForm(prev => {
            return {
                ...prev,
                questions: prev.questions.map((q, i) => i === index ? updatedQuestion : q)
            };
        });
    }, []);

    // 문항 삭제 함수를 useCallback으로 메모이제이션
    const deleteQuestion = useCallback((index: number) => {
        // 삭제할 문항의 ID 저장
        const questionToDelete = form.questions[index];
        if (!questionToDelete) return;

        // 이미 삭제 중인 문항이 있으면 무시
        if (deletingQuestionId) return;

        // 삭제 중인 문항 ID 설정
        setDeletingQuestionId(questionToDelete.id);

        // 애니메이션 완료 후 실제 삭제
        setTimeout(() => {
            console.log('deleteQuestion', { questionToDelete })
            setForm(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== questionToDelete.id)
            }));
            // 삭제 중인 문항 ID 초기화
            setDeletingQuestionId(null);
        }, 500); // 애니메이션 지속 시간과 동일
    }, [setForm]);

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
                        // 기존 모든 애니메이션 클래스 제거
                        clearAllAnimations();

                        // 현재 문항에 오류 하이라이트 추가
                        questionElement.classList.add('question-error-highlight');

                        // 사이드바에서도 오류 하이라이트
                        if (sidebarElement) {
                            sidebarElement.classList.add('sidebar-question-error-highlight');
                        }

                        // 5초 후 하이라이트 제거 (오류 문항이므로 더 오래 표시)
                        setTimeout(() => {
                            questionElement.classList.remove('question-error-highlight');
                            if (sidebarElement) {
                                sidebarElement.classList.remove('sidebar-question-error-highlight');
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
            return question.options.every(option => !option.label.trim() && !option.key.trim());
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
                        // 기존 모든 애니메이션 클래스 제거
                        clearAllAnimations();

                        // 현재 문항에 오류 하이라이트 추가
                        questionElement.classList.add('question-error-highlight');

                        // 사이드바에서도 오류 하이라이트
                        if (sidebarElement) {
                            sidebarElement.classList.add('sidebar-question-error-highlight');
                        }

                        // 5초 후 하이라이트 제거 (오류 문항이므로 더 오래 표시)
                        setTimeout(() => {
                            questionElement.classList.remove('question-error-highlight');
                            if (sidebarElement) {
                                sidebarElement.classList.remove('sidebar-question-error-highlight');
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
            setIsSaving(true);

            // is_hidden: false인 문항의 show_conditions를 비우는 로직
            const processedForm = {
                ...form,
                questions: form.questions.map(question => {
                    if (question.is_hidden === false) {
                        return {
                            ...question,
                            show_conditions: []
                        };
                    }
                    return question;
                })
            };

            const savedSurvey = await onSave(processedForm, form.id);

            // 성공 토스트 표시 (클릭 가능하도록 설정)
            const toastId = toast.success(
                <div>
                    {form.id ? "설문이 성공적으로 수정되었습니다." : "설문이 성공적으로 생성되었습니다."}
                    <br />
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">
                        클릭하여 목록으로 이동
                    </span>
                </div>,
                {
                    onClick: () => {
                        // 클릭 시 항상 목록으로 이동
                        window.location.href = '/admin/forms';
                    },
                    onClose: () => {
                        // 자동으로 닫힐 때는 수정 페이지로 이동
                        if (form.id) {
                            // 기존 설문 수정인 경우 현재 페이지 새로고침
                            window.location.reload();
                        } else {
                            // 새로 생성된 경우 해당 설문의 수정 페이지로 이동
                            window.location.href = `/admin/forms/${savedSurvey.id}/edit`;
                        }
                    },
                    style: { cursor: 'pointer' },
                    autoClose: 5000,
                    draggable: true,
                    pauseOnHover: true,
                }
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : (form.id ? "설문 수정에 실패했습니다." : "설문 생성에 실패했습니다."), {
                autoClose: 5000,
                closeOnClick: true,
                draggable: true,
                pauseOnHover: true,
                closeButton: true,
                hideProgressBar: false
            });
        } finally {
            setIsSaving(false);
        }
    }, [onSave, form]);

    // 문항 복사 (해당 문항 아래에 추가)
    const copyQuestion = React.useCallback((index: number) => {
        const originalQuestion = form.questions[index];
        const copiedQuestion: TQuestion = { ...originalQuestion, id: uuidv4() };

        console.log('copyQuestion', { index, copiedQuestion })
        setForm(prev => {
            const newQuestions = [
                ...prev.questions.slice(0, index + 1),
                copiedQuestion,
                ...prev.questions.slice(index + 1)
            ];
            return { ...prev, questions: newQuestions };
        });

        // 복사된 문항으로 스크롤 및 애니메이션 (React 상태 업데이트 후 실행)
        setTimeout(() => {
            // 복사된 문항의 ID를 사용하여 DOM 요소 찾기
            const questionElement = document.getElementById(`question-${copiedQuestion.id}`);
            const sidebarQuestionElement = document.getElementById(`sidebar-question-${copiedQuestion.id}`);

            if (questionElement) {
                // 부드러운 스크롤 애니메이션
                questionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                // 스크롤 완료 후 애니메이션 효과
                setTimeout(() => {
                    // 기존 모든 애니메이션 클래스 제거
                    clearAllAnimations();

                    // 복사된 문항에 복사 전용 애니메이션 추가
                    questionElement.classList.add('question-copy');

                    // 제목 입력 필드에 포커스
                    const titleInput = questionElement.querySelector('textarea[placeholder="질문을 입력하세요"]') as HTMLTextAreaElement;
                    if (titleInput) {
                        titleInput.focus();
                        // 커서를 맨 끝으로 이동
                        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
                    }

                    // 0.8초 후 복사 애니메이션 제거
                    setTimeout(() => {
                        questionElement.classList.remove('question-copy');
                    }, 800);
                }, 500);
            }

            // 사이드바 문항 목록도 스크롤 및 하이라이트
            if (sidebarQuestionElement) {
                sidebarQuestionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });

                // 사이드바 애니메이션 효과
                setTimeout(() => {
                    // 기존 모든 애니메이션 클래스 제거
                    clearAllAnimations();

                    sidebarQuestionElement.classList.add('sidebar-question-copy');

                    // 0.8초 후 복사 애니메이션 제거
                    setTimeout(() => {
                        sidebarQuestionElement.classList.remove('sidebar-question-copy');
                    }, 800);
                }, 500);
            }
        }, 100); // React 상태 업데이트 대기
    }, [setForm, form.questions]);

    // 드래그 앤 드롭 핸들러
    const handleDragEnd = React.useCallback((event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            console.log('handleDragEnd', { active, over })
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

    // JSON 가져오기 핸들러
    const handleJsonImport = React.useCallback((surveyData: TSurvey) => {
        delete surveyData.id
        setForm(prev => ({
            id: prev.id || undefined,
            ...surveyData,
        }));
        toast.success('JSON에서 설문이 성공적으로 가져와졌습니다.', {
            autoClose: 3000,
            closeOnClick: true,
        });
    }, [setForm]);

    return (
        <div className="flex h-[calc(100vh-168px)] bg-gray-50 relative">
            {/* 좌측 사이드바 - 문항 목록 (상위 컨테이너 기준 고정) */}
            <div className="w-[270px] bg-white border-r rounded-md shadow-md border-gray-200 flex flex-col fixed top-[170px] left-[20px] bottom-[120px] z-30">
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
                                                // 기존 모든 애니메이션 클래스 제거
                                                clearAllAnimations();

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
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {question.title || '제목 없음'}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                                <span>
                                                    {question.question_type === 'single_choice' ? '단일선택' :
                                                        question.question_type === 'multiple_choice' ? '다중선택' :
                                                            question.question_type === 'short_text' ? '단답형' :
                                                                question.question_type === 'long_text' ? '서술형' :
                                                                    question.question_type === 'dropdown' ? '드롭다운' :
                                                                        question.question_type === 'composite_single' ? '복합 단일' :
                                                                            question.question_type === 'composite_multiple' ? '복합 다중' :
                                                                                question.question_type === 'description' ? '안내문' : question.question_type}
                                                </span>
                                                {question.required && (
                                                    <span className="text-red-500">필수</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyQuestion(index);
                                                }}
                                                className="text-gray-400 hover:text-gray-600 p-1 transition-all duration-200 hover:scale-110"
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
                                                className={`p-1 transition-all duration-200 ${deletingQuestionId === question.id
                                                    ? 'text-gray-300 cursor-not-allowed'
                                                    : 'text-gray-400 hover:text-red-600 hover:scale-110'}`}
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
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 btn-hover-lift flex items-center justify-center gap-2"
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
                                <SurveyBasicInfo
                                    id={form.id}
                                    title={form.title}
                                    description={form.description || ""}
                                    allow_anonymous={form.allow_anonymous}
                                    is_active={form.is_active}
                                    onUpdate={handleBasicInfoUpdate}
                                />

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
                                            {form.questions.map((question, index) => {
                                                return (
                                                    <QuestionPanel
                                                        key={`p${question.id}`}
                                                        question={question}
                                                        questionIndex={index}
                                                        questions={form.questions}
                                                        onUpdate={(updatedQuestion) => {
                                                            console.log('onUpdate', { updatedQuestion })
                                                            updateQuestion(index, updatedQuestion)
                                                        }}
                                                        onDelete={() => deleteQuestion(index)}
                                                        onCopy={() => copyQuestion(index)}
                                                        deletingQuestionId={deletingQuestionId}
                                                    />
                                                )
                                            })}
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
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 btn-hover-lift flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Import
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowJsonExportModal(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 btn-hover-lift flex items-center gap-2"
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
                                className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-all duration-200 btn-hover-lift"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className={`px-6 py-2 rounded-md transition-all duration-200 btn-hover-lift flex items-center gap-2 ${isSaving
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    }`}
                            >
                                {isSaving && (
                                    <svg className="w-4 h-4 loading-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                {isSaving ? '저장 중...' : (form.id ? '설문 수정' : '설문 저장')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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

            <ToastContainer
                position="top-right"
                theme="light"
                toastClassName="toast-enter"
            />
        </div>
    );
}



