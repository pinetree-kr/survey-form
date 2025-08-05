import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SurveyFormPreview } from './components'
import { generateAccessToken, generateSecretKey } from '@/lib/access-token'

interface SurveyPreviewPageProps {
  params: Promise<{
    id: string
  }>
}

// Server Action
async function getSurvey(surveyId: string) {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .single()

  if (error || !data) {
    return null
  }

  // access_token_required가 true인데 access_secret_key가 없으면 자동 생성
  if (data.access_token_required && !data.access_secret_key) {
    const newSecretKey = generateSecretKey()
    
    const { error: updateError } = await supabase
      .from('surveys')
      .update({ access_secret_key: newSecretKey })
      .eq('id', surveyId)
    
    if (!updateError) {
      data.access_secret_key = newSecretKey
    }
  }

  return data
}

export default async function SurveyPreviewPage({ params }: SurveyPreviewPageProps) {
  const { id } = await params
  const survey = await getSurvey(id)

  if (!survey) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">설문 미리보기</h1>
              <p className="text-sm text-gray-500 mt-1">
                실제 응답자들이 보게 될 설문 화면을 미리 확인하세요
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/dashboard/forms/${survey.id}`}
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors text-sm"
              >
                상세보기로
              </Link>
              <Link
                href={`/dashboard/forms/${survey.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                편집하기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 미리보기 알림 */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-800">
                  <strong>미리보기 모드:</strong> 이 화면은 실제 응답자들이 보게 될 설문입니다. 
                  응답을 입력할 수 있지만 실제로 제출되지는 않습니다.
                  {survey.access_token_required && (
                    <span className="block mt-1">
                      <strong>🔐 액세스 토큰 필수 설문:</strong> 미리보기를 위해 임시 토큰이 생성되었습니다.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 설문 폼 */}
      <div className="py-8">
        <SurveyFormPreview 
          survey={survey}
          previewTokenMetadata={survey.access_token_required && survey.access_secret_key ? {
            token: generateAccessToken(survey.id, 'preview-user', survey.access_secret_key, { 
              preview: true, 
              user_id: 'preview-user',
              session_id: 'preview-session',
              source: 'admin-preview'
            })
          } : undefined}
        />
      </div>
    </div>
  )
} 