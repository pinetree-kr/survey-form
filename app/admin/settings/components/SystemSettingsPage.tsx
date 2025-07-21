"use client"

import React, { useState, useEffect } from 'react'
import { SystemSetting, SettingCategory, SETTING_CATEGORIES } from '@/app/types/system-settings'
import { SettingItem } from './SettingItem'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

interface SystemSettingsPageProps {
  initialSettings: SystemSetting[]
}

export function SystemSettingsPage({ initialSettings }: SystemSettingsPageProps) {
  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings)
  const [selectedCategory, setSelectedCategory] = useState<SettingCategory>('user_management')
  const [isSaving, setIsSaving] = useState(false)

  // 설정 업데이트 함수
  const updateSetting = async (key: string, value: any) => {
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      })

      if (!response.ok) {
        throw new Error('설정 업데이트에 실패했습니다')
      }

      const { setting } = await response.json() as { setting: SystemSetting }
      
      // 로컬 상태 업데이트
      setSettings(prev => 
        prev.map(s => s.key === key ? setting : s)
      )
      
      toast.success('설정이 저장되었습니다')
    } catch (error) {
      console.error('설정 업데이트 오류:', error)
      toast.error('설정 저장에 실패했습니다')
    } finally {
      setIsSaving(false)
    }
  }

  // 카테고리별 설정 필터링
  const filteredSettings = settings.filter(setting => setting.category === selectedCategory)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* 카테고리 탭 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {SETTING_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${selectedCategory === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </nav>
        </div>

        {/* 설정 내용 */}
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {SETTING_CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {SETTING_CATEGORIES.find(c => c.id === selectedCategory)?.description}
            </p>
          </div>

          {isSaving && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-700">설정을 저장하고 있습니다...</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {filteredSettings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                이 카테고리에 설정이 없습니다.
              </div>
            ) : (
              filteredSettings.map((setting) => (
                <SettingItem
                  key={setting.key}
                  setting={setting}
                  onUpdate={updateSetting}
                  disabled={isSaving}
                />
              ))
            )}
          </div>
        </div>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={true}
        theme="light"
        limit={3}
      />
    </div>
  )
} 