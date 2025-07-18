// import { createSupabaseClient } from '@/lib/supabase-cloudflare'

import { createClient } from '@/lib/supabase-ssr'
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { env } = await getCloudflareContext({ async: true })
    // const supabase = createSupabaseClient(env)

    const supabase = await createClient(env)

    //   // 현재 사용자 확인 (보안을 위해 getUser() 사용)
    const { data: { user }, error } = await supabase.auth.getUser()
    // // 로그인된 경우 관리자 페이지로 리다이렉트
    if (user && !error) {
        redirect('/admin')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
} 