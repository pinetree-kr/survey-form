import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { ResponseList } from './components/ResponseList'
import { SurveyWithResponses } from '@/app/types'

export default async function ResponsesPage() {
  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  // 모든 설문과 응답 데이터를 가져오기
  const { data: surveys, error: surveysError } = await supabase
    .from('surveys')
    .select(`
      id,
      title,
      description,
      questions,
      is_active,
      allow_anonymous,
      url_param_required,
      email_required,
      url_param_name,
      allow_email_response_view,
      allow_duplicate_responses,
      opens_at,
      closes_at,
      created_by,
      updated_by,
      created_at,
      updated_at,
      responses:survey_responses(
        id,
        survey_id,
        respondent,
        email,
        is_anonymous,
        answers,
        started_at,
        completed_at,
        ip_address,
        user_agent
      )
    `)
    .order('created_at', { ascending: false })

  if (surveysError) {
    console.error('Error fetching surveys:', surveysError)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">오류가 발생했습니다</h1>
          <p className="text-gray-600 mt-2">설문 데이터를 불러오는 중 문제가 발생했습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">설문 응답 관리</h1>
              <p className="mt-2 text-sm text-gray-600">
                모든 설문의 응답을 조회하고 관리할 수 있습니다.
              </p>
            </div>
          </div>

          <ResponseList surveys={surveys || []} />
        </div>
      </div>
    </div>
  )
} 