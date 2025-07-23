'use client'

import { useState } from 'react'

export default function SeedButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSeed = async () => {
    if (!confirm('정말로 시드 데이터를 삽입하시겠습니까? 기존 데이터가 덮어써질 수 있습니다.')) {
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json() as { success: boolean; error?: string; message?: string }

      if (result.success) {
        setMessage('✅ 시드 데이터가 성공적으로 삽입되었습니다!')
      } else {
        setMessage(`❌ 오류: ${result.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      setMessage(`❌ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                시드 데이터
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  샘플 데이터 삽입
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <button
            onClick={handleSeed}
            disabled={isLoading}
            className="font-medium text-yellow-700 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '삽입 중...' : '시드 데이터 삽입'}
          </button>
          {message && (
            <div className={`mt-2 text-sm ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 