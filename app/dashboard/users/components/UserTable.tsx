'use client'

import { useState, useEffect, useRef } from 'react'
import CreateUserModal from './CreateUserModal'
import { Profile, UserRole } from '@/app/types'
import Link from 'next/link'

export default function UserTable({
  users,
  deleteUser,
  updateUserRole,
  currentUserId,
  createUser
}: {
  users: Profile[],
  deleteUser: (id: string) => Promise<boolean>,
  updateUserRole: (id: string, newRole: UserRole) => Promise<Profile>,
  currentUserId: string | null,
  createUser: (formData: FormData) => Promise<any>
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchField, setSearchField] = useState('username')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: Profile | null }>({
    isOpen: false,
    user: null
  })
  const [editingRoles, setEditingRoles] = useState<{ [key: string]: UserRole }>({})
  const [createModal, setCreateModal] = useState(false)
  const selectRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // 외부 클릭 감지하여 편집 모드 취소
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // 편집 중인 모든 셀렉트 박스 확인
      Object.keys(editingRoles).forEach(userId => {
        const selectRef = selectRefs.current[userId]
        if (selectRef && !selectRef.contains(target)) {
          // 외부 클릭이면 편집 모드 취소
          setEditingRoles(prev => {
            const newState = { ...prev }
            delete newState[userId]
            return newState
          })
        }
      })
    }

    // 편집 중인 항목이 있을 때만 이벤트 리스너 추가
    if (Object.keys(editingRoles).length > 0) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingRoles])

  // 검색 필터링
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true

    const searchValue = searchTerm.toLowerCase()
    switch (searchField) {
      case 'username':
        return user.username.toLowerCase().includes(searchValue)
      case 'display_name':
        if (user.display_name) {
          return user.display_name.toLowerCase().includes(searchValue)
        } else {
          return user.username.toLowerCase().includes(searchValue)
        }
      case 'role':
        return user.role.toLowerCase().includes(searchValue)
      // case 'id':
      //   return user.id.toLowerCase().includes(searchValue)
      default:
        return true
    }
  })

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  }

  // 삭제 모달 열기
  const openDeleteModal = (user: Profile) => {
    setDeleteModal({ isOpen: true, user })
  }

  // 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null })
  }

  // 삭제 처리 함수
  const handleDelete = async () => {
    if (!deleteModal.user) return

    try {
      const response = await deleteUser(deleteModal.user.id)

      if (response) {
        alert('사용자가 성공적으로 삭제되었습니다.')
        closeDeleteModal()
        // 페이지 새로고침 또는 상태 업데이트
        window.location.reload()
      } else {
        alert(`삭제 실패`)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
      console.error('삭제 오류:', error)
    }
  }

  // 권한 수정 처리 함수
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole)
      alert('권한이 성공적으로 수정되었습니다.')
      // 편집 상태 초기화
      setEditingRoles(prev => {
        const newState = { ...prev }
        delete newState[userId]
        return newState
      })
      // 페이지 새로고침
      window.location.reload()
    } catch (error) {
      alert('권한 수정 중 오류가 발생했습니다.')
      console.error('권한 수정 오류:', error)
    }
  }

  // 권한 편집 모드 토글
  const toggleRoleEdit = (userId: string, currentRole: UserRole) => {
    setEditingRoles(prev => ({
      ...prev,
      [userId]: currentRole
    }))
  }

  // 권한 편집 취소
  const cancelRoleEdit = (userId: string) => {
    setEditingRoles(prev => {
      const newState = { ...prev }
      delete newState[userId]
      return newState
    })
  }

  // 권한 선택 시 자동 저장
  const handleRoleSelect = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole)
      // 편집 상태 초기화
      setEditingRoles(prev => {
        const newState = { ...prev }
        delete newState[userId]
        return newState
      })
      // 페이지 새로고침
      window.location.reload()
    } catch (error) {
      alert('권한 수정 중 오류가 발생했습니다.')
      console.error('권한 수정 오류:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 헤더 */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">사용자 목록</h2>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors" onClick={() => setCreateModal(true)}>
          사용자 생성
        </button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사용자명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                권한
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                수정일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 h-[60px]">
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {/* {user.id.substring(0, 8)}... */}
                  {currentUserId === user.id ? (
                    <span className="inline-flex px-1 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-800 mr-2">
                      본인
                    </span>
                  ) : null}
                  <Link
                    href={`/dashboard/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-900 hover:underline"
                  >
                    {user.username}
                  </Link>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  <Link
                    href={`/dashboard/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-900 hover:underline"
                  >
                    {user.display_name || user.username}
                  </Link>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 w-[150px]">
                  {editingRoles[user.id] !== undefined ? (
                    <div
                      ref={(el) => { selectRefs.current[user.id] = el }}
                      className="flex items-center space-x-2"
                    >
                      <select
                        value={editingRoles[user.id]}
                        onChange={(e) => handleRoleSelect(user.id, e.target.value as UserRole)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="user">사용자</option>
                        <option value="moderator">모더레이터</option>
                        <option value="admin">관리자</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span
                        onClick={currentUserId === user.id ? undefined : () => toggleRoleEdit(user.id, user.role)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${currentUserId === user.id
                          ? 'cursor-not-allowed opacity-50'
                          : 'cursor-pointer'
                          } ${user.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : user.role === 'moderator'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                      >
                        {user.role === 'admin' ? '관리자' : user.role === 'moderator' ? '모더레이터' : '사용자'}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.updated_at)}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm font-medium">
                  {currentUserId === user.id ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 cursor-not-allowed">
                        삭제 불가
                      </span>
                    </div>
                  ) : (
                    <button
                      className="text-red-600 hover:text-red-900 underline"
                      onClick={() => openDeleteModal(user)}
                    >
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">페이지:</span>
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm rounded ${currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">표시:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value={10}>10개씩 보기</option>
            <option value={20}>20개씩 보기</option>
            <option value={50}>50개씩 보기</option>
          </select>
        </div>
      </div>

      {/* 검색 */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="username">이메일</option>
            <option value="display_name">사용자명</option>
            <option value="role">권한</option>
          </select>
          <input
            type="text"
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModal.isOpen && deleteModal.user && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">사용자 삭제</h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                정말로 사용자 <span className="font-semibold text-gray-900">{`"${deleteModal.user.username}"`}</span>을(를) 삭제하시겠습니까?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 생성 모달 */}
      <CreateUserModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        onCreateUser={createUser}
      />
    </div>
  )
}