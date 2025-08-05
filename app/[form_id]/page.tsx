import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr';
import { SurveyForm, TSurvey } from "../components";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { validateAccessToken, validateAndParseJWT, generateSecretKey } from '@/lib/access-token';

export default async function FormViewPage({
    params,
    searchParams
}: {
    params: Promise<{ form_id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { form_id } = await params;
    const { env } = await getCloudflareContext({ async: true });
    const supabase = await createClient(env);

    // x-redirect-url 헤더 확인
    const headersList = await headers();
    const redirectUrl = headersList.get('x-redirect-url');

    // 설문 데이터 조회
    const { data: survey, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', form_id)
        .eq('is_active', true)
        .single();

    if (error || !survey) {
        notFound();
    }

    // access_token_required가 true인데 access_secret_key가 없으면 자동 생성
    if (survey.access_token_required && !survey.access_secret_key) {
        const newSecretKey = generateSecretKey();

        const { error: updateError } = await supabase
            .from('surveys')
            .update({ access_secret_key: newSecretKey })
            .eq('id', survey.id);

        if (!updateError) {
            survey.access_secret_key = newSecretKey;
        }
    }

    // URL 파라미터에서 액세스 토큰 및 응답자 ID 확인
    const paramsObj = await searchParams;
    const accessToken = Array.isArray(paramsObj.token)
        ? paramsObj.token?.[0]
        : paramsObj.token;


    // 액세스 토큰이 필수인 경우 검증
    if (survey.access_token_required && survey.access_secret_key) {
        if (!accessToken || typeof accessToken !== 'string') {
            throw new Error('액세스 토큰이 필요합니다.')
        }

        // 토큰 검증
        if (!validateAccessToken(accessToken, survey.access_secret_key)) {
            throw new Error('유효하지 않은 액세스 토큰입니다.')
        }
    }

    // respondent ID와 metadata 추출 (JWT 토큰에서만)
    let urlRespondentId: string | null = null;
    let tokenMetadata: any = null;

    if (accessToken && survey.access_token_required && survey.access_secret_key) {
        // JWT 토큰 파싱하여 응답자 ID와 metadata 추출
        const tokenPayload = validateAndParseJWT(accessToken, survey.access_secret_key);
        if (tokenPayload) {
            urlRespondentId = tokenPayload.aud;
            tokenMetadata = tokenPayload.metadata;
        }
    }

    // 중복 응답 확인 (액세스 토큰이나 다른 식별자가 있고 중복이 허용되지 않는 경우)
    if (urlRespondentId && typeof urlRespondentId === 'string' && !survey.allow_duplicate_responses) {
        const { data: existingResponse, error: checkError } = await supabase
            .from('survey_responses')
            .select('id')
            .eq('survey_id', survey.id)
            .eq('respondent', urlRespondentId)
            .single();

        if (existingResponse) {
            throw new Error('이미 응답한 사용자입니다.')
        }
    }

    // 허용된 응답자 목록 확인
    if (survey.allowed_list && survey.allowed_list.length > 0) {
        if (!urlRespondentId || !survey.allowed_list.includes(urlRespondentId)) {
            throw new Error('허용된 응답자가 아닙니다.')
        }
    }

    // 설문 데이터를 TSurvey 타입으로 변환
    const surveyData: TSurvey = {
        id: survey.id,
        title: survey.title,
        description: survey.description || '',
        is_active: survey.is_active,
        allow_anonymous: survey.allow_anonymous,
        access_token_required: survey.access_token_required,
        access_secret_key: survey.access_secret_key,
        email_required: survey.email_required,
        allow_response_view: survey.allow_response_view,
        allow_response_modification: survey.allow_response_modification,
        allow_duplicate_responses: survey.allow_duplicate_responses,
        allowed_list: survey.allowed_list,
        webhook_url: survey.webhook_url,
        opens_at: survey.opens_at,
        closes_at: survey.closes_at,
        questions: survey.questions || [],
        created_at: survey.created_at,
        updated_at: survey.updated_at,
        created_by: survey.created_by,
        updated_by: survey.updated_by,
    };
    console.log({ surveyData, tokenMetadata })
    return (
        <div>
            <SurveyForm
                survey={surveyData}
                redirectUrl={redirectUrl}
                tokenMetadata={tokenMetadata}
            />
        </div>
    )
}