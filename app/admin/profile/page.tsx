import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect } from 'next/navigation'
import ProfileForm from './components/ProfileForm'

export default async function ProfilePage() {
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

  const getProfile = async () => {
    "use server"
    
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect('/auth/sign-in')
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('프로필을 불러오는데 실패했습니다:', error)
      return null
    }
    
    return profile
  }

  const updateProfile = async (formData: FormData) => {
    "use server"
    
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('인증이 필요합니다')
    }
    
    const username = formData.get('username') as string
    const displayName = formData.get('displayName') as string
    
    if (!username) {
      throw new Error('사용자명은 필수입니다')
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        username,
        display_name: displayName || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (error) {
      throw new Error('프로필 업데이트에 실패했습니다')
    }
    
    return data
  }

  const currentUser = await getCurrentUser()
  const profile = await getProfile()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">프로필을 불러올 수 없습니다</h1>
          <p className="text-gray-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">프로필 수정</h1>
            <p className="text-sm text-gray-600 mt-1">
              본인의 정보를 수정할 수 있습니다.
            </p>
          </div>
          
          <div className="px-6 py-6">
            <ProfileForm 
              profile={profile} 
              updateProfile={updateProfile}
            />
          </div>
        </div>
      </div>
    </div>
  )
} 