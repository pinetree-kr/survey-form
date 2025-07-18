import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface SurveyDetailPageProps {
  params: {
    id: string
  }
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const getSurvey = async (surveyId: string) => {
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
    
    return data
  }

  const survey = await getSurvey(params.id)

  if (!survey) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설문 상세</h1>
          <p className="mt-1 text-sm text-gray-500">
            설문조사 정보를 확인하세요.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/admin/forms/${survey.id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            수정
          </Link>
          <Link
            href="/admin/forms"
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            ← 설문 목록으로
          </Link>
        </div>
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
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  survey.is_active
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
                {formatDate(survey.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">문항 목록</h2>
        </div>
        <div className="px-6 py-4">
          {survey.questions && survey.questions.length > 0 ? (
            <div className="space-y-4">
              {survey.questions.map((question: any, index: number) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      문항 {index + 1}: {question.title}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      question.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {question.required ? '필수' : '선택'}
                    </span>
                  </div>
                  {question.description && (
                    <p className="text-gray-600 mb-3">{question.description}</p>
                  )}
                  <div className="text-sm text-gray-500 mb-2">
                    유형: {question.question_type === 'single_choice' ? '단일 선택' : 
                           question.question_type === 'multiple_choice' ? '다중 선택' :
                           question.question_type === 'text' ? '텍스트' : question.question_type}
                  </div>
                  {question.options && question.options.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">옵션:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {question.options.map((option: any, optIndex: number) => (
                          <li key={optIndex} className="text-sm text-gray-600">
                            {option.label} ({option.value})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              문항이 없습니다.
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
  )
} 