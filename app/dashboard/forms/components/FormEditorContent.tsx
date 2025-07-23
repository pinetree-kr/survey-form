"use client"

import React from "react";
import { TSurvey } from "@/app/components";
import { QuestionList, FormEditorFooter, SurveyBasicInfo, QuestionSidebar } from ".";

interface FormEditorContentProps {
    onSave: (formData: TSurvey, surveyId?: string) => Promise<any>
}

export function FormEditorContent({ onSave }: FormEditorContentProps) {



    return (
        <div className="flex h-[calc(100vh-168px)] bg-gray-50 relative">
            {/* 좌측 사이드바 - 문항 목록 */}
            <QuestionSidebar />

            {/* 우측 메인 영역 (사이드바 너비만큼 여백 추가, 고정 높이) */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 px-8 pb-100">
                    <div className="w-full relative">
                        <div>
                            <div className="ml-[280px]">
                                {/* 설문 기본 정보 */}
                                <SurveyBasicInfo />

                                <div className="border-t border-gray-200 my-6"></div>

                                {/* 문항 편집 영역 */}
                                <div className="space-y-6 mb-6">
                                    <h2 className="text-xl font-semibold mb-2">문항 편집</h2>
                                    <QuestionList />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <FormEditorFooter onSave={onSave} />
        </div>
    );
} 