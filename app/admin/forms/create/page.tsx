import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FormEditor } from '../components'
import { TSurvey } from '@/app/components'

// Server Action
async function handleCreate(formData: TSurvey) {
  "use server"
  console.log({ formData })

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  // 현재 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('인증이 필요합니다')
  }

  if (!formData.title) {
    throw new Error('설문 제목은 필수입니다')
  }

  const { data, error } = await supabase
    .from('surveys')
    .insert({
      title: formData.title,
      description: formData.description || null,
      questions: formData.questions || [],
      is_active: true,
      created_by: user.id,
      // created_at: new Date().toISOString(),
      // updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    throw new Error('설문 생성에 실패했습니다')
  }

  return data
}

export default async function CreateSurveyPage() {

  return (
    <div className="">
      <div className="py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-top">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">새 설문 생성</h1>
            <p className="mt-1 text-sm text-gray-500">
              새로운 설문조사를 생성하세요.
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

      <FormEditor onSave={handleCreate} />
    </div>
  )
} 