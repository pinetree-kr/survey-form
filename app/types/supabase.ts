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

// 설문 관련 타입들
export type QuestionType = 
    | 'short_text'
    | 'long_text'
    | 'single_choice'
    | 'multiple_choice'
    | 'dropdown'
    | 'composite_single'
    | 'composite_multiple'

export type InputType = 
    | 'text'
    | 'number'
    | 'email'
    | 'tel'

export type OperatorType = 
    | 'eq'
    | 'neq'
    | 'contains'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'

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
            surveys: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    questions: Json
                    is_active: boolean
                    allow_anonymous: boolean
                    url_param_required: boolean
                    email_required: boolean
                    url_param_name: string
                    allow_response_view: boolean
                    allow_duplicate_responses: boolean
                    opens_at: string | null
                    closes_at: string | null
                    created_by: string
                    updated_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    questions?: Json
                    is_active?: boolean
                    allow_anonymous?: boolean
                    url_param_required?: boolean
                    email_required?: boolean
                    url_param_name?: string
                    allow_response_view?: boolean
                    allow_duplicate_responses?: boolean
                    opens_at?: string | null
                    closes_at?: string | null
                    created_by: string
                    updated_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    questions?: Json
                    is_active?: boolean
                    allow_anonymous?: boolean
                    url_param_required?: boolean
                    email_required?: boolean
                    url_param_name?: string
                    allow_response_view?: boolean
                    allow_duplicate_responses?: boolean
                    opens_at?: string | null
                    closes_at?: string | null
                    created_by?: string
                    updated_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            survey_responses: {
                Row: {
                    id: string
                    survey_id: string
                    respondent: string | null
                    email: string | null
                    is_anonymous: boolean
                    answers: Json
                    started_at: string
                    completed_at: string | null
                    ip_address: string | null
                    user_agent: string | null
                }
                Insert: {
                    id?: string
                    survey_id: string
                    respondent?: string | null
                    email?: string | null
                    is_anonymous?: boolean
                    answers?: Json
                    started_at?: string
                    completed_at?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                }
                Update: {
                    id?: string
                    survey_id?: string
                    respondent?: string | null
                    email?: string | null
                    is_anonymous?: boolean
                    answers?: Json
                    started_at?: string
                    completed_at?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                }
            }
            survey_statistics: {
                Row: {
                    id: string
                    survey_id: string
                    question_id: string
                    answer_data: Json
                    response_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    survey_id: string
                    question_id: string
                    answer_data: Json
                    response_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    survey_id?: string
                    question_id?: string
                    answer_data?: Json
                    response_count?: number
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            active_surveys: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    questions: Json
                    created_by: string
                    updated_by: string | null
                    created_at: string
                    updated_at: string
                    creator_username: string | null
                    creator_display_name: string | null
                    updater_username: string | null
                    updater_display_name: string | null
                }
            }
            survey_response_summary: {
                Row: {
                    survey_id: string
                    survey_title: string
                    total_responses: number
                    completed_responses: number
                    avg_completion_time_minutes: number | null
                }
            }
            current_user_role: {
                Row: {
                    id: string
                    role: UserRole
                }
            }
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: UserRole
            question_type: QuestionType
            input_type: InputType
            operator_type: OperatorType
        }
    }
}