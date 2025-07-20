"use client"

import { TQuestion, TSurvey, TOption } from "@/app/components/types";
import { formatCondition } from "@/lib";
import CompositeQuestionItem from "./CompositeQuestionItem";


export default function QuestionListView({
    questions
}: {
    questions: TQuestion[],
}) {


    // 문항 번호를 찾는 헬퍼 함수
    const getQuestionNumber = (questionId: string) => {
        const index = questions.findIndex(q => q.id === questionId)
        return index !== -1 ? index + 1 : '?'
    }

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">문항 목록</h2>
            </div>
            <div className="px-6 py-6">
                {questions && questions.length > 0 ? (
                    <div className="space-y-8">
                        {questions.map((question: TQuestion, index: number) => (
                            <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                                {/* 문항 헤더 */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold text-blue-600">Q{index + 1}</span>
                                        <div className="flex items-center">
                                            {question.required && (
                                                <span className="text-red-500 font-bold text-lg mr-1">*</span>
                                            )}
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {question.title}
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                {/* 문항 설명 */}
                                {question.description && (
                                    <p className="text-gray-600 mb-4 text-sm">{question.description}</p>
                                )}

                                {/* 문항 자체의 다음 문항 표시 */}
                                {question.next_question_id && (
                                    <div className="mb-4 flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                        <span className="text-sm font-medium">응답 후 → </span>
                                        <span className="text-sm">Q{getQuestionNumber(question.next_question_id)}</span>
                                    </div>
                                )}

                                {/* 조건부 표시 조건 */}
                                {question.is_hidden && question.show_conditions && question.show_conditions.length > 0 && (
                                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                            <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm font-medium text-red-700">문항 활성화 조건</span>
                                        </div>
                                        <div className="ml-6 space-y-1">
                                            {question.show_conditions?.map((condition, idx) => (
                                                <div key={idx} className="text-sm text-red-600">
                                                    <span className="inline-flex items-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            {formatCondition(condition, questions, getQuestionNumber)}
                                                        </span>
                                                        {idx < (question.show_conditions?.length || 0) - 1 && (
                                                            <span className="ml-2 text-red-500 font-medium">혹은</span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 문항 유형별 렌더링 */}
                                {question.question_type === 'single_choice' && (
                                    <div className="space-y-3">
                                        {question.options?.map((option: TOption, optIndex: number) => (
                                            <label key={optIndex} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`question-${question.id}`}
                                                    value={option.key}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700">{option.label}</span>
                                                {option.next_question_id && (
                                                    <span className="ml-auto text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                                                        선택시 → Q{getQuestionNumber(option.next_question_id)}
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {question.question_type === 'multiple_choice' && (
                                    <div className="space-y-3">
                                        {question.options?.map((option: any, optIndex: number) => (
                                            <label key={optIndex} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                                                <input
                                                    type="checkbox"
                                                    name={`question-${question.id}`}
                                                    value={option.key}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-gray-700">{option.key}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {question.question_type === 'dropdown' && (
                                    <div className="max-w-xs">
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            defaultValue=""
                                        >
                                            <option value="" disabled>선택해주세요</option>
                                            {question.options?.map((option: any, optIndex: number) => (
                                                <option key={optIndex} value={option.key}>
                                                    {option.key}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {question.question_type === 'short_text' && (
                                    <div className="max-w-md">
                                        <input
                                            type="text"
                                            placeholder="답변을 입력하세요"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {question.question_type === 'long_text' && (
                                    <div className="max-w-2xl">
                                        <textarea
                                            placeholder="답변을 입력하세요"
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                )}

                                {/* 복합형 문항 */}
                                {(question.question_type === 'composite_single' || question.question_type === 'composite_multiple') && (
                                    <div className="space-y-4">
                                        {question.composite_items?.map((item: any, itemIndex: number) => (
                                            <CompositeQuestionItem
                                                key={itemIndex}
                                                item={item}
                                                itemIndex={itemIndex}
                                                questionId={question.id}
                                                questionType={question.question_type as 'composite_single' | 'composite_multiple'}
                                                getQuestionNumber={getQuestionNumber}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* 기타 옵션 */}
                                {question.hasEtc && (
                                    <div className="mt-3">
                                        <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                                            <input
                                                type={question.question_type === 'single_choice' ? 'radio' : 'checkbox'}
                                                name={`question-${question.id}`}
                                                value="etc"
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">기타</span>
                                            <input
                                                type="text"
                                                placeholder="기타 답변"
                                                className="flex-1 ml-2 px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-lg font-medium">문항이 없습니다</p>
                        <p className="text-sm mt-2">설문에 문항을 추가해주세요.</p>
                    </div>
                )}
            </div>
        </div>
    )
} 