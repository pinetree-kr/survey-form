import { getCloudflareContext } from "@opennextjs/cloudflare";
// import { createSupabaseClient } from "../../../lib/supabase-cloudflare";
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    // const supabase = createSupabaseClient(env);
    const supabase = await createClient(env);

    // 설문조사 목록 조회
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ surveys: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    // const supabase = createSupabaseClient(env);
    const supabase = await createClient(env);
    const body = await request.json();

    // 새 설문조사 생성
    const { data, error } = await supabase
      .from('surveys')
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ survey: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 