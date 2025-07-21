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
            .select('id, allow_anonymous, is_active, allow_url_param, email_required, url_param_name, allow_duplicate_responses')
            .eq('id', surveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: '설문을 찾을 수 없습니다.' }, { status: 404 });
        }

        if (!survey.is_active) {
            return NextResponse.json({ error: '비활성화된 설문입니다.' }, { status: 400 });
        }

        // 현재 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        // 익명 응답인지 확인
        const isAnonymous = !user || authError;
        
        if (isAnonymous && !survey.allow_anonymous) {
            return NextResponse.json({ error: '이 설문은 익명 응답을 허용하지 않습니다.' }, { status: 403 });
        }

        // 요청 본문 파싱
        const body = await request.json() as { 
            answers?: Record<string, any>;
            respondent_id?: string;
        };
        const { answers, respondent_id } = body;

        if (!answers) {
            return NextResponse.json({ error: '응답 데이터가 필요합니다.' }, { status: 400 });
        }

        // IP 주소와 User-Agent 추출
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // 응답자 ID 결정
        let finalRespondentId: string | null = null;
        let finalIsAnonymous = false;

        // 이메일 입력이 필수인 경우
        if (survey.email_required) {
            if (!respondent_id) {
                return NextResponse.json({ error: '이메일 주소가 필요합니다.' }, { status: 400 });
            }
            // 간단한 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(respondent_id)) {
                return NextResponse.json({ error: '유효한 이메일 주소를 입력해주세요.' }, { status: 400 });
            }
            finalRespondentId = respondent_id;
            finalIsAnonymous = false;
        }
        // URL 파라미터가 허용된 경우
        else if (survey.allow_url_param && respondent_id) {
            finalRespondentId = respondent_id;
            finalIsAnonymous = false;
        }
        // 익명 응답이 허용된 경우
        else if (survey.allow_anonymous) {
            finalRespondentId = null;
            finalIsAnonymous = true;
        }
        // 어떤 방법도 허용되지 않은 경우
        else {
            return NextResponse.json({ error: '응답 방법이 설정되지 않았습니다.' }, { status: 400 });
        }

        // 중복 응답 확인
        if (!survey.allow_duplicate_responses && finalRespondentId) {
            const { data: existingResponse, error: checkError } = await supabase
                .from('survey_responses')
                .select('id')
                .eq('survey_id', surveyId)
                .eq('respondent_id', finalRespondentId)
                .single();

            if (existingResponse) {
                return NextResponse.json({ error: '이미 응답한 사용자입니다.' }, { status: 400 });
            }
        }

        // 응답 데이터 생성
        const responseData = {
            survey_id: surveyId,
            respondent_id: finalRespondentId,
            is_anonymous: finalIsAnonymous,
            answers: answers,
            ip_address: ipAddress,
            user_agent: userAgent,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString() // 완료된 응답으로 간주
        };

        // 응답 저장
        const { data: response, error: insertError } = await supabase
            .from('survey_responses')
            .insert(responseData)
            .select()
            .single();

        if (insertError) {
            console.error('응답 저장 오류:', insertError);
            return NextResponse.json({ error: '응답 저장에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            response_id: response.id,
            is_anonymous: isAnonymous
        });

    } catch (error) {
        console.error('설문 응답 처리 오류:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: surveyId } = await params;
        const { env } = await getCloudflareContext({ async: true });
        const supabase = await createClient(env);

        // 현재 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        // 사용자 역할 확인
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !userProfile) {
            return NextResponse.json({ error: '사용자 정보를 불러올 수 없습니다.' }, { status: 500 });
        }

        // 설문 작성자 또는 관리자인지 확인
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('created_by')
            .eq('id', surveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: '설문을 찾을 수 없습니다.' }, { status: 404 });
        }

        const isCreator = survey.created_by === user.id;
        const isAdmin = userProfile.role === 'admin';

        if (!isCreator && !isAdmin) {
            return NextResponse.json({ error: '응답 조회 권한이 없습니다.' }, { status: 403 });
        }

        // 응답 목록 조회
        const { data: responses, error: responsesError } = await supabase
            .from('survey_responses')
            .select('*')
            .eq('survey_id', surveyId)
            .order('created_at', { ascending: false });

        if (responsesError) {
            console.error('응답 조회 오류:', responsesError);
            return NextResponse.json({ error: '응답 조회에 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json({ responses });

    } catch (error) {
        console.error('설문 응답 조회 오류:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
} 