import { getCloudflareContext } from "@opennextjs/cloudflare";
import { SurveyForm, TSurvey } from "../components";

export default async function FormViewPage() {
    // const { NEXT_PUBLIC_APP_URL } = (await getCloudflareContext({ async: true })).env;

    // 테스트용 샘플 설문 데이터 생성 함수
    const createSampleSurvey = (): TSurvey => {
        return {
            id: "sample-survey-1",
            title: "건강 상태 설문조사",
            description: "전반적인 건강 상태를 파악하기 위한 설문조사입니다.",
            questions: [
                {
                    id: "q1",
                    title: "현재 건강 상태는 어떠신가요?",
                    description: "전반적인 건강 상태를 평가해주세요.",
                    type: "simple",
                    simple_type: "single_choice",
                    required: true,
                    options: [
                        { label: "매우 좋음", value: "very_good", next_question_id: "q3" },
                        { label: "좋음", value: "good", next_question_id: "q3" },
                        { label: "보통", value: "normal", next_question_id: "q2" },
                        { label: "나쁨", value: "bad", next_question_id: "q2" },
                        { label: "매우 나쁨", value: "very_bad", next_question_id: "q2" }
                    ]
                },
                {
                    id: "q2",
                    title: "최근 3개월 내 병원 진료를 받으셨나요?",
                    description: "건강 상태가 좋지 않다고 답변하신 분들을 위한 추가 질문입니다.",
                    type: "simple",
                    simple_type: "single_choice",
                    required: true,
                    options: [
                        { label: "예", value: "yes", next_question_id: "q3" },
                        { label: "아니오", value: "no", next_question_id: "q4" }
                    ]
                },
                {
                    id: "q3",
                    title: "일주일에 몇 번 운동하시나요?",
                    description: "건강 상태가 좋다고 답변하신 분들을 위한 질문입니다.",
                    type: "simple",
                    simple_type: "single_choice",
                    required: true,
                    options: [
                        { label: "전혀 안함", value: "never" },
                        { label: "1-2회", value: "1_2" },
                        { label: "3-4회", value: "3_4" },
                        { label: "5회 이상", value: "5_more" }
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
                            key: "height",
                            required: true
                        },
                        {
                            label: "몸무게",
                            input_type: "number",
                            unit: "kg",
                            placeholder: "65",
                            key: "weight",
                            required: true
                        },
                        {
                            label: "나이",
                            input_type: "number",
                            unit: "세",
                            placeholder: "30",
                            key: "age",
                            required: true
                        }
                    ]
                },
                {
                    id: "q5",
                    title: "고혈압이나 당뇨 등의 만성질환이 있으신가요?",
                    description: "BMI가 높은 분들을 위한 추가 질문입니다.",
                    type: "simple",
                    simple_type: "single_choice",
                    required: true,
                    options: [
                        { label: "예", value: "yes" },
                        { label: "아니오", value: "no" }
                    ],
                    branch_logic: [
                        {
                            conditions: [
                                {
                                    question_id: "q4",
                                    sub_key: "height",
                                    operator: "greater_than",
                                    value: 180
                                }
                            ],
                            next_question_id: "q6"
                        }
                    ]
                },
                {
                    id: "q6",
                    title: "키가 크신 분입니다",
                    description: "180cm 이상이신 분들을 위한 안내입니다.",
                    type: "simple",
                    simple_type: "long_text",
                    required: false,
                    show_condition: {
                        conditions: [
                            {
                                question_id: "q4",
                                sub_key: "height",
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