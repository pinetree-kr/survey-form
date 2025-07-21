import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect } from 'next/navigation'
import { SystemSettingsPage } from './components/SystemSettingsPage'
import { SystemSetting } from '@/app/types/system-settings'

interface SettingsPageProps {
  params: Promise<{}>
}

// Server Actions
async function getSettings() {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  if (error) {
    return null
  }

  return data as SystemSetting[]
}

async function checkAdminPermission() {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  // 현재 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return false
  }

  // 관리자 권한 확인
  const { data: adminUser, error: adminError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminError || !adminUser || adminUser.role !== 'admin') {
    return false
  }

  return true
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const isAdmin = await checkAdminPermission()
  
  if (!isAdmin) {
    redirect('/admin?error=access_denied')
  }

  const settings = await getSettings()

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
            <p className="mt-2 text-gray-600">설정을 불러올 수 없습니다.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            시스템 전반의 설정을 관리합니다.
          </p>
        </div>
        
        <SystemSettingsPage initialSettings={settings} />
      </div>
    </div>
  )
} 