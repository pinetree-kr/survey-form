"use client"

import React, { useState } from 'react';
import { TSurvey } from './types';
import SurveyFormCore from './SurveyFormCore';

type Answer = {
    questionId: string;
    value: string | string[] | Record<string, string>;
};

interface SurveyFormWrapperProps {
    survey: TSurvey;
    isPreview?: boolean;
    onSubmit?: (answers: Answer[], etcValues: Record<string, string>, respondentId?: string) => void | Promise<void>;
    onComplete?: () => void;
    completionTitle?: string;
    completionMessage?: string;
    submitButtonText?: string;
    initialData?: any;
    isEditMode?: boolean;
    redirectUrl?: string | null;
    metadata?: any;
    audience?: string;
}

export default function SurveyFormWrapper({
    survey,
    isPreview = false,
    onSubmit,
    onComplete,
    completionTitle,
    completionMessage,
    submitButtonText,
    initialData,
    isEditMode = false,
    redirectUrl,
    metadata,
    audience,
}: SurveyFormWrapperProps) {
    const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [respondentId, setRespondentId] = useState<string>(audience || '');
    const [emailError, setEmailError] = useState<string>('');
    const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

    // 이메일 검증 함수
    const validateEmail = React.useCallback((email: string): string => {
        if (!email.trim()) {
            return '이메일을 입력해주세요.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return '올바른 이메일 형식을 입력해주세요.';
        }
        return '';
    }, []);

    // 중복 응답 확인 함수
    const checkDuplicateResponse = React.useCallback(async (respondentIdToCheck: string) => {
        if (!respondentIdToCheck || survey.allow_duplicate_responses) {
            return false;
        }

        setIsCheckingDuplicate(true);
        try {
            const response = await fetch(`/api/surveys/${survey.id}/check-duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    respondent: respondentIdToCheck,
                    email: survey.email_required ? respondentIdToCheck : undefined
                }),
            });

            if (response.ok) {
                const data = await response.json() as {
                    isDuplicate: boolean;
                    existingResponse?: any;
                    isNotAllowed?: boolean;
                    message?: string;
                };

                return data.isDuplicate || data.isNotAllowed || false;
            }
            return false;
        } catch (error) {
            console.error('중복 확인 오류:', error);
            return false;
        } finally {
            setIsCheckingDuplicate(false);
        }
    }, [survey.id, survey.allow_duplicate_responses, survey.email_required]);

    // 이메일 입력 핸들러
    const handleEmailChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const email = e.target.value;
        setEmail(email);
        setEmailError(validateEmail(email));
    }, [validateEmail]);

    // 이메일 검증 핸들러
    const handleEmailVerification = React.useCallback(async () => {
        const emailValidationError = validateEmail(email);
        if (emailValidationError) {
            setEmailError(emailValidationError);
            return;
        }

        const isDuplicate = await checkDuplicateResponse(email);
        if (!isDuplicate) {
            setIsEmailVerified(true);
        }
    }, [email, validateEmail, checkDuplicateResponse]);


    // 이메일 입력 UI (설문 시작 전)
    if (survey.email_required && !isEmailVerified && !isPreview && !isEditMode) {
        const isEmailValid = !emailError && respondentId.trim() !== '';

        return (
            <div className="max-w-2xl mx-auto p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-center mb-2">{survey.title}</h1>
                    {survey.description && (
                        <p className="text-gray-600 text-center">{survey.description}</p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">이메일 주소 입력</h2>
                    <p className="text-gray-600 mb-4">
                        설문을 시작하기 전에 이메일 주소를 입력해주세요.
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            이메일 주소 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={() => setEmailError(validateEmail(email))}
                            placeholder="example@email.com"
                            className={`w-full border px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent ${emailError
                                ? 'border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            required
                            disabled={isCheckingDuplicate}
                        />
                        {emailError && (
                            <p className="mt-1 text-sm text-red-600">{emailError}</p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleEmailVerification}
                            disabled={!isEmailValid || isCheckingDuplicate}
                            className={`px-6 py-2 rounded-lg transition-colors ${isEmailValid && !isCheckingDuplicate
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isCheckingDuplicate ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    확인 중...
                                </div>
                            ) : (
                                '설문 시작하기'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 검증이 통과되었거나 검증이 필요없는 경우 실제 설문 폼 표시
    return (
        <SurveyFormCore
            survey={survey}
            isPreview={isPreview}
            onSubmit={onSubmit}
            onComplete={onComplete}
            completionTitle={completionTitle}
            completionMessage={completionMessage}
            submitButtonText={submitButtonText}
            initialData={initialData}
            isEditMode={isEditMode}
            redirectUrl={redirectUrl}
            email={isEmailVerified ? email : undefined}
            metadata={metadata}
            audience={audience}
        />
    );
}