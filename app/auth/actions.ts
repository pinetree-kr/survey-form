import { createClient } from "@/lib/supabase-ssr"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { redirect } from "next/navigation"

export const handleSignUp = async (email: string, password: string) => {
    'use server'

    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: { message: error.message } }
    }

    // 회원가입 성공 시 성공 메시지와 함께 응답
    return { success: true, message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.' }
}

export const handleLogin = async (email: string, password: string) => {
    'use server'

    const { env } = await getCloudflareContext({ async: true })

    // const supabase = createSupabaseClient(env)
    const supabase = await createClient(env)

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error }
    }

    return redirect('/admin')
}



export const verifyAccessToken = async (redirect_url: string) => {
    'use server'

    const { env } = await getCloudflareContext({ async: true })
    // const supabase = createSupabaseClient(env)

    const supabase = await createClient(env)
    //   // 현재 사용자 확인 (보안을 위해 getUser() 사용)
    const { data: { user }, error } = await supabase.auth.getUser()
    if (user && !error) {
        // // 로그인된 경우 관리자 페이지로 리다이렉트
        return redirect(redirect_url)
    }
}