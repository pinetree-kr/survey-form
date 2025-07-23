"use client"

import React, { useCallback, useMemo } from "react";
import { QuestionSidebarItem } from "./QuestionSidebarItem";
import { useFormQuestions, useFormUI, useFormActions } from "./FormEditorContext";

export const QuestionSidebar = React.memo(function QuestionSidebar() {
    const questions = useFormQuestions();
    const { activeQuestionIndex, deletingQuestionId } = useFormUI();
    const { addQuestion, copyQuestion, deleteQuestion } = useFormActions();
    
    // 문항 클릭 핸들러
    const handleQuestionClick = useCallback((questionId: string) => {
        // 문항 클릭 시 해당 문항으로 스크롤
        const questionElement = document.getElementById(`question-${questionId}`);
        if (questionElement) {
            questionElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // 스크롤 완료 후 하이라이트 효과
            setTimeout(() => {
                // 기존 모든 애니메이션 클래스 제거
                const animationClasses = [
                    'question-highlight', 'question-error-highlight', 'question-fade-in', 'question-copy',
                    'sidebar-question-highlight', 'sidebar-question-error-highlight', 'sidebar-question-fade-in', 'sidebar-question-copy'
                ];

                animationClasses.forEach(className => {
                    document.querySelectorAll(`.${className}`).forEach(el => {
                        el.classList.remove(className);
                    });
                });

                // 현재 문항에 하이라이트 추가
                questionElement.classList.add('question-highlight');

                // 사이드바에서도 하이라이트
                const sidebarElement = document.getElementById(`sidebar-question-${questionId}`);
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
    }, []);



    // 빈 상태 JSX
    const emptyState = useMemo(() => (
        <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <p className="text-gray-500 text-sm">문항을 추가해주세요</p>
        </div>
    ), []);

    // 문항 목록 JSX
    const questionList = useMemo(() => (
        <div className="p-2 space-y-2">
            {questions.map((question, index) => (
                <QuestionSidebarItem
                    key={`sidebar-${question.id}`}
                    question={question}
                    index={index}
                    isActive={activeQuestionIndex === index}
                    isDeleting={question.id === deletingQuestionId}
                    onQuestionClick={handleQuestionClick}
                    onCopyQuestion={copyQuestion}
                    onDeleteQuestion={deleteQuestion}
                />
            ))}
        </div>
    ), [questions, activeQuestionIndex, deletingQuestionId, handleQuestionClick, copyQuestion, deleteQuestion]);

    // 헤더 JSX
    const header = useMemo(() => (
        <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">문항 목록</h2>
            <p className="text-sm text-gray-500 mt-1">총 {questions.length}개 문항</p>
        </div>
    ), [questions.length]);

    // 푸터 JSX
    const footer = useMemo(() => (
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
    ), [addQuestion]);

    return (
        <div className="w-[270px] bg-white border-r rounded-md shadow-md border-gray-200 flex flex-col fixed top-[170px] left-[20px] bottom-[120px] z-30">
            {header}
            <div className="flex-1 overflow-y-auto pb-8">
                {questions.length === 0 ? emptyState : questionList}
            </div>
            {footer}
        </div>
    );
}); 