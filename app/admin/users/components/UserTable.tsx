'use client'

import { useEffect, useState } from 'react'
import UserEditModal from './UserEditModal'
import { Profile, UsersResponse, UserRole } from '@/app/types'

export default function UserTable() {
  const [users, setUsers] = useState<Profile[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)

  useEffect(() => {
    fetch(`/api/admin/users?page=${page}`)
      .then(res => res.json())
      .then((data: any) => {
        if (data.users) {
          setUsers(data.users)
          setTotalPages(data.totalPages)
        }
      })
      .catch(error => {
        console.error('사용자 목록을 불러오는데 실패했습니다:', error)
      })
  }, [page])

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    setUsers(users.filter(u => u.id !== id))
  }

  const handleRoleChange = async (id: string, role: UserRole) => {
    await fetch(`/api/admin/users`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    setUsers(users.map(u => u.id === id ? { ...u, role } : u))
  }

  return (
    <div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">닉네임</th>
            <th className="border px-4 py-2">권한</th>
            <th className="border px-4 py-2">생성일</th>
            <th className="border px-4 py-2">수정일</th>
            <th className="border px-4 py-2">관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.id}</td>
              <td className="border px-4 py-2">{user.username}</td>
              <td className="border px-4 py-2">
                <select
                  value={user.role}
                  onChange={e => handleRoleChange(user.id, e.target.value as UserRole)}
                  className="border rounded px-2 py-1"
                >
                  <option value="user">user</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="border px-4 py-2">{user.created_at}</td>
              <td className="border px-4 py-2">{user.updated_at}</td>
              <td className="border px-4 py-2 space-x-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => setSelectedUser(user)}
                >
                  수정
                </button>
                <button
                  className="text-red-600 underline"
                  onClick={() => handleDelete(user.id)}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 페이지네이션 */}
      <div className="mt-4 flex gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span>{page} / {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
      {/* 수정 모달 */}
      {selectedUser && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={updated => {
            setUsers(users.map(u => u.id === updated.id ? updated : u))
            setSelectedUser(null)
          }}
        />
      )}
    </div>
  )
}