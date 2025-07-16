// import { createSupabaseClient } from '@/lib/supabase-cloudflare'

import { createClient } from '@/lib/supabase-ssr'
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { env } = await getCloudflareContext({ async: true })
    // const supabase = createSupabaseClient(env)
    const supabase = await createClient(env)

    //   // 현재 세션 확인
    const { data: { session }, error } = await supabase.auth.getSession()

    if (!session) {
        redirect('/auth/sign-in')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">
                                관리자 대시보드
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-4">
                                {session?.user?.email}
                            </span>
                            <form action="/admin/logout" method="post">
                                <button
                                    type="submit"
                                    className="text-sm text-red-600 hover:text-red-800"
                                >
                                    로그아웃
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    )
} 