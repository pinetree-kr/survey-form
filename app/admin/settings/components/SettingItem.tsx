"use client"

import React, { useState } from 'react'
import { SystemSetting } from '@/app/types/system-settings'

interface SettingItemProps {
    setting: SystemSetting
    onUpdate: (key: string, value: any) => Promise<void>
    disabled?: boolean
}

export function SettingItem({ setting, onUpdate, disabled = false }: SettingItemProps) {
    const [localValue, setLocalValue] = useState(setting.value)
    const [isUpdating, setIsUpdating] = useState(false)

    const handleUpdate = async () => {
        if (localValue === setting.value) return

        setIsUpdating(true)
        try {
            await onUpdate(setting.key, localValue)
        } finally {
            setIsUpdating(false)
        }
    }

    const renderInput = () => {
        const isDisabled = disabled || isUpdating

        // Boolean 값 (토글 스위치)
        if (typeof localValue === 'boolean') {
            return (
                <button
                    type="button"
                    onClick={() => setLocalValue(!localValue)}
                    disabled={isDisabled}
                    className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${localValue ? 'bg-blue-600' : 'bg-gray-200'}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <span
                        className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${localValue ? 'translate-x-6' : 'translate-x-1'}
            `}
                    />
                </button>
            )
        }

        // Number 값 (숫자 입력)
        if (typeof localValue === 'number') {
            return (
                <input
                    type="number"
                    value={localValue}
                    onChange={(e) => setLocalValue(Number(e.target.value))}
                    disabled={isDisabled}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
            )
        }

        // String 값 (텍스트 입력)
        if (typeof localValue === 'string') {
            // 특별한 문자열 처리 (역할 선택 등)
            if (setting.key === 'user.default_role') {
                return (
                    <select
                        value={localValue}
                        onChange={(e) => setLocalValue(e.target.value)}
                        disabled={isDisabled}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    >
                        <option value="user">사용자</option>
                        <option value="moderator">모더레이터</option>
                        <option value="admin">관리자</option>
                    </select>
                )
            }

            return (
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    disabled={isDisabled}
                    className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
            )
        }

        // 기본값 (JSON 표시)
        return (
            <div className="text-sm text-gray-500">
                {JSON.stringify(localValue)}
            </div>
        )
    }

    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                            {setting.key}
                        </h3>
                        {localValue !== setting.value && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                변경됨
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                        {setting.description}
                    </p>
                    <div className="flex items-center gap-3">
                        {renderInput()}
                        {localValue !== setting.value && (
                            <button
                                onClick={handleUpdate}
                                disabled={disabled || isUpdating}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? '저장 중...' : '저장'}
                            </button>
                        )}
                    </div>
                </div>
                <div className="ml-4 text-xs text-gray-400">
                    <div>카테고리: {setting.category}</div>
                    <div>업데이트: {new Date(setting.updated_at).toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    )
} 