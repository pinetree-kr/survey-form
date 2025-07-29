import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from "next/server";
import {
    determineRespondentIdentifier,
    validateSurvey,
    checkAllowedList,
    findExistingResponse,
    validateEmail
} from './utils';

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
            .select('id, allow_anonymous, is_active, url_param_required, email_required, url_param_name, allow_duplicate_responses, allow_response_view, allow_response_modification, opens_at, closes_at, allowed_list')
            .eq('id', surveyId)
            .single();

        if (surveyError || !survey) {
            return NextResponse.json({ error: '설문을 찾을 수 없습니다.' }, { status: 404 });
        }


        // 설문 유효성 검증
        const surveyValidation = validateSurvey(survey);
        if (!surveyValidation.valid) {
            return NextResponse.json({ error: surveyValidation.error }, { status: 400 });
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
            respondent?: string;
            email?: string;
        };
        const { answers, respondent, email } = body;

        if (!answers) {
            return NextResponse.json({ error: '응답 데이터가 필요합니다.' }, { status: 400 });
        }

        // IP 주소와 User-Agent 추출
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';



        // 이메일이 제공된 경우 형식 검증
        if (email && !validateEmail(email)) {
            return NextResponse.json({ error: '유효한 이메일 주소를 입력해주세요.' }, { status: 400 });
        }

        // 응답자 ID 결정 로직
        const identifierResult = determineRespondentIdentifier(respondent, email, survey.allow_anonymous);
        if (!identifierResult.isValid) {
            return NextResponse.json({ error: '응답자 식별이 필요합니다.' }, { status: 400 });
        }

        const { finalRespondent, finalEmail, finalIsAnonymous } = identifierResult;

        // 화이트리스트 확인
        const identifier = finalRespondent || finalEmail;
        if (!checkAllowedList(survey.allowed_list, identifier)) {
            return NextResponse.json({ error: '허용되지 않은 응답자입니다.' }, { status: 403 });
        }

        // 기존 응답 확인
        const existingResponse = await findExistingResponse(supabase, surveyId, finalRespondent, finalEmail);

        // 중복 응답 확인 - 수정 허용 시에는 기존 응답이 있어도 허용
        if (!survey.allow_duplicate_responses && !survey.allow_response_modification && existingResponse) {
            return NextResponse.json({ error: '이미 응답한 사용자입니다.' }, { status: 400 });
        }


        // 응답 데이터 생성
        const responseData = {
            survey_id: surveyId,
            respondent: finalRespondent,
            email: finalEmail,
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

        // 응답 목록 조회 (덮어쓰인 응답 제외)
        const { data: responses, error: responsesError } = await supabase
            .from('survey_responses')
            .select('*')
            .eq('survey_id', surveyId)
            .eq('is_overwritten', false)
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