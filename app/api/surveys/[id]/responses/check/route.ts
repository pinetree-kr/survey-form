import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;
        const { env } = await getCloudflareContext({ async: true });
        const supabase = await createClient(env);

        // 설문 존재 여부 및 설정 확인
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('id, url_param_name, allow_duplicate_responses, allow_anonymous, email_required, allowed_list, allow_response_view, allow_response_modification')
            .eq('id', surveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: '설문을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 중복 응답이 허용되는 경우 항상 false 반환
        if (survey.allow_duplicate_responses) {
            return NextResponse.json({ isDuplicate: false });
        }

        // 요청 본문 파싱
        const body = await request.json() as {
            respondent?: string;
            email?: string;
        };
        const { respondent, email } = body;

        // 응답자 식별자가 없으면 중복 확인할 수 없음
        if (!respondent && !email) {
            return NextResponse.json({ isDuplicate: false });
        }

        // 화이트리스트 확인
        if (survey.allowed_list && Array.isArray(survey.allowed_list)) {
            const identifier = respondent || email;
            if (identifier && !survey.allowed_list.includes(identifier)) {
                return NextResponse.json({
                    isDuplicate: false,
                    isNotAllowed: true,
                    message: '허용되지 않은 응답자입니다.'
                });
            }
        }

        // URL 파라미터에서 응답자 ID 가져오기
        const { searchParams } = new URL(request.url);
        const urlParamName = survey.url_param_name || 'rid';
        const urlRespondentId = searchParams.get(urlParamName);

        // 중복 응답 확인을 위한 조건 구성
        const query = supabase
            .from('survey_responses')
            .select('id, answers, completed_at, respondent, email')
            .eq('survey_id', surveyId);

        // 확인할 조건들
        const conditions: string[] = [];

        if (urlRespondentId) {
            conditions.push(`respondent.eq.${urlRespondentId}`);
        }

        if (respondent) {
            conditions.push(`respondent.eq.${respondent}`);
        }

        if (email) {
            conditions.push(`email.eq.${email}`);
        }

        if (conditions.length === 0) {
            return NextResponse.json({ isDuplicate: false });
        }

        // OR 조건으로 중복 응답 확인
        const { data: existingResponse, error: checkError } = await query
            .or(conditions.join(','))
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 결과가 없을 때의 에러코드
            console.error('중복 확인 오류:', checkError);
            return NextResponse.json({ error: '중복 확인 중 오류가 발생했습니다.' }, { status: 500 });
        }

        const isDuplicate = !!existingResponse;

        return NextResponse.json({
            isDuplicate,
            existingResponse: isDuplicate ? existingResponse : null,
            message: isDuplicate
                ? '이미 응답한 사용자입니다.'
                : '응답 가능합니다.'
        });

    } catch (error) {
        console.error('중복 확인 API 오류:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}