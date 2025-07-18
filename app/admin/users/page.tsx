import { getCloudflareContext } from '@opennextjs/cloudflare'
import { UserTable } from './components'
import { createClient } from '@/lib/supabase-ssr'
import { UserRole } from '@/app/types'
import CreateUserModal from './components/CreateUserModal'
import { redirect } from 'next/navigation'

// Server Actions
async function getCurrentUser() {
  "use server"
  
  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/auth/sign-in')
  }
  
  return user
}

async function checkAdminRole() {
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

async function getUsers() {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  const { data, error, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('사용자 목록을 불러오는데 실패했습니다:', error)
    return []
  }

  return data
}

async function updateUserRole(user_id: string, newRole: UserRole) {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env)

  if (!user_id || !newRole) {
    throw new Error('user_id와 newRole이 필요합니다')
  }

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

  // 사용자 권한 업데이트
  const { data, error } = await supabase
    .from('profiles')
    .update({
      role: newRole,
      updated_at: new Date().toISOString()
    })
    .eq('id', user_id)
    .select()
    .single()

  if (error) {
    throw new Error('사용자 권한 업데이트에 실패했습니다')
  }

  return data
}

async function deleteUser(user_id: string) {
  "use server"

  const { env } = await getCloudflareContext({ async: true })

  const supabase = await createClient(env, env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

  if (!user_id) {
    // 400
    throw new Error('user_id is required')
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    // 401
    throw new Error('인증이 필요합니다')
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminError || !adminUser || adminUser.role !== 'admin') {
    // 403
    throw new Error('관리자 권한이 필요합니다')
  }

  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    // 500
    throw new Error('사용자 삭제에 실패했습니다')
  }

  return true
}

async function createUser(formData: FormData) {
  "use server"

  const { env } = await getCloudflareContext({ async: true })
  const supabase = await createClient(env, env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)

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

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  // const username = formData.get('username') as string
  const displayName = formData.get('displayName') as string
  const role = formData.get('role') as UserRole

  if (!email || !password || !role) {
    throw new Error('필수 정보가 누락되었습니다')
  }

  if (password.length < 6) {
    throw new Error('비밀번호는 최소 6자 이상이어야 합니다')
  }

  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || null
      }
    }),
    headers: {
      'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    throw new Error('사용자 생성에 실패했습니다')
  }

  return true
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser()
  const adminProfile = await checkAdminRole()
  const users = await getUsers()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">사용자 관리</h1>
      <UserTable
        users={users}
        deleteUser={deleteUser}
        updateUserRole={updateUserRole}
        currentUserId={currentUser?.id || null}
        createUser={createUser}
      />
    </div>
  )
}