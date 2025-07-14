import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SurveyForm, TSurvey } from "./components";

export default async function FormViewPage() {
    // const { NEXT_PUBLIC_APP_URL } = (await getCloudflareContext({ async: true })).env;


    // 테스트용 샘플 설문 데이터 생성 함수
    const createSampleSurvey = (): TSurvey => {
        return {
            id: "sample-survey-1",
            title: "건강 상태 설문조사",
            questions: [
                {
                    id: "q1",
                    title: "현재 건강 상태는 어떠신가요?",
                    description: "전반적인 건강 상태를 평가해주세요.",
                    type: "multiple_choice",
                    required: true,
                    options: [
                        { label: "매우 좋음", next_question_id: "q3" },
                        { label: "좋음", next_question_id: "q3" },
                        { label: "보통", next_question_id: "q2" },
                        { label: "나쁨", next_question_id: "q2" },
                        { label: "매우 나쁨", next_question_id: "q2" }
                    ]
                },
                {
                    id: "q2",
                    title: "최근 3개월 내 병원 진료를 받으셨나요?",
                    description: "건강 상태가 좋지 않다고 답변하신 분들을 위한 추가 질문입니다.",
                    type: "multiple_choice",
                    required: true,
                    options: [
                        { label: "예", next_question_id: "q3" },
                        { label: "아니오", next_question_id: "q4" }
                    ]
                },
                {
                    id: "q3",
                    title: "일주일에 몇 번 운동하시나요?",
                    description: "건강 상태가 좋다고 답변하신 분들을 위한 질문입니다.",
                    type: "multiple_choice",
                    required: true,
                    options: [
                        { label: "전혀 안함" },
                        { label: "1-2회" },
                        { label: "3-4회" },
                        { label: "5회 이상" }
                    ]
                },
                {
                    id: "q4",
                    title: "신체 정보를 입력해주세요",
                    description: "정확한 건강 평가를 위한 정보입니다.",
                    type: "composite",
                    required: true,
                    composite_items: [
                        {
                            label: "키",
                            input_type: "number",
                            unit: "cm",
                            placeholder: "170",
                            key: "height"
                        },
                        {
                            label: "몸무게",
                            input_type: "number",
                            unit: "kg",
                            placeholder: "65",
                            key: "weight"
                        },
                        {
                            label: "나이",
                            input_type: "number",
                            unit: "세",
                            placeholder: "30",
                            key: "age"
                        }
                    ]
                },
                {
                    id: "q5",
                    title: "고혈압이나 당뇨 등의 만성질환이 있으신가요?",
                    description: "BMI가 높은 분들을 위한 추가 질문입니다.",
                    type: "multiple_choice",
                    required: true,
                    options: [
                        { label: "예" },
                        { label: "아니오" }
                    ]
                },
                {
                    id: "q6",
                    title: "키가 크신 분입니다",
                    description: "180cm 이상이신 분들을 위한 안내입니다.",
                    type: "comment",
                    required: false,
                    show_condition: {
                        conditions: [
                            {
                                question_id: "q4.height",
                                operator: "greater_than",
                                value: 180
                            }
                        ]
                    }
                }
            ]
        };
    };
    return (
        <div>
            <SurveyForm survey={createSampleSurvey()} />
        </div>
    )
}