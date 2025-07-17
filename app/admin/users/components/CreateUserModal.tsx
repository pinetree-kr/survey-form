'use client'

import { useState } from 'react'
import { UserRole } from '@/app/types'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateUser: (formData: FormData) => Promise<any>
}

export default function CreateUserModal({ isOpen, onClose, onCreateUser }: CreateUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      await onCreateUser(formData)
      setMessage({ type: 'success', text: '사용자가 성공적으로 생성되었습니다.' })
      // 성공 시 1초 후 모달 닫기
      setTimeout(() => {
        onClose()
        window.location.reload()
      }, 1000)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '사용자 생성에 실패했습니다.' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">새 사용자 생성</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form action={handleSubmit} className="px-6 py-4 space-y-4">
          {/* 메시지 표시 */}
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="user@example.com"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="최소 6자 이상"
            />
            <p className="mt-1 text-xs text-gray-500">
              최소 6자 이상 입력해주세요.
            </p>
          </div>

          {/* 닉네임 */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="닉네임을 입력하세요 (선택사항)"
            />
            <p className="mt-1 text-xs text-gray-500">
              닉네임은 선택사항입니다. 비워두면 이메일로 표시됩니다.
            </p>
          </div>

          {/* 권한 */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              권한 <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              name="role"
              defaultValue="user"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">사용자</option>
              <option value="moderator">모더레이터</option>
              <option value="admin">관리자</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
            >
              {isLoading ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 