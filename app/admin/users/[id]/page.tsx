import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect } from 'next/navigation'
import UserDetailForm from './components/UserDetailForm'
import { notFound } from 'next/navigation'

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const getCurrentUser = async () => {
    "use server"
    
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      redirect('/auth/sign-in')
    }
    
    return user
  }

  const checkAdminRole = async () => {
    "use server"
    
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect('/auth/sign-in')
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (error || !profile || profile.role !== 'admin') {
      redirect('/admin')
    }
    
    return profile
  }

  const getUserProfile = async (userId: string) => {
    "use server"
    
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)
    
    // 대상 사용자 프로필 조회
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      return null
    }
    
    return profile
  }

  const updateUserProfile = async (formData: FormData) => {
    "use server"

    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

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

    const user_id = formData.get('user_id') as string
    // const username = formData.get('username') as string
    const display_name = formData.get('display_name') as string
    const role = formData.get('role') as string

    if (!user_id) {
      throw new Error('필수 정보가 누락되었습니다')
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: display_name ?? undefined,
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single()

    if (error) {
      throw new Error('사용자 정보 업데이트에 실패했습니다')
    }

    return data
  }

  const currentUser = await getCurrentUser()
  const adminProfile = await checkAdminRole()
  const userProfile = await getUserProfile(params.id)

  if (!userProfile) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">사용자 정보</h1>
                <p className="text-sm text-gray-600 mt-1">
                  사용자 정보를 조회하고 수정할 수 있습니다.
                </p>
              </div>
              <a
                href="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← 사용자 목록으로
              </a>
            </div>
          </div>

          <div className="px-6 py-6">
            <UserDetailForm
              profile={userProfile}
              updateProfile={updateUserProfile}
              isOwnProfile={currentUser.id === userProfile.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 