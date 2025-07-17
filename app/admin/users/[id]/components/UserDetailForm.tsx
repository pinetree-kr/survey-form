'use client'

import { useState } from 'react'
import { Profile, UserRole } from '@/app/types'

interface UserDetailFormProps {
  profile: Profile
  updateProfile: (formData: FormData) => Promise<Profile>
  isOwnProfile: boolean
}

export default function UserDetailForm({ profile, updateProfile, isOwnProfile }: UserDetailFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setMessage(null)

    try {
      await updateProfile(formData)
      setMessage({ type: 'success', text: '사용자 정보가 성공적으로 업데이트되었습니다.' })
      window.location.reload()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '사용자 정보 업데이트에 실패했습니다.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* 메시지 표시 */}
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success'
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      {/* 사용자 ID (읽기 전용) */}
      {/* <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사용자 ID
        </label>
        <input
          type="text"
          value={profile.id}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">
          사용자 ID는 변경할 수 없습니다.
        </p>
      </div> */}

      {/* 이메일 */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          이메일 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="username"
          name="username"
          defaultValue={profile.username}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          placeholder="이메일을 입력하세요"
          readOnly
          disabled
        />
        <p className="mt-1 text-xs text-gray-500">
          이메일은 변경할 수 없습니다.
        </p>
      </div>

      {/* 표시명 */}
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
          표시명
        </label>
        <input
          type="text"
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="표시명을 입력하세요 (선택사항)"
        />
        <p className="mt-1 text-xs text-gray-500">
          표시명은 선택사항입니다. 비워두면 사용자명이 표시됩니다.
        </p>
      </div>

      {/* 권한 (관리자만 수정 가능) */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
          권한 <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          name="role"
          defaultValue={profile.role}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="user">사용자</option>
          <option value="moderator">모더레이터</option>
          <option value="admin">관리자</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          사용자의 권한을 설정할 수 있습니다.
        </p>
      </div>

      {/* 생성일/수정일 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            생성일
          </label>
          <input
            type="text"
            value={new Date(profile.created_at).toLocaleDateString('ko-KR')}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            최종 수정일
          </label>
          <input
            type="text"
            value={new Date(profile.updated_at).toLocaleDateString('ko-KR')}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>

      {/* 숨겨진 사용자 ID 필드 */}
      <input type="hidden" name="user_id" value={profile.id} />

      {/* 버튼 */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <a
          href="/admin/users"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          취소
        </a>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
        >
          {isLoading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
} 