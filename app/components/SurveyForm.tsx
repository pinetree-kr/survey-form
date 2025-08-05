"use client"

import React from "react";
import { TSurvey } from "./types";
import SurveyFormWrapper from "./SurveyFormWrapper";

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

interface SurveyFormProps {
    survey: TSurvey;
    initialRespondentId?: string;
    initialData?: any;
    isEditMode?: boolean;
    respondentId?: string;
    redirectUrl?: string | null;
    tokenMetadata?: any;
}

export default function SurveyForm({
    survey,
    initialRespondentId,
    initialData,
    isEditMode = false,
    respondentId,
    redirectUrl,
    tokenMetadata
}: SurveyFormProps) {
    // 실제 설문 제출 로직
    const handleSubmit = async (answers: Answer[], _etcValues: Record<string, string>, submitRespondentId?: string) => {
        // 응답자 ID 결정
        let finalRespondent: string | undefined;
        console.log({ isEditMode, survey })
        // 수정 모드인 경우
        if (isEditMode) {
            // 응답 수정 API 호출
            const response = await fetch(`/api/surveys/${survey.id}/responses/${initialData?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    answers: answers.reduce((acc, answer) => {
                        acc[answer.questionId] = answer.value;
                        return acc;
                    }, {} as Record<string, any>),
                    respondent: respondentId || initialRespondentId,
                    email: submitRespondentId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json() as { error?: string };
                throw new Error(errorData.error || '응답 수정에 실패했습니다.');
            }

            return;
        }

        // 새 응답 생성의 경우
        // 이메일 입력이 필수인 경우
        if (survey.email_required && submitRespondentId) {
            finalRespondent = submitRespondentId;
        }
        // 액세스 토큰이 필수인 경우 
        else if (survey.access_token_required && initialRespondentId) {
            finalRespondent = initialRespondentId;
        }
        // 익명 응답이 허용된 경우
        else if (survey.allow_anonymous) {
            finalRespondent = undefined;
        }

        // API로 응답 전송
        const response = await fetch(`/api/surveys/${survey.id}/responses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                answers: answers.reduce((acc, answer) => {
                    acc[answer.questionId] = answer.value;
                    return acc;
                }, {} as Record<string, any>),
                respondent: finalRespondent
            }),
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || '알 수 없는 오류가 발생했습니다.');
        }
    };

    return (
        <SurveyFormWrapper
            survey={survey}
            initialRespondentId={initialRespondentId}
            isPreview={false}
            onSubmit={handleSubmit}
            completionTitle={isEditMode ? "응답이 수정되었습니다!" : "설문이 완료되었습니다!"}
            completionMessage={isEditMode ? "응답을 수정하시겠습니까?" : "설문을 제출하시겠습니까?"}
            submitButtonText={isEditMode ? "응답 수정하기" : "설문 제출하기"}
            initialData={initialData}
            isEditMode={isEditMode}
            redirectUrl={redirectUrl}
            tokenMetadata={tokenMetadata}
        />
    );
}

// Named export도 제공하여 호환성 확보
export { SurveyForm };