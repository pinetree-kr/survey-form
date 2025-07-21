import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;
        const { env } = await getCloudflareContext({ async: true });
        const supabase = await createClient(env);

        // URL 파라미터에서 이메일 가져오기
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: '이메일 주소가 필요합니다.' }, { status: 400 });
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: '유효한 이메일 주소를 입력해주세요.' }, { status: 400 });
        }

        // 설문 존재 여부 및 이메일 조회 허용 여부 확인
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('id, allow_email_response_view')
            .eq('id', surveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: '설문을 찾을 수 없습니다.' }, { status: 404 });
        }

        if (!survey.allow_email_response_view) {
            return NextResponse.json({ error: '이 설문은 이메일로 응답 조회를 허용하지 않습니다.' }, { status: 403 });
        }

        // 해당 이메일로 제출된 응답 조회
        const { data: responses, error: responsesError } = await supabase
            .from('survey_responses')
            .select('*')
            .eq('survey_id', surveyId)
            .eq('respondent_id', email)
            .order('created_at', { ascending: false });

        if (responsesError) {
            console.error('응답 조회 오류:', responsesError);
            return NextResponse.json({ error: '응답 조회에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            responses: responses || [],
            count: responses?.length || 0
        });

    } catch (error) {
        console.error('이메일 응답 조회 오류:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
} 