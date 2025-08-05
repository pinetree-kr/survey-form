"use client"

import { TSurvey } from "@/app/components";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useFormEditor } from "./FormEditorContext";

// 디바운스 훅
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export const SurveyBasicInfo = React.memo(function SurveyBasicInfo() {
    const { formBasicInfo, updateFormBasicInfo } = useFormEditor();
    const [copySuccess, setCopySuccess] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [rawAllowedListText, setRawAllowedListText] = useState('');
    const [isSecretKeyRevealed, setIsSecretKeyRevealed] = useState(false);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    // 로컬 상태로 관리하여 즉시 UI 업데이트
    const [localSurvey, setLocalSurvey] = useState(formBasicInfo);

    // 외부 survey가 변경되면 로컬 상태 동기화
    useEffect(() => {
        setLocalSurvey(formBasicInfo);
        // 허용된 응답자 목록 텍스트 초기화
        setRawAllowedListText(formBasicInfo.allowed_list?.join('\n') || '');
        // 시크릿 키 reveal 상태 초기화
        setIsSecretKeyRevealed(false);
    }, [formBasicInfo]);

    // 클라이언트에서 baseUrl 설정
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }
    }, []);

    // 디바운스된 업데이트를 위한 상태
    const [pendingUpdates, setPendingUpdates] = useState<Partial<Omit<TSurvey, 'questions'>>>({});

    // 디바운스된 업데이트 적용
    const debouncedPendingUpdates = useDebounce(pendingUpdates, 500);

    // 디바운스된 업데이트가 변경되면 부모에게 전달
    useEffect(() => {
        if (Object.keys(debouncedPendingUpdates).length > 0) {
            updateFormBasicInfo(debouncedPendingUpdates);
            setPendingUpdates({});
        }
    }, [debouncedPendingUpdates, updateFormBasicInfo]);

    // 즉시 업데이트가 필요한 필드들 (토글 버튼들)
    const handleImmediateUpdate = useCallback((updates: Partial<Omit<TSurvey, 'questions'>>) => {
        setLocalSurvey(prev => ({ ...prev, ...updates }));
        updateFormBasicInfo(updates);
    }, [updateFormBasicInfo]);

    // 디바운스된 업데이트가 필요한 필드들 (텍스트 입력들)
    const handleDebouncedUpdate = useCallback((updates: Partial<Omit<TSurvey, 'questions'>>) => {
        setLocalSurvey(prev => ({ ...prev, ...updates }));
        setPendingUpdates(prev => ({ ...prev, ...updates }));
    }, []);

    // 메모이제이션된 이벤트 핸들러들
    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleDebouncedUpdate({ title: e.target.value });
    }, [handleDebouncedUpdate]);

    const handleTitleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        const trimmedValue = e.target.value.trim();
        setLocalSurvey(prev => ({ ...prev, title: trimmedValue }));
        updateFormBasicInfo({ title: trimmedValue });
    }, [updateFormBasicInfo]);

    const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handleDebouncedUpdate({ description: e.target.value });
    }, [handleDebouncedUpdate]);

    const handleDescriptionBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
        const trimmedValue = e.target.value.trim();
        setLocalSurvey(prev => ({ ...prev, description: trimmedValue }));
        updateFormBasicInfo({ description: trimmedValue });
    }, [updateFormBasicInfo]);


    const handleWebhookUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleDebouncedUpdate({ webhook_url: e.target.value });
    }, [handleDebouncedUpdate]);

    // 시크릿키 재생성 핸들러
    const handleRegenerateSecretKey = useCallback(() => {
        import('@/lib/access-token').then(({ generateSecretKey }) => {
            const newSecretKey = generateSecretKey();
            setLocalSurvey(prev => ({ ...prev, access_secret_key: newSecretKey }));
            updateFormBasicInfo({ access_secret_key: newSecretKey });
            setShowRegenerateModal(false);
        });
    }, [updateFormBasicInfo]);

    // 토글 버튼 핸들러들
    const handleIsActiveToggle = useCallback(() => {
        handleImmediateUpdate({ is_active: !localSurvey.is_active });
    }, [localSurvey.is_active, handleImmediateUpdate]);

    const handleAllowAnonymousToggle = useCallback(() => {
        const newAllowAnonymous = !localSurvey.allow_anonymous;

        // 익명 허용을 끄면서 중복 응답이 허용되지 않는 경우, 이메일 필수 또는 액세스 토큰 필수 중 하나는 켜져야 함
        if (!newAllowAnonymous && !localSurvey.allow_duplicate_responses) {
            if (!localSurvey.email_required && !localSurvey.access_token_required) {
                // 이메일 필수를 자동으로 켜기
                handleImmediateUpdate({
                    allow_anonymous: newAllowAnonymous,
                    email_required: true
                });
                return;
            }
        }

        handleImmediateUpdate({ allow_anonymous: newAllowAnonymous });
    }, [localSurvey.allow_anonymous, localSurvey.allow_duplicate_responses, localSurvey.email_required, localSurvey.access_token_required, handleImmediateUpdate]);

    const handleEmailRequiredToggle = useCallback(() => {
        const newEmailRequired = !localSurvey.email_required;

        // 이메일 필수를 끄려고 할 때, 중복 응답이 허용되지 않고 액세스 토큰도 꺼져 있으면 끌 수 없음
        if (!newEmailRequired && !localSurvey.allow_duplicate_responses && !localSurvey.access_token_required) {
            // 액세스 토큰을 자동으로 켜기
            handleImmediateUpdate({
                email_required: newEmailRequired,
                access_token_required: true
            });
            return;
        }

        handleImmediateUpdate({ email_required: newEmailRequired });
    }, [localSurvey.email_required, localSurvey.allow_duplicate_responses, localSurvey.access_token_required, handleImmediateUpdate]);

    const handleAllowResponseViewToggle = useCallback(() => {
        handleImmediateUpdate({ allow_response_view: !localSurvey.allow_response_view });
    }, [localSurvey.allow_response_view, handleImmediateUpdate]);

    const handleAllowResponseModificationToggle = useCallback(() => {
        handleImmediateUpdate({ allow_response_modification: !localSurvey.allow_response_modification });
    }, [localSurvey.allow_response_modification, handleImmediateUpdate]);

    const handleAccessTokenRequiredToggle = useCallback(() => {
        const newAccessTokenRequired = !localSurvey.access_token_required;

        // 액세스 토큰을 끄려고 할 때, 중복 응답이 허용되지 않고 이메일 필수도 꺼져 있으면 끌 수 없음
        if (!newAccessTokenRequired && !localSurvey.allow_duplicate_responses && !localSurvey.email_required) {
            // 이메일 필수를 자동으로 켜기
            handleImmediateUpdate({
                access_token_required: newAccessTokenRequired,
                email_required: true
            });
            return;
        }

        handleImmediateUpdate({ access_token_required: newAccessTokenRequired });
    }, [localSurvey.access_token_required, localSurvey.allow_duplicate_responses, localSurvey.email_required, handleImmediateUpdate]);

    const handleAllowDuplicateResponsesToggle = useCallback(() => {
        const newAllowDuplicate = !localSurvey.allow_duplicate_responses;

        // 중복 응답을 허용하지 않는 경우
        if (!newAllowDuplicate) {
            const updates: Partial<Omit<TSurvey, 'questions'>> = {
                allow_duplicate_responses: newAllowDuplicate
            };

            // 익명 허용이 켜져 있으면 끄기
            if (localSurvey.allow_anonymous) {
                updates.allow_anonymous = false;
            }

            // 이메일 필수와 액세스 토큰이 모두 꺼져 있으면 이메일 필수를 켜기
            if (!localSurvey.email_required && !localSurvey.access_token_required) {
                updates.email_required = true;
            }

            handleImmediateUpdate(updates);
            return;
        }

        handleImmediateUpdate({ allow_duplicate_responses: newAllowDuplicate });
    }, [localSurvey.allow_duplicate_responses, localSurvey.allow_anonymous, localSurvey.email_required, localSurvey.access_token_required, handleImmediateUpdate]);

    // 시간 설정 핸들러들
    const handleOpensAtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const dateTime = value ? new Date(value).toISOString() : null;
        handleImmediateUpdate({ opens_at: dateTime });
    }, [handleImmediateUpdate]);

    const handleClosesAtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value) {
            const dateTime = new Date(value).toISOString();
            handleImmediateUpdate({ closes_at: dateTime });
        }
    }, [handleImmediateUpdate]);

    // 메모이제이션된 JSX 부분들
    const titleInput = useMemo(() => (
        <input
            type="text"
            value={localSurvey.title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            className="w-full border rounded px-3 py-2 text-base min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="설문 제목을 입력하세요"
            required
        />
    ), [localSurvey.title, handleTitleChange, handleTitleBlur]);

    const descriptionTextarea = useMemo(() => (
        <textarea
            value={localSurvey.description}
            onChange={handleDescriptionChange}
            onBlur={handleDescriptionBlur}
            className="w-full border rounded px-3 py-2 text-base min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="설문에 대한 설명을 입력하세요"
        />
    ), [localSurvey.description, handleDescriptionChange, handleDescriptionBlur]);

    const secretKeyDisplay = useMemo(() => {
        if (!localSurvey.access_secret_key) {
            return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-start">
                        <svg className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium">시크릿 키 자동 생성</p>
                            <p className="mt-1">설문을 저장하면 시크릿 키가 자동으로 생성됩니다.</p>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {!isSecretKeyRevealed ? (
                    // 숨겨진 상태
                    <div className="flex items-center space-x-2">
                        <div className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50 font-mono text-gray-400">
                            ••••••••••••••••••••••••••••••••
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSecretKeyRevealed(true)}
                            className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            표시
                        </button>
                    </div>
                ) : (
                    // 보여진 상태
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={localSurvey.access_secret_key}
                            readOnly
                            className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50 font-mono text-gray-600"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(localSurvey.access_secret_key!);
                                setCopySuccess(true);
                                setTimeout(() => setCopySuccess(false), 2000);
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {copySuccess ? '복사됨' : '복사'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowRegenerateModal(true)}
                            className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            재생성
                        </button>
                    </div>
                )}
            </div>
        );
    }, [localSurvey.access_secret_key, isSecretKeyRevealed, copySuccess]);

    const webhookUrlInput = useMemo(() => (
        <input
            type="url"
            value={localSurvey.webhook_url || ''}
            onChange={handleWebhookUrlChange}
            placeholder="https://your-server.com/webhook"
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    ), [localSurvey.webhook_url, handleWebhookUrlChange]);

    // 시간 입력 필드들
    const opensAtInput = useMemo(() => {
        let value = '';
        if (localSurvey.opens_at) {
            try {
                const date = new Date(localSurvey.opens_at);
                if (!isNaN(date.getTime())) {
                    value = date.toISOString().slice(0, 16);
                }
            } catch (error) {
                console.error('Invalid opens_at date:', localSurvey.opens_at);
            }
        }
        return (
            <input
                type="datetime-local"
                value={value}
                onChange={handleOpensAtChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        );
    }, [localSurvey.opens_at, handleOpensAtChange]);

    const closesAtInput = useMemo(() => {
        let value = '';
        if (localSurvey.closes_at) {
            try {
                const date = new Date(localSurvey.closes_at);
                if (!isNaN(date.getTime())) {
                    value = date.toISOString().slice(0, 16);
                }
            } catch (error) {
                console.error('Invalid closes_at date:', localSurvey.closes_at);
            }
        }
        return (
            <input
                type="datetime-local"
                value={value}
                onChange={handleClosesAtChange}
                className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
            />
        );
    }, [localSurvey.closes_at, handleClosesAtChange]);

    return (
        <div className="bg-white p-6 rounded-md shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">설문 기본 정보</h2>
            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        설문 ID
                    </label>
                    <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500">
                        {localSurvey.id || "자동생성"}
                    </div>

                    {/* 설문 URL 링크 */}
                    {localSurvey.id && (
                        <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                설문 URL
                            </label>
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 font-mono text-sm">
                                    {baseUrl ? `${baseUrl}/${localSurvey.id}` : 'URL 로딩 중...'}
                                </div>
                                <button
                                    onClick={() => {
                                        const surveyUrl = `${baseUrl}/${localSurvey.id}`;
                                        navigator.clipboard.writeText(surveyUrl);
                                        setCopySuccess(true);
                                        setTimeout(() => setCopySuccess(false), 2000);
                                    }}
                                    disabled={!baseUrl}
                                    className="px-3 py-2 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                                >
                                    {copySuccess ? (
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>복사됨</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>링크 복사</span>
                                        </div>
                                    )}
                                </button>
                            </div>

                            {localSurvey.access_token_required && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">액세스 토큰 사용 예시:</p>
                                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-xs">
                                        {baseUrl ? `${baseUrl}/${localSurvey.id}?token=your_token` : 'URL 로딩 중...'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        설문 제목 <span className="text-red-500">*</span>
                    </label>
                    {titleInput}
                </div>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    설문 설명
                </label>
                {descriptionTextarea}
            </div>
            {/* 설문 시간 설정 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">설문 시간 설정</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            시작 시간 (UTC)
                        </label>
                        {opensAtInput}
                        <p className="text-xs text-gray-500 mt-1">
                            설문이 시작되는 시간을 설정합니다. 비워두면 즉시 시작됩니다.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            종료 시간 (UTC) <span className="text-red-500">*</span>
                        </label>
                        {closesAtInput}
                        <p className="text-xs text-gray-500 mt-1">
                            설문이 종료되는 시간을 설정합니다. 응답 수정 기능을 위해 필수입니다.
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            설문 활성화
                        </label>
                        <p className="text-xs text-gray-500">
                            설문을 활성화하여 응답을 받을 수 있도록 합니다
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleIsActiveToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.is_active ? 'bg-green-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.is_active ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* 응답자 식별 설정 섹션 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">응답자 식별 설정</h3>
                <div className="space-y-4">
                    {/* 익명 응답 허용 */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                익명 응답 허용
                            </label>
                            <p className="text-xs text-gray-500">
                                응답자를 식별하지 않고 완전히 익명으로 저장합니다
                            </p>
                            {!localSurvey.allow_duplicate_responses && localSurvey.allow_anonymous && (
                                <p className="text-xs text-amber-600 mt-1 font-medium">
                                    ⚠️ 중복 응답이 허용되지 않으면 익명 응답을 사용할 수 없습니다
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleAllowAnonymousToggle}
                            disabled={!localSurvey.allow_duplicate_responses && localSurvey.allow_anonymous}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${!localSurvey.allow_duplicate_responses && localSurvey.allow_anonymous
                                ? 'bg-gray-300 cursor-not-allowed'
                                : localSurvey.allow_anonymous
                                    ? 'bg-blue-600'
                                    : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.allow_anonymous ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* 이메일 입력 필수 */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                이메일 입력 필수
                            </label>
                            <p className="text-xs text-gray-500">
                                설문 완료 시 이메일을 입력받아 응답자를 식별합니다
                            </p>
                            {!localSurvey.allow_duplicate_responses && localSurvey.email_required && !localSurvey.access_token_required && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                    ⚠️ 중복 응답이 허용되지 않을 때는 이메일 필수 또는 액세스 토큰 필수 중 하나는 필요합니다
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleEmailRequiredToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.email_required ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.email_required ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>


                    {/* 액세스 토큰 필수 */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                액세스 토큰 필수
                            </label>
                            <p className="text-xs text-gray-500">
                                설문 접근 시 액세스 토큰을 요구합니다
                            </p>
                            {!localSurvey.allow_duplicate_responses && !localSurvey.email_required && localSurvey.access_token_required && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                    ⚠️ 중복 응답이 허용되지 않을 때는 이메일 필수 또는 액세스 토큰 필수 중 하나는 필요합니다
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleAccessTokenRequiredToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.access_token_required ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.access_token_required ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* 시크릿 키 표시 */}
                    {localSurvey.access_token_required && (
                        <div className="ml-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                시크릿 키
                            </label>
                            {secretKeyDisplay}
                            <p className="text-xs text-gray-500 mt-1">
                                이 키는 액세스 토큰 검증에 사용됩니다. 안전하게 보관하세요.
                            </p>
                        </div>
                    )}

                    {/* 중복 응답 허용 */}
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                중복 응답 허용
                            </label>
                            <p className="text-xs text-gray-500">
                                동일한 응답자가 여러 번 응답할 수 있도록 허용합니다
                            </p>
                            {!localSurvey.allow_duplicate_responses && (
                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                    ℹ️ 중복 응답을 허용하지 않으면 응답자 식별이 필요합니다
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleAllowDuplicateResponsesToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.allow_duplicate_responses ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.allow_duplicate_responses ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* 식별자로 응답 확인 */}
                    {(localSurvey.email_required || localSurvey.access_token_required) && (
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    식별자로 응답 확인
                                </label>
                                <p className="text-xs text-gray-500">
                                    응답자가 자신의 식별자로 응답을 조회할 수 있도록 합니다
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAllowResponseViewToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.allow_response_view ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.allow_response_view ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    )}

                    {/* 응답 수정 허용 */}
                    {(localSurvey.email_required || localSurvey.access_token_required) && !localSurvey.allow_duplicate_responses && (
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    응답 수정 허용
                                </label>
                                <p className="text-xs text-gray-500">
                                    설문 마감 전까지 응답자가 자신의 응답을 수정할 수 있도록 합니다
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAllowResponseModificationToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.allow_response_modification ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.allow_response_modification ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    )}

                    {/* 허용된 응답자 목록 (화이트리스트) */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    허용된 응답자 목록 (화이트리스트)
                                </label>
                                <p className="text-xs text-gray-500">
                                    목록에 있는 응답자만 설문에 참여할 수 있습니다. 비워두면 모두 허용됩니다.
                                </p>
                            </div>
                        </div>

                        {/* 화이트리스트가 활성화된 경우 관리 UI */}
                        <div className="ml-6 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    허용된 응답자 추가
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="응답자 ID를 한 줄씩 입력하세요&#10;예:&#10;user@example.com&#10;user123&#10;another@email.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    onChange={(e) => {
                                        const identifiers = e.target.value
                                            .split('\n')
                                            .map(line => line.trim())
                                            .filter(line => line.length > 0);
                                        handleImmediateUpdate({ allowed_list: identifiers });
                                    }}
                                    value={localSurvey.allowed_list?.join('\n') || ''}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    이메일 주소, 응답자 ID 등을 한 줄씩 입력하세요
                                </p>
                            </div>

                            {/* 현재 등록된 응답자 수 표시 */}
                            {localSurvey.allowed_list && localSurvey.allowed_list.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <span className="text-blue-800 text-sm font-medium">
                                            {localSurvey.allowed_list.length}명의 응답자가 등록되었습니다
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Webhook 설정 */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Webhook URL
                            </label>
                            <p className="text-xs text-gray-500 mb-3">
                                응답자가 설문을 제출할 때마다 이 URL로 POST 요청을 보냅니다. 비워두면 webhook을 사용하지 않습니다.
                            </p>
                            {webhookUrlInput}
                            <p className="text-xs text-gray-500 mt-2">
                                예: https://your-server.com/webhook/survey-response
                            </p>
                        </div>

                        {/* Webhook 정보 안내 */}
                        {localSurvey.webhook_url && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <div className="flex">
                                    <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium mb-1">Webhook 페이로드 형식:</p>
                                        <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                                            {`{ "survey_id": "...", "response_id": "...", "respondent_id": "...", "answers": {...}, "completed_at": "..." }`}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Secret Key Regenerate Modal */}
            {showRegenerateModal && (
                <div className="fixed inset-0 bg-gray-50/30 flex items-center justify-center z-50">
                    <div className="mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">시크릿 키 재생성</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    시크릿 키를 재생성하면 기존에 발급된 모든 액세스 토큰이 무효화됩니다.
                                    계속하시겠습니까?
                                </p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRegenerateModal(false)}
                                        className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRegenerateSecretKey}
                                        className="px-4 py-2 bg-orange-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        재생성
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}); 