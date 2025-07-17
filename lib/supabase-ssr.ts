// import { createClient } from '@supabase/supabase-js'
// // CloudflareEnv 타입은 전역으로 사용 가능

// export function createSupabaseClient(env: CloudflareEnv) {
//     // Hyperdrive를 통해 Supabase PostgreSQL에 연결
//     //   const connectionString = env.HYPERDRIVE.connectionString
//     // Supabase 클라이언트 생성 (서버 사이드에서만 사용)

//     const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!
//     const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

//     const supabase = createClient(
//         supabaseUrl,
//         supabaseAnonKey,
//         {
//             db: {
//                 schema: 'public'
//             },
//             auth: {
//                 // persistSession: false // Cloudflare Workers에서는 세션을 저장하지 않음
//                 persistSession: true
//             },
//         }
//     )

//     return supabase
// } 


import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(env: CloudflareEnv, serviceRoleKey?: string) {
    const cookieStore = await cookies()

    return createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}