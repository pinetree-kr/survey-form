"use client"

import React, { useState } from 'react';
import { TSurvey } from './types';
import RespondentVerification from './RespondentVerification';
import SurveyFormCore from './SurveyFormCore';

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

interface SurveyFormWrapperProps {
    survey: TSurvey;
    initialRespondentId?: string;
    isPreview?: boolean;
    onSubmit?: (answers: Answer[], etcValues: Record<string, string>, respondentId?: string) => void | Promise<void>;
    onComplete?: () => void;
    completionTitle?: string;
    completionMessage?: string;
    submitButtonText?: string;
    initialData?: any;
    isEditMode?: boolean;
    redirectUrl?: string | null;
    tokenMetadata?: any;
}

export default function SurveyFormWrapper({
    survey,
    initialRespondentId,
    isPreview = false,
    onSubmit,
    onComplete,
    completionTitle,
    completionMessage,
    submitButtonText,
    initialData,
    isEditMode = false,
    redirectUrl,
    tokenMetadata
}: SurveyFormWrapperProps) {
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [verifiedRespondentId, setVerifiedRespondentId] = useState<string>('');

    // 검증이 필요한지 확인하는 함수
    const needsVerification = (): boolean => {
        // 미리보기 모드는 검증 불필요
        if (isPreview) {
            return false;
        }

        // 수정 모드는 검증 불필요 (이미 검증된 상태)
        if (isEditMode) {
            return false;
        }

        // 익명 허용이고 이메일이 필수가 아닌 경우 검증 불필요
        if (survey.allow_anonymous && !survey.email_required) {
            return false;
        }

        // initialRespondentId가 있는 경우 검증 불필요 (URL 파라미터로 전달된 경우)
        if (initialRespondentId && initialRespondentId.trim()) {
            return false;
        }

        // 그 외의 경우는 검증 필요
        return true;
    };

    // 검증 성공 핸들러
    const handleVerificationSuccess = (respondentId: string) => {
        setVerifiedRespondentId(respondentId);
        setIsVerified(true);
    };

    // 검증이 필요하고 아직 검증되지 않은 경우 검증 화면 표시
    if (needsVerification() && !isVerified) {
        return (
            <RespondentVerification
                survey={survey}
                onVerificationSuccess={handleVerificationSuccess}
                initialRespondentId={initialRespondentId}
            />
        );
    }

    // 검증이 통과되었거나 검증이 필요없는 경우 실제 설문 폼 표시
    return (
        <SurveyFormCore
            survey={survey}
            initialRespondentId={verifiedRespondentId || initialRespondentId}
            isPreview={isPreview}
            onSubmit={onSubmit}
            onComplete={onComplete}
            completionTitle={completionTitle}
            completionMessage={completionMessage}
            submitButtonText={submitButtonText}
            initialData={initialData}
            isEditMode={isEditMode}
            redirectUrl={redirectUrl}
            tokenMetadata={tokenMetadata}
        />
    );
}