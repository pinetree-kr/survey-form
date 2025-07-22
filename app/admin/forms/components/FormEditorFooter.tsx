"use client"

import React, { useState } from "react";
import { TSurvey } from "@/app/components";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { JsonImportModal, JsonExportModal } from ".";
import { useFormBasicInfo, useFormActions, useFormEditor, useFormUI } from "./FormEditorContext";
import { useRouter, useParams } from "next/navigation";

interface FormEditorFooterProps {
    onSave: (formData: TSurvey, surveyId?: string) => Promise<any>;
}

export const FormEditorFooter = React.memo(function FormEditorFooter({
    onSave
}: FormEditorFooterProps) {
    const router = useRouter();
    const params = useParams();
    const basicInfo = useFormBasicInfo();
    const { updateFormBasicInfo, updateQuestions } = useFormActions();
    const { getFullForm, setIsSaving, clearAllAnimations } = useFormEditor();
    const { isSaving } = useFormUI();

    // URL params에서 survey ID 가져오기
    const surveyId = params?.id as string;

    // JSON 가져오기 모달 상태
    const [showJsonImportModal, setShowJsonImportModal] = useState(false);

    // JSON 미리보기 모달 상태
    const [showJsonExportModal, setShowJsonExportModal] = useState(false);

    // JSON 가져오기 핸들러
    const handleJsonImport = React.useCallback((surveyData: TSurvey) => {
        // ID는 제거하고 나머지 모든 정보를 완전히 덮어씌움
        const { id, questions, ...basicInfo } = surveyData;

                // 기본 정보 완전히 덮어씌우기
        updateFormBasicInfo({
            id: '', // ID는 빈 문자열로 설정
            ...basicInfo,
        });
        
        // 문항 정보 완전히 덮어씌우기 - 강제로 새로운 배열 생성
        const newQuestions = questions ? [...questions] : [];
        updateQuestions(newQuestions);

        toast.success('JSON에서 설문이 성공적으로 가져와졌습니다.');
    }, [updateFormBasicInfo, updateQuestions]);

    // 저장 핸들러
    const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const fullForm = getFullForm();

        if (!fullForm.title.trim()) {
            toast.error("설문 제목을 입력해주세요.");
            return;
        }

        if (!fullForm.questions || fullForm.questions.length === 0) {
            toast.error("최소 하나의 문항을 추가해주세요.");
            return;
        }

        // 문항 제목 검증
        const emptyTitleIndex = fullForm.questions.findIndex(question => !question.title.trim());
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
        const emptyOptionIndex = fullForm.questions.findIndex(question => {
            if (!optionRequiredTypes.includes(question.question_type)) return false;

            // 옵션이 없거나 모든 옵션이 비어있는지 확인
            if (!question.options || question.options.length === 0) return true;

            // 모든 옵션이 비어있는지 확인
            return question.options.every(option => !option.label.trim() && !option.key.trim());
        });

        if (emptyOptionIndex !== -1) {
            const question = fullForm.questions[emptyOptionIndex];
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

                    // 문항 옵션 입력 필드에 포커스
                    setTimeout(() => {
                        const optionInput = questionElement.querySelector('input[placeholder="옵션을 입력하세요"]') as HTMLInputElement;
                        if (optionInput) {
                            optionInput.focus();
                            optionInput.select();
                        }
                    }, 1000);
                }
            }, 100);

            return;
        }

        setIsSaving(true);
        toast.promise(onSave(fullForm, surveyId), {
            pending: '설문 저장 중...',
            success: {
                render: ({ data }: { data: TSurvey }) => {
                    setIsSaving(false);
                    if (surveyId) {
                        router.refresh()
                    } else {
                        router.replace(`/admin/forms/${data.id}`)
                    }
                    return '설문이 성공적으로 저장되었습니다.'
                }
            },
            error: {
                render: (error: any) => {
                    setIsSaving(false);
                    console.error('설문 저장 중 오류 발생:', error);
                    return '설문 저장 중 오류가 발생했습니다. 다시 시도해주세요.';
                }
            }
        });

    }, [onSave, getFullForm, setIsSaving, clearAllAnimations, surveyId, router]);

    return (
        <>
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
                                {isSaving ? '저장 중...' : (surveyId ? '설문 수정' : '설문 저장')}
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
            />

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick={true}
                rtl={false}
                pauseOnFocusLoss={false}
                draggable={false}
                pauseOnHover={true}
                theme="light"
                limit={3}
            />
        </>
    );
}); 