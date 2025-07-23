// import { createSupabaseClient } from '@/lib/supabase-cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true })
    // const supabase = createSupabaseClient(env)
    const supabase = await createClient(env)

    // 로그아웃 처리
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  } catch (error) {
    return NextResponse.json(
      { error: '로그아웃 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 