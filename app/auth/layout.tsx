// import { createSupabaseClient } from '@/lib/supabase-cloudflare'

import { createClient } from '@/lib/supabase-ssr'
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { redirect } from 'next/navigation'

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { env } = await getCloudflareContext({ async: true })
    // const supabase = createSupabaseClient(env)

    const supabase = await createClient(env)

    //   // 현재 세션 확인
    const { data, error } = await supabase.auth.getSession()

    // // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    if (data?.session) {
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