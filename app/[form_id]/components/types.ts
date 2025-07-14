
export type TQuestion = {
    id: string;
    title: string;
    description?: string;
    type: "multiple_choice" | "composite" | "comment";
    required?: boolean;
    options?: { 
        label: string;
        next_question_id?: string; // 특정 옵션 선택 시 이동할 질문 ID
    }[];
    composite_items?: {
        label: string;
        input_type: "text" | "number";
        unit?: string;
        placeholder?: string;
        key: string;
    }[];
    // 조건부 로직을 위한 필드들
    conditional_logic?: {
        conditions: {
            question_id: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
            value: string | number;
        }[];
        next_question_id: string; // 조건이 만족될 때 이동할 질문 ID
    }[];
    // 문항이 보여질 조건
    show_condition?: {
        conditions: {
            question_id: string;
            operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
            value: string | number;
        }[];
    };
};

export type TSurvey = {
    id: string;
    title: string;
    questions: TQuestion[];
};