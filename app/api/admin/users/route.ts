import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from "next/server";
import { UsersResponse, UserUpdateRequest, ApiError } from '@/app/types'
import { Database } from '@/app/types'

// export async function GET(request: NextRequest) {
//     const { env } = await getCloudflareContext({ async: true });
//     const supabase = await createClient(env);

//     const { searchParams } = new URL(request.url)
//     const page = Number(searchParams.get('page') || 1)
//     const pageSize = Number(searchParams.get('pageSize') || 10)
//     const from = (page - 1) * pageSize
//     const to = from + pageSize - 1

//     const { data, error, count } = await supabase
//         .from('profiles')
//         .select('*', { count: 'exact' })
//         .order('created_at', { ascending: false })
//         .range(from, to)

//     if (error) {
//         const apiError: ApiError = { error: error.message, status: 500 }
//         return NextResponse.json(apiError, { status: 500 })
//     }

//     const response: UsersResponse = {
//         users: data || [],
//         totalPages: Math.ceil((count || 0) / pageSize),
//         currentPage: page,
//         totalCount: count || 0
//     }

//     return NextResponse.json(response)
// }

// export async function PATCH(request: NextRequest) {
//     const { env } = await getCloudflareContext({ async: true });
//     const supabase = await createClient(env);
//     const body: UserUpdateRequest = await request.json();

//     const { id, username, role } = body

//     const updates: Partial<Database['public']['Tables']['profiles']['Update']> = {
//         updated_at: new Date().toISOString()
//     }
//     if (username !== undefined) updates.username = username
//     if (role !== undefined) updates.role = role

//     const { data, error } = await supabase
//         .from('profiles')
//         .update(updates)
//         .eq('id', id)
//         .select()
//         .single()

//     if (error) {
//         const apiError: ApiError = { error: error.message, status: 500 }
//         return NextResponse.json(apiError, { status: 500 })
//     }

//     return NextResponse.json({ user: data })
// }

// export async function DELETE(request: NextRequest) {
//     const { env } = await getCloudflareContext({ async: true });
//     const supabase = await createClient(env);
//     const { searchParams } = new URL(request.url)
//     const id = searchParams.get('id')

//     if (!id) {
//         const apiError: ApiError = { error: 'id is required', status: 400 }
//         return NextResponse.json(apiError, { status: 400 })
//     }

//     const { error } = await supabase
//         .from('profiles')
//         .delete()
//         .eq('id', id)

//     if (error) {
//         const apiError: ApiError = { error: error.message, status: 500 }
//         return NextResponse.json(apiError, { status: 500 })
//     }

//     return NextResponse.json({ ok: true })
// }


export async function DELETE(request: NextRequest) {
    const { env } = await getCloudflareContext({ async: true });
    const supabase = await createClient(env, env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        const apiError: ApiError = { error: 'id is required', status: 400 }
        return NextResponse.json(apiError, { status: 400 })
    }


    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        const apiError: ApiError = { error: '인증이 필요합니다', status: 401 }
        return NextResponse.json(apiError, { status: 401 })
    }

    const { data: adminUser, error: adminError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (adminError || !adminUser || adminUser.role !== 'admin') {
        const apiError: ApiError = { error: '관리자 권한이 필요합니다', status: 403 }
        return NextResponse.json(apiError, { status: 403 })
    }

    const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        const apiError: ApiError = { error: '사용자 삭제에 실패했습니다', status: 500 }
        return NextResponse.json(apiError, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}