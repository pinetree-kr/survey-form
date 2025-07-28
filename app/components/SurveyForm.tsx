"use client"

import React from "react";
import { TSurvey } from "./types";
import SurveyFormCore from "./SurveyFormCore";

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

interface SurveyFormProps {
    survey: TSurvey;
    initialRespondentId?: string;
}

export default function SurveyForm({ survey, initialRespondentId }: SurveyFormProps) {
    // 실제 설문 제출 로직
    const handleSubmit = async (answers: Answer[], _etcValues: Record<string, string>, respondentId?: string) => {
        // 응답자 ID 결정
        let finalRespondentId: string | undefined;
        
        // 이메일 입력이 필수인 경우
        if (survey.email_required) {
            finalRespondentId = respondentId;
        }
        // URL 파라미터가 허용된 경우
        else if (survey.allow_url_param && initialRespondentId) {
            finalRespondentId = initialRespondentId;
        }
        // 익명 응답이 허용된 경우
        else if (survey.allow_anonymous) {
            finalRespondentId = undefined;
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
                respondent_id: finalRespondentId
            }),
        });

        if (response.ok) {
            // 성공 시 완료 페이지로 이동하거나 성공 메시지 표시
            alert('설문이 성공적으로 제출되었습니다!');
        } else {
            const errorData = await response.json() as { error?: string };
            throw new Error(errorData.error || '알 수 없는 오류가 발생했습니다.');
        }
    };

    return (
        <SurveyFormCore
            survey={survey}
            initialRespondentId={initialRespondentId}
            isPreview={false}
            onSubmit={handleSubmit}
            completionTitle="설문이 완료되었습니다!"
            completionMessage="설문을 제출하시겠습니까?"
            submitButtonText="설문 제출하기"
        />
    );
}

// Named export도 제공하여 호환성 확보
export { SurveyForm };