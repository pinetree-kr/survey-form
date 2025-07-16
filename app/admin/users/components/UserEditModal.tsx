'use client'

import { useState } from 'react'
import { Profile } from '@/app/types'

export default function UserEditModal({
  user,
  onClose,
  onSave,
}: {
  user: Profile
  onClose: () => void
  onSave: (user: Profile) => void
}) {
  const [username, setUsername] = useState(user.username)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, username }),
      })
      const updated = await res.json() as { user?: Profile }
      if (updated.user) {
        onSave(updated.user)
      }
    } catch (error) {
      console.error('사용자 정보 수정에 실패했습니다:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
        <h2 className="text-lg font-bold mb-4">사용자 정보 수정</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">닉네임</label>
            <input
              className="border px-2 py-1 w-full"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 border rounded"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}