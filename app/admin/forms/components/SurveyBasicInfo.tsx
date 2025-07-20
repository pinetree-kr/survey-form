"use client"

import React, { useState, useEffect } from "react";

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

interface SurveyBasicInfoProps {
    id?: string;
    title: string;
    description: string;
    allow_anonymous?: boolean;
    onUpdate: (updates: { title: string; description: string; allow_anonymous?: boolean }) => void;
}

export function SurveyBasicInfo({ id, title, description, allow_anonymous = false, onUpdate }: SurveyBasicInfoProps) {
    // 로컬 상태로 즉시 반응하는 UI
    const [localTitle, setLocalTitle] = useState(title);
    const [localDescription, setLocalDescription] = useState(description);
    const [localAllowAnonymous, setLocalAllowAnonymous] = useState(allow_anonymous);

    // 디바운스된 값들
    const debouncedTitle = useDebounce(localTitle, 300);
    const debouncedDescription = useDebounce(localDescription, 300);

    // props가 변경될 때 로컬 상태 동기화
    useEffect(() => {
        setLocalTitle(title);
        setLocalDescription(description);
        setLocalAllowAnonymous(allow_anonymous);
    }, [title, description, allow_anonymous]);

    // 디바운스된 값이 변경될 때 부모 컴포넌트에 알림
    useEffect(() => {
        onUpdate({
            title: debouncedTitle,
            description: debouncedDescription,
            allow_anonymous: localAllowAnonymous
        });
    }, [debouncedTitle, debouncedDescription, localAllowAnonymous, onUpdate]);

    return (
        <div className="bg-white p-6 rounded-md shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">설문 기본 정보</h2>
            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        설문 ID
                    </label>
                    <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500">
                        {id || "자동생성"}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        설문 제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={localTitle}
                        onChange={(e) => setLocalTitle(e.target.value)}
                        onBlur={(e) => setLocalTitle(e.target.value.trim())}
                        className="w-full border rounded px-3 py-2 text-base min-h-[40px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="설문 제목을 입력하세요"
                        required
                    />
                </div>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    설문 설명
                </label>
                <textarea
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={(e) => setLocalDescription(e.target.value.trim())}
                    className="w-full border rounded px-3 py-2 text-base min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="설문에 대한 설명을 입력하세요"
                />
            </div>
            <div className="mt-4">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            익명 응답 허용
                        </label>
                        <p className="text-xs text-gray-500">
                            익명으로 설문에 응답할 수 있도록 허용합니다
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setLocalAllowAnonymous(!localAllowAnonymous)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            localAllowAnonymous ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                localAllowAnonymous ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
} 