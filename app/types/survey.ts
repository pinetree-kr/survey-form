import { Json } from './supabase'

interface Creator {
    id: string
    username: string
    display_name?: string
}

// 기존 스키마와 호환되는 설문 응답 타입
export interface SurveyResponse {
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


export interface SurveyResponseWithCreator extends SurveyResponse {
    creator: Creator
    updater?: Creator
}

// 기존 스키마와 호환되는 설문 타입
export interface Survey {
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
    allow_response_modification?: boolean
    allow_duplicate_responses: boolean
    opens_at: string | null
    closes_at: string | null
    created_by: string
    updated_by: string | null
    created_at: string
    updated_at: string
}

export interface SurveyWithCreator extends Survey {
    creator: Creator
    updater?: Creator
}

// ResponseList에서 사용하는 확장된 설문 타입 (응답 포함)
export interface SurveyWithResponses extends Survey {
    responses: SurveyResponse[]
}

// ResponseList Props 타입
export interface ResponseListProps {
    surveys: SurveyWithResponses[]
}

// 응답 데이터 포맷팅을 위한 타입
export interface FormattedResponseData {
    questionId: string
    value: string
} 