// 사용자 역할 enum (migration과 일치)
export type UserRole = 'admin' | 'user' | 'moderator'

// 프로필 테이블 타입
export interface Profile {
    id: string
    username: string
    role: UserRole
    created_at: string
    updated_at: string
}

// API 응답 타입들
export interface UsersResponse {
    users: Profile[]
    totalPages: number
    currentPage: number
    totalCount: number
}

export interface UserUpdateRequest {
    id: string
    username?: string
    role?: UserRole
}

export interface UserDeleteRequest {
    id: string
}
