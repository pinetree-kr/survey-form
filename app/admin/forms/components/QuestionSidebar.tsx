"use client"

import React, { useCallback, useMemo } from "react";
import { TQuestion } from "@/app/components";
import { QuestionSidebarItem } from "./QuestionSidebarItem";

interface QuestionSidebarProps {
    questions: TQuestion[];
    activeQuestionIndex: number | null;
    deletingQuestionId: string | null;
    onQuestionClick: (questionId: string) => void;
    onCopyQuestion: (questionId: string) => void;
    onDeleteQuestion: (questionId: string) => void;
    onAddQuestion: () => void;
}

export const QuestionSidebar = React.memo(function QuestionSidebar({
    questions,
    activeQuestionIndex,
    deletingQuestionId,
    onQuestionClick,
    onCopyQuestion,
    onDeleteQuestion,
    onAddQuestion
}: QuestionSidebarProps) {

    // 문항 클릭 핸들러
    const handleQuestionClick = useCallback((questionId: string) => {
        onQuestionClick(questionId);
    }, [onQuestionClick]);



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
                    onQuestionClick={onQuestionClick}
                    onCopyQuestion={onCopyQuestion}
                    onDeleteQuestion={onDeleteQuestion}
                />
            ))}
        </div>
    ), [questions, activeQuestionIndex, deletingQuestionId, onQuestionClick, onCopyQuestion, onDeleteQuestion]);

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
                onClick={onAddQuestion}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 btn-hover-lift flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                문항 추가
            </button>
        </div>
    ), [onAddQuestion]);

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