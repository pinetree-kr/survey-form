import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CompositeQuestionItem } from './components'
import { TBranchLogic, TOption, TQuestion, TSurvey } from '@/app/components'
import { formatCondition } from '@/lib/survey-utils'
import QuestionListView from './components/QuestionListView'

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

  // 분기 정보를 렌더링하는 컴포넌트

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

        <QuestionListView questions={survey.questions} />
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
                href={`/admin/forms/${survey.id}/preview`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Preview
              </Link>
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