import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { FormEditor } from '../../components'
import { TSurvey } from '@/app/components'

interface EditSurveyPageProps {
  params: Promise<{
    id: string
  }>
}

// Server Actions
async function getSurvey(surveyId: string) {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  const { data, error } = await supabase
    .from('surveys')
    .select(`
      id,
      title,
      description,
      questions,
      is_active,
      allow_anonymous,
      allow_url_param,
      email_required,
      url_param_name,
      allow_email_response_view,
      allow_duplicate_responses,
      opens_at,
      closes_at,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq('id', surveyId)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function handleUpdate(formData: TSurvey, surveyId?: string) {
  "use server"
  console.log({ formData, surveyId })
  if (!formData.title || !surveyId) {
    throw new Error('필수 정보가 누락되었습니다')
  }

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  // 현재 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증이 필요합니다')
  }

  // 관리자 권한 확인
  const { data: adminUser, error: adminError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminError || !adminUser || adminUser.role !== 'admin') {
    const survey = await getSurvey(surveyId)
    if (!survey || survey.created_by !== user.id) {
      throw new Error('관리자 권한 또는 설문 작성자 권한이 필요합니다')
    }
  }

  const { data, error } = await supabase
    .from('surveys')
    .update({
      title: formData.title,
      description: formData.description || null,
      questions: formData.questions || [],
      allow_anonymous: formData.allow_anonymous || false,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
      allow_url_param: formData.allow_url_param || false,
      email_required: formData.email_required || false,
      url_param_name: formData.url_param_name || 'id',
      allow_email_response_view: formData.allow_email_response_view || false,
      allow_duplicate_responses: formData.allow_duplicate_responses || true,
      opens_at: formData.opens_at || null,
      closes_at: formData.closes_at || null,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', surveyId)
    .select()
    .single()

  if (error) {
    throw new Error('설문 수정에 실패했습니다')
  }

  return data
}

export default async function EditSurveyPage({ params }: EditSurveyPageProps) {
  const { id } = await params

  const survey = await getSurvey(id)

  if (!survey) {
    notFound()
  }

  return (
    <div className="">
      <div className="py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-top">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">설문 수정</h1>
            <p className="mt-1 text-sm text-gray-500">
              설문조사를 수정하세요.
            </p>
          </div>
          <Link
            href="/admin/forms"
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            ← 설문 목록으로
          </Link>
        </div>
      </div>

      <FormEditor
        onSave={handleUpdate}
        data={survey}
      />
    </div>
  )
} 