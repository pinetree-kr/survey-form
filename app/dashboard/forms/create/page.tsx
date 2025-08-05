import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FormEditor } from '../components'
import { TSurvey } from '@/app/components'

// Server Action
async function handleCreate(formData: TSurvey) {
  "use server"


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

  // access_token_required 상태에 따른 secret_key 처리
  let secretKey: string | null = formData.access_secret_key || null;
  if (formData.access_token_required && !secretKey) {
    // access_token_required가 true인데 secret_key가 없으면 자동 생성
    const { generateSecretKey } = await import('@/lib/access-token');
    secretKey = generateSecretKey();
  }
  // access_token_required가 false여도 기존 secret_key는 유지

  const { data, error } = await supabase
    .from('surveys')
    .insert({
      title: formData.title,
      description: formData.description || null,
      questions: formData.questions || [],
      is_active: formData.is_active ?? true,
      allow_anonymous: formData.allow_anonymous ?? true,
      access_token_required: formData.access_token_required ?? false,
      access_secret_key: secretKey,
      email_required: formData.email_required ?? false,
      allow_response_view: formData.allow_response_view ?? false,
      allow_response_modification: formData.allow_response_modification ?? false,
      allow_duplicate_responses: formData.allow_duplicate_responses ?? true,
      allowed_list: formData.allowed_list || null,
      opens_at: formData.opens_at || null,
      closes_at: formData.closes_at || null,
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
                            href="/dashboard/forms"
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