// import { createSupabaseClient } from '@/lib/supabase-cloudflare'

import { createClient } from '@/lib/supabase-ssr'
import { getCloudflareContext } from "@opennextjs/cloudflare"
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { env } = await getCloudflareContext({ async: true })
    // const supabase = createSupabaseClient(env)
    const supabase = await createClient(env)

    //   // 현재 사용자 확인 (보안을 위해 getUser() 사용)
    const { data: { user }, error } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/sign-in')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-900">
                                <Link href="/admin">
                                    관리자 대시보드
                                </Link>
                            </h1>
                        </div>
                        <div className="flex items-center">
                            <Link
                                href="/admin/profile"
                                className="text-sm text-blue-600 hover:text-blue-800 mr-4"
                            >
                                {user?.email}
                            </Link>
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
            {/* <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"> */}
            <main className="">
                {children}
            </main>
        </div>
    )
} 