import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { FormEditor } from '../../components'
import { TSurvey } from '@/app/components'

interface EditSurveyPageProps {
  params: {
    id: string
  }
}

export default async function EditSurveyPage({ params }: EditSurveyPageProps) {
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

  const handleUpdate = async (formData: TSurvey, surveyId?: string) => {
    "use server"

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
      throw new Error('관리자 권한이 필요합니다')
    }


    if (!formData.title || !surveyId) {
      throw new Error('필수 정보가 누락되었습니다')
    }

    const { data, error } = await supabase
      .from('surveys')
      .update({
        title: formData.title,
        description: formData.description || null,
        questions: formData.questions || [],
        // updated_at: new Date().toISOString()
      })
      .eq('id', surveyId)
      .select()
      .single()

    if (error) {
      throw new Error('설문 수정에 실패했습니다')
    }

    return data
  }

  const survey = await getSurvey(params.id)

  if (!survey) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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

      <FormEditor
        onSave={handleUpdate}
        data={survey}
      />
    </div>
  )
} 