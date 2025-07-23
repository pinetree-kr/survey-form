import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from 'next/server'
import { SystemSetting } from '@/app/types/system-settings'

// GET: 모든 시스템 설정 조회
export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    // 현재 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    // 모든 시스템 설정 조회
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
      .order('key', { ascending: true })

    if (error) {
      return NextResponse.json({ error: '설정을 조회할 수 없습니다' }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT: 시스템 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    // 현재 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다' }, { status: 403 })
    }

    const body = await request.json() as { key: string; value: any }
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: '설정 키가 필요합니다' }, { status: 400 })
    }

    // 설정 업데이트
    const { data, error } = await supabase
      .from('system_settings')
      .update({ value })
      .eq('key', key)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '설정을 업데이트할 수 없습니다' }, { status: 500 })
    }

    return NextResponse.json({ setting: data })
  } catch (error) {
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
} 