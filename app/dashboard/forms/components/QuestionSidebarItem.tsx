"use client"

import React, { useCallback } from "react";
import { TQuestion } from "@/app/components";

interface QuestionSidebarItemProps {
    question: TQuestion;
    index: number;
    isActive: boolean;
    isDeleting: boolean;
    onQuestionClick: (questionId: string) => void;
    onCopyQuestion: (questionId: string) => void;
    onDeleteQuestion: (questionId: string) => void;
}

export const QuestionSidebarItem = React.memo(function QuestionSidebarItem({
    question,
    index,
    isActive,
    isDeleting,
    onQuestionClick,
    onCopyQuestion,
    onDeleteQuestion
}: QuestionSidebarItemProps) {

    // 문항 타입 텍스트 변환 함수
    const getQuestionTypeText = useCallback((questionType: string) => {
        switch (questionType) {
            case 'single_choice': return '단일선택';
            case 'multiple_choice': return '다중선택';
            case 'short_text': return '단답형';
            case 'long_text': return '서술형';
            case 'dropdown': return '드롭다운';
            case 'composite_single': return '복합 단일';
            case 'composite_multiple': return '복합 다중';
            case 'description': return '안내문';
            default: return questionType;
        }
    }, []);

    // 복사 버튼 클릭 핸들러
    const handleCopyClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onCopyQuestion(question.id);
    }, [onCopyQuestion, question.id]);

    // 삭제 버튼 클릭 핸들러
    const handleDeleteClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteQuestion(question.id);
    }, [onDeleteQuestion, question.id]);

    // 문항 클릭 핸들러
    const handleQuestionClick = useCallback(() => {
        onQuestionClick(question.id);
    }, [onQuestionClick, question.id]);

    return (
        <div
            key={`sidebar-${question.id}`}
            id={`sidebar-question-${question.id}`}
            className={`border rounded-md p-3 cursor-pointer transition-all duration-200 ${isActive
                ? 'bg-blue-50 border-blue-300 shadow-md'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                } ${isDeleting ? 'sidebar-question-delete' : ''}`}
            onClick={handleQuestionClick}
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
                            {getQuestionTypeText(question.question_type)}
                        </span>
                        {question.required && (
                            <span className="text-red-500">필수</span>
                        )}
                    </div>
                </div>
                <div className="flex gap-1 ml-2">
                    <button
                        onClick={handleCopyClick}
                        className="text-gray-400 hover:text-gray-600 p-1 transition-all duration-200 hover:scale-110"
                        title="복사"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className={`p-1 transition-all duration-200 ${isDeleting
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
    );
}); 