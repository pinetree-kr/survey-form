"use client"

import React, { useState } from "react";
import { TSurvey } from "@/app/components";
import SurveyFormCore from "@/app/components/SurveyFormCore";
import { ResponseJsonModal } from './ResponseJsonModal';

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

export function SurveyFormPreview({ 
    survey, 
    previewTokenMetadata 
}: { 
    survey: TSurvey;
    previewTokenMetadata?: { token: string; [key: string]: any };
}) {
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [responseData, setResponseData] = useState<any>(null);

    // 미리보기 모드 완료 핸들러
    const handlePreviewComplete = () => {
        console.log('handlePreviewComplete');
        setShowResponseModal(true);
    };

    // 응답 데이터를 준비하는 함수
    const prepareResponseData = (answers: Answer[], etcValues: Record<string, string>, respondentId?: string) => {
        // etcValues에서 값이 비어있는 키들을 제거
        const filteredEtcValues = Object.fromEntries(
            Object.entries(etcValues).filter(([, value]) =>
                value && value.trim() !== ''
            )
        );

        const data = {
            survey_id: survey.id,
            survey_title: survey.title,
            response_time: new Date().toISOString(),
            respondent_id: survey.email_required ? respondentId : undefined,
            answers: answers.map(answer => {
                const question = survey.questions.find(q => q.id === answer.questionId);
                const etcValue = etcValues[answer.questionId];
                // etcValues가 존재하는 경우 처리
                let finalValue: any = answer.value;
                if (etcValue && etcValue.trim() !== '') {
                    if (Array.isArray(answer.value) || question?.question_type === 'multiple_choice') {
                        // 배열이거나 multiple_choice인 경우 기타 값을 추가
                        if (Array.isArray(answer.value)) {
                            finalValue = answer.value.map(v => v === 'etc' ? etcValue : v);
                        } else {
                            finalValue = [answer.value, etcValue];
                        }
                    } else if (question?.question_type === 'composite_multiple') {
                        // composite_multiple인 경우 기존 객체에 etc_value 필드 추가
                        finalValue = {
                            ...answer.value as Record<string, string>,
                            etc_value: etcValue
                        };
                    } else {
                        // 배열이 아닌 경우 기타 값으로 교체
                        finalValue = etcValue;
                    }
                }

                return {
                    question_id: answer.questionId,
                    question_title: question?.title || 'Unknown Question',
                    question_type: question?.question_type || 'unknown',
                    value: finalValue,
                };
            }),
            etc_values: filteredEtcValues,
            total_questions: survey.questions.length,
            answered_questions: answers.length,
            is_preview: true
        };
        
        setResponseData(data);
        return data;
    };

    const handleSubmit = async (answers: Answer[], etcValues: Record<string, string>, respondentId?: string) => {
        // 미리보기에서는 실제 제출하지 않고 응답 데이터만 준비
        prepareResponseData(answers, etcValues, respondentId);
    };

    return (
        <>
            <SurveyFormCore
                survey={survey}
                isPreview={true}
                onSubmit={handleSubmit}
                onComplete={handlePreviewComplete}
                completionTitle="설문이 완료되었습니다!"
                completionMessage="미리보기 모드에서 응답을 확인해보세요."
                submitButtonText="응답 확인하기"
                audience={previewTokenMetadata ? 'preview-user' : undefined}
                metadata={previewTokenMetadata}
            />
            
            {/* 응답 JSON 모달 */}
            <ResponseJsonModal
                isOpen={showResponseModal}
                onClose={() => setShowResponseModal(false)}
                responseData={responseData}
            />
        </>
    );
} 