import { LoginForm } from './components'
import { getCloudflareContext } from '@opennextjs/cloudflare'
// import { createSupabaseClient } from '@/lib/supabase-cloudflare'

import { createClient } from '@/lib/supabase-ssr'
import { redirect } from 'next/navigation'

export default async function AuthLoginPage() {

  const handleLogin = async (email: string, password: string) => {
    'use server'

    const { env } = await getCloudflareContext({ async: true })

    // const supabase = createSupabaseClient(env)
    const supabase = await createClient(env)

    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error }
    }

    redirect('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자 계정으로 로그인하세요
          </p>
        </div>
        <LoginForm action={handleLogin} />
      </div>
    </div>
  )
} 