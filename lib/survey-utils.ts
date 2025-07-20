import { OPERATORS, TBranchCondition, TQuestion } from '@/app/components'

/**
 * 조건을 사용자가 읽기 쉬운 형태로 포맷팅하는 함수
 * @param condition - 분기 조건
 * @param questions - 전체 문항 목록
 * @param getQuestionNumber - 문항 번호를 반환하는 함수
 * @returns 포맷팅된 조건 문자열
 */
export function formatCondition(
    condition: TBranchCondition,
    questions: TQuestion[],
    getQuestionNumber: (questionId: string) => string | number
): string {
    const targetQuestion = questions.find(q => q.id === condition.question_id)
    const targetNumber = getQuestionNumber(condition.question_id)

    if (!targetQuestion) {
        return `Q${targetNumber} 조건`
    }

    const operatorText = (OPERATORS.find(o => o.value === condition.operator) ?? OPERATORS[0])?.label

    switch (targetQuestion.question_type) {
        case 'single_choice':
        case 'multiple_choice':
        case 'dropdown':
            // 옵션의 label을 찾기
            const option = targetQuestion.options?.find(opt => opt.key === condition.value)
            return `Q${targetNumber}번 문항에서 "${option?.label || condition.value}" 선택시`

        case 'composite_single':
        case 'composite_multiple':
            // 복합 문항의 경우 sub_key가 있으면 해당 항목의 label을 찾기

            if (condition.sub_key) {
                const compositeItem = targetQuestion.composite_items?.find(item => item.key === condition.sub_key)
                const unit = compositeItem?.unit ? `${compositeItem.unit}` : ''
                return `${targetNumber}번 문항에서 "${compositeItem?.label || condition.sub_key}" 조건이 ${condition.value}${unit} ${operatorText}`
            }
            return `${targetNumber}번 문항에서 조건이 ${condition.value} ${operatorText}`

        default:
            return `${targetNumber}번 문항에서 ${condition.value} ${operatorText}`
    }
} 