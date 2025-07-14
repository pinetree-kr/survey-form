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
};

// 객관식 옵션
export type TOption = {
    label: string;
    value: string;
    next_question_id?: string; // 특정 옵션 선택 시 이동할 질문 ID
    images?: string[]; // 옵션 이미지 URL 배열
};

// 분기 조건
export type TBranchCondition = {
    question_id: string;
    sub_key?: string; // 복합 질문의 경우 특정 하위 항목 키
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "greater_than_or_equal" | "less_than_or_equal";
    value: string | number;
};

// 분기 로직
export type TBranchLogic = {
    conditions: TBranchCondition[];
    next_question_id: string; // 조건이 만족될 때 이동할 질문 ID
};

// 문항이 보여질 조건
export type TShowCondition = {
    conditions: TBranchCondition[];
};

// 문항 기본 타입
export type TQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "composite_single"
  | "composite_multiple";

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
    show_condition?: TShowCondition;
};

// 설문 전체 타입
export type TSurvey = {
    id: string;
    title: string;
    description?: string;
    questions: TQuestion[];
};