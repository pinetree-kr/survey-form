import type { ReactNode } from "react";
import { PencilIcon } from "@heroicons/react/24/solid";
import { HashtagIcon } from "@heroicons/react/24/solid";
import { EnvelopeIcon } from "@heroicons/react/24/solid";
import { PhoneIcon } from "@heroicons/react/24/solid";

// 단순 질문의 하위 유형들
export type TSimpleQuestionType =
    | "short_text"      // 단문대답
    | "long_text"       // 장문대답
    | "single_choice"   // 단일 객관식
    | "multiple_choice"; // 중복 객관식

// 복합 질문의 하위 항목
export type TCompositeItem = {
    label: string;
    input_type: "text" | "number" | "email" | "tel";
    unit?: string;
    placeholder?: string;
    key: string;
    required?: boolean;
    next_question_id?: string; // 분기 시 이동할 문항 ID
};

// 객관식 옵션
export type TOption = {
    label: string;
    // value: string;
    key: string;
    next_question_id?: string; // 특정 옵션 선택 시 이동할 질문 ID
    images?: string[]; // 옵션 이미지 URL 배열
};

// 분기 조건
export type TBranchCondition = {
    question_id: string;
    sub_key?: string; // 복합 질문의 경우 특정 하위 항목 키
    operator: "eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte";
    value: string | number;
};

// 분기 로직
export type TBranchLogic = {
    conditions: TBranchCondition[];
    next_question_id: string; // 조건이 만족될 때 이동할 질문 ID
};

// 문항 기본 타입
export type TQuestionType =
    | "short_text"
    | "long_text"
    | "single_choice"
    | "multiple_choice"
    | "dropdown"
    | "composite_single"
    | "composite_multiple"
    | "description";

export type TQuestion = {
    id: string;
    title: string;
    description?: string;
    question_type: TQuestionType;
    required?: boolean;
    images?: string[];
    options?: TOption[];
    composite_items?: TCompositeItem[];
    hasEtc?: boolean;
    branch_logic?: TBranchLogic[];
    // 문항이 보여질 조건
    show_conditions?: TBranchCondition[];
    // 다음 문항 연결 (설정이 없으면 자동으로 다음 문항으로 이동)
    next_question_id?: string;
    // 문항 가리기 여부
    is_hidden?: boolean;
};

// 설문 전체 타입
export type TSurvey = {
    id?: string;
    title: string;
    description?: string;
    is_active?: boolean;
    allow_anonymous?: boolean;
    url_param_required?: boolean;
    email_required?: boolean;
    url_param_name?: string;
    allow_response_view?: boolean;
    allow_response_modification?: boolean;
    allow_duplicate_responses?: boolean;
    allowed_list?: string[] | null; // 허용된 응답자 목록 (null이면 화이트리스트 미사용)
    webhook_url?: string | null; // 응답 제출 시 호출할 webhook URL
    opens_at?: string | null;
    closes_at?: string | null;
    questions: TQuestion[];
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    creator?: {
        id: string;
        username: string;
        display_name?: string;
    };
    updater?: {
        id: string;
        username: string;
        display_name?: string;
    };
}

// 설문 응답 타입
export type TSurveyResponse = {
    id?: string;
    survey_id: string;
    respondent_id?: string | null;
    is_anonymous?: boolean;
    answers: Record<string, any>;
    started_at?: string;
    completed_at?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
};

// 익명 응답 통계 타입
export type TAnonymousResponseSummary = {
    survey_id: string;
    total_anonymous_responses: number;
    completed_anonymous_responses: number;
    avg_completion_time_minutes: number | null;
};

// 문항 유형 리스트
export const QUESTION_TYPE_OPTIONS: { value: TQuestionType; label: string; icon: ReactNode }[] = [
    { value: 'short_text', label: '단답형', icon: <span>✏️</span> },
    { value: 'long_text', label: '장문형', icon: <span>📝</span> },
    { value: 'single_choice', label: '객관식 질문', icon: <span>🔘</span> },
    { value: 'multiple_choice', label: '체크 박스', icon: <span>☑️</span> },
    { value: 'dropdown', label: '드롭다운', icon: <span>⬇️</span> },
    { value: 'composite_single', label: '복합 단일', icon: <span>🔲</span> },
    { value: 'composite_multiple', label: '복합 다중', icon: <span>🗂️</span> },
    { value: 'description', label: '안내문', icon: <span>ℹ️</span> },
]


export const COMPOSITE_INPUT_TYPE_OPTIONS = [
    { value: 'text', label: '텍스트', icon: <PencilIcon className="h-4 w-4 mr-1 text-gray-400" /> },
    { value: 'number', label: '숫자', icon: <HashtagIcon className="h-4 w-4 mr-1 text-gray-400" /> },
    { value: 'email', label: '이메일', icon: <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" /> },
    { value: 'tel', label: '전화번호', icon: <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" /> },
]

// 연산자 목록
export const OPERATORS = [
    { value: 'eq', label: '같음' },
    { value: 'neq', label: '다름' },
    { value: 'contains', label: '포함' },
    { value: 'gt', label: '초과' },
    { value: 'lt', label: '미만' },
    { value: 'gte', label: '이상' },
    { value: 'lte', label: '이하' }
]
