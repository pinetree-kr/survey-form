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
    // 로컬 상태로 관리하여 즉시 UI 업데이트
    const [localSurvey, setLocalSurvey] = useState(formBasicInfo);

    // 외부 survey가 변경되면 로컬 상태 동기화
    useEffect(() => {
        setLocalSurvey(formBasicInfo);
    }, [formBasicInfo]);

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

    const handleUrlParamNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        handleDebouncedUpdate({ url_param_name: e.target.value });
    }, [handleDebouncedUpdate]);

    // 토글 버튼 핸들러들
    const handleIsActiveToggle = useCallback(() => {
        handleImmediateUpdate({ is_active: !localSurvey.is_active });
    }, [localSurvey.is_active, handleImmediateUpdate]);

    const handleAllowAnonymousToggle = useCallback(() => {
        handleImmediateUpdate({ allow_anonymous: !localSurvey.allow_anonymous });
    }, [localSurvey.allow_anonymous, handleImmediateUpdate]);

    const handleEmailRequiredToggle = useCallback(() => {
        handleImmediateUpdate({ email_required: !localSurvey.email_required });
    }, [localSurvey.email_required, handleImmediateUpdate]);

    const handleAllowEmailResponseViewToggle = useCallback(() => {
        handleImmediateUpdate({ allow_email_response_view: !localSurvey.allow_email_response_view });
    }, [localSurvey.allow_email_response_view, handleImmediateUpdate]);

    const handleAllowUrlParamToggle = useCallback(() => {
        handleImmediateUpdate({ allow_url_param: !localSurvey.allow_url_param });
    }, [localSurvey.allow_url_param, handleImmediateUpdate]);

    const handleAllowDuplicateResponsesToggle = useCallback(() => {
        handleImmediateUpdate({ allow_duplicate_responses: !localSurvey.allow_duplicate_responses });
    }, [localSurvey.allow_duplicate_responses, handleImmediateUpdate]);

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

    const urlParamNameInput = useMemo(() => (
        <input
            type="text"
            value={localSurvey.url_param_name}
            onChange={handleUrlParamNameChange}
            placeholder="id"
            className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    ), [localSurvey.url_param_name, handleUrlParamNameChange]);

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
            <div className="mt-4">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                익명 응답 허용
                            </label>
                            <p className="text-xs text-gray-500">
                                응답자를 식별하지 않고 완전히 익명으로 저장합니다
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAllowAnonymousToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.allow_anonymous ? 'bg-blue-600' : 'bg-gray-200'
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                이메일 입력 필수
                            </label>
                            <p className="text-xs text-gray-500">
                                설문 완료 시 이메일을 입력받아 응답자를 식별합니다
                            </p>
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

                    {/* 이메일로 응답 조회 허용 */}
                    {localSurvey.email_required && (
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    이메일로 응답 조회 허용
                                </label>
                                <p className="text-xs text-gray-500">
                                    응답자가 이메일로 자신의 응답을 조회할 수 있도록 합니다
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAllowEmailResponseViewToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.allow_email_response_view ? 'bg-blue-600' : 'bg-gray-200'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.allow_email_response_view ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    )}

                    {/* URL 파라미터 허용 */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL 파라미터 허용
                            </label>
                            <p className="text-xs text-gray-500">
                                URL의 쿼리 파라미터로 응답자 ID를 받습니다
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAllowUrlParamToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${localSurvey.allow_url_param ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSurvey.allow_url_param ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* URL 파라미터 이름 설정 */}
                    {localSurvey.allow_url_param && (
                        <div className="ml-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL 파라미터 이름
                            </label>
                            {urlParamNameInput}
                            <p className="text-xs text-gray-500 mt-1">
                                예: ?{localSurvey.url_param_name || 'id'}=user123
                            </p>
                        </div>
                    )}

                    {/* 중복 응답 허용 */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                중복 응답 허용
                            </label>
                            <p className="text-xs text-gray-500">
                                동일한 응답자가 여러 번 응답할 수 있도록 허용합니다
                            </p>
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
                </div>
            </div>
        </div>
    );
}); 