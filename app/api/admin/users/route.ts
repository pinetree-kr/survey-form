import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from "next/server";
import { UsersResponse, UserUpdateRequest, ApiError } from '@/app/types'
import { Database } from '@/app/types'

export async function GET(request: NextRequest) {
    const { env } = await getCloudflareContext({ async: true });
    const supabase = await createClient(env);

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page') || 1)
    const pageSize = Number(searchParams.get('pageSize') || 10)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        const apiError: ApiError = { error: error.message, status: 500 }
        return NextResponse.json(apiError, { status: 500 })
    }

    const response: UsersResponse = {
        users: data || [],
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        totalCount: count || 0
    }

    return NextResponse.json(response)
}

export async function PATCH(request: NextRequest) {
    const { env } = await getCloudflareContext({ async: true });
    const supabase = await createClient(env);
    const body: UserUpdateRequest = await request.json();

    const { id, username, role } = body

    const updates: Partial<Database['public']['Tables']['profiles']['Update']> = {
        updated_at: new Date().toISOString()
    }
    if (username !== undefined) updates.username = username
    if (role !== undefined) updates.role = role

    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        const apiError: ApiError = { error: error.message, status: 500 }
        return NextResponse.json(apiError, { status: 500 })
    }

    return NextResponse.json({ user: data })
}

export async function DELETE(request: NextRequest) {
    const { env } = await getCloudflareContext({ async: true });
    const supabase = await createClient(env);
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
        const apiError: ApiError = { error: 'id is required', status: 400 }
        return NextResponse.json(apiError, { status: 400 })
    }

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

    if (error) {
        const apiError: ApiError = { error: error.message, status: 500 }
        return NextResponse.json(apiError, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}