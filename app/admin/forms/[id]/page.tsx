import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CompositeQuestionItem } from './components'
import { TBranchLogic, TOption, TQuestion, TSurvey } from '@/app/components'
import { formatCondition } from '@/lib/survey-utils'

interface SurveyDetailPageProps {
  params: Promise<{
    id: string
  }>
}

// Server Action
async function getSurvey(surveyId: string): Promise<TSurvey | null> {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  const { data, error } = await supabase
    .from('surveys')
    .select(`
      *,
      creator:profiles!surveys_created_by_fkey(
        id, 
        username, 
        display_name
      ),
      updater:profiles!surveys_updated_by_fkey(
        id, 
        username, 
        display_name
      )
    `)
    .eq('id', surveyId)
    .single<TSurvey>()

  if (error || !data) {
    return null
  }

  return data
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = await params
  const survey = await getSurvey(id)

  if (!survey) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  }

  // 문항 번호를 찾는 헬퍼 함수
  const getQuestionNumber = (questionId: string) => {
    const index = survey.questions.findIndex(q => q.id === questionId)
    return index !== -1 ? index + 1 : '?'
  }

  // 분기 정보를 렌더링하는 컴포넌트
  const renderBranchInfo = (question: TQuestion, index: number) => {
    const branchInfo = []

    // 1. 다음 문항 연결
    if (question.next_question_id) {
      branchInfo.push(
        <div key="next" className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
          <span className="text-sm font-medium">→ 다음 문항:</span>
          <span className="text-sm">Q{getQuestionNumber(question.next_question_id)}</span>
        </div>
      )
    }

    // 2. 옵션별 분기 (단일/중복 객관식)
    if (question.options) {
      question.options.forEach((option: any, optIndex: number) => {
        if (option.next_question_id) {
          branchInfo.push(
            <div key={`option-${optIndex}`} className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium">"{option.label}" 선택 시:</span>
              <span className="text-sm">→ Q{getQuestionNumber(option.next_question_id)}</span>
            </div>
          )
        }
      })
    }

    // 3. 복합 문항의 하위 항목별 분기
    if (question.composite_items) {
      question.composite_items.forEach((item: any, itemIndex: number) => {
        if (item.next_question_id) {
          branchInfo.push(
            <div key={`composite-${itemIndex}`} className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
              <span className="text-sm font-medium">"{item.label}" 입력 시:</span>
              <span className="text-sm">→ Q{getQuestionNumber(item.next_question_id)}</span>
            </div>
          )
        }
      })
    }

    // 4. 분기 로직
    if (question.branch_logic && question.branch_logic.length > 0) {
      question.branch_logic.forEach((logic: TBranchLogic, logicIndex: number) => {
        const conditions = logic.conditions.map(condition =>
          formatCondition(condition, survey.questions, getQuestionNumber)
        ).join(' AND ')

        branchInfo.push(
          <div key={`logic-${logicIndex}`} className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium">조건 ({conditions}):</span>
            <span className="text-sm">→ Q{getQuestionNumber(logic.next_question_id)}</span>
          </div>
        )
      })
    }

    // 5. 조건부 표시
    if (question.show_conditions && question.show_conditions.length > 0) {
      const conditions = question.show_conditions.map(condition =>
        formatCondition(condition, survey.questions, getQuestionNumber)
      ).join(' AND ')

      branchInfo.push(
        <div key="show-condition" className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <span className="text-sm font-medium">표시 조건:</span>
          <span className="text-sm">{conditions}</span>
        </div>
      )
    }

    return branchInfo.length > 0 ? (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">이동 경로 정보</h4>
        <div className="space-y-2">
          {branchInfo}
        </div>
      </div>
    ) : null
  }
  console.log({ survey })
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-6 sm:px-6 lg:px-8 space-y-6 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설문 상세</h1>
          <p className="mt-1 text-sm text-gray-500">
            설문조사 정보를 확인하세요.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">기본 정보</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 ID
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                {survey.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 제목
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                {survey.title}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 설명
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 min-h-[80px]">
                {survey.description || '설명 없음'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {survey.is_active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  생성일
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {formatDate(survey.created_at || '')}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작성자
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {survey.creator?.display_name || survey.creator?.username || '알 수 없음'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수정자
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {survey.updater?.display_name || survey.updater?.username || '수정 없음'}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                수정일
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                {formatDate(survey.updated_at || '')}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">설문 미리보기</h2>
          </div>
          <div className="px-6 py-6">
            {survey.questions && survey.questions.length > 0 ? (
              <div className="space-y-8">
                {survey.questions.map((question: TQuestion, index: number) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                    {/* 문항 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-blue-600">Q{index + 1}</span>
                        <h3 className="text-lg font-medium text-gray-900">
                          {question.title}
                        </h3>
                      </div>
                      {question.required && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          필수
                        </span>
                      )}
                    </div>

                    {/* 문항 설명 */}
                    {question.description && (
                      <p className="text-gray-600 mb-4 text-sm">{question.description}</p>
                    )}

                    {/* 이동 경로 정보 표시 */}
                    {renderBranchInfo(question, index)}

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

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">JSON 데이터</h2>
          </div>
          <div className="px-6 py-4">
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(survey, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <Link
                href="/admin/forms"
                className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                목록으로
              </Link>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/forms/${survey.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                수정
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 