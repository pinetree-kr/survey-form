import { UserRole } from "./user"

// 페이지네이션 타입
export interface PaginationParams {
    page: number
    pageSize: number
}

// API 에러 타입
export interface ApiError {
    error: string
    status?: number
}

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    role: UserRole
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username: string
                    role?: UserRole
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    role?: UserRole
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: UserRole
        }
    }
}