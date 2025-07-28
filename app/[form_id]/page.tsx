import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr';
import { SurveyForm, TSurvey } from "../components";
import { notFound } from "next/navigation";

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

    // URL 파라미터에서 응답자 ID 확인
    const paramsObj = await searchParams;
    const paramName = survey.url_param_name || 'rid';
    const urlRespondentId = Array.isArray(paramsObj[paramName]) 
        ? paramsObj[paramName]?.[0] 
        : paramsObj[paramName];

    // URL 파라미터가 있고 중복이 허용되지 않는 경우 중복 확인
    if (urlRespondentId && typeof urlRespondentId === 'string' && !survey.allow_duplicate_responses) {
        const { data: existingResponse, error: checkError } = await supabase
            .from('survey_responses')
            .select('id')
            .eq('survey_id', survey.id)
            .eq('respondent_id', urlRespondentId)
            .single();

        if (existingResponse) {
            // 중복 응답이 있는 경우 에러 페이지로 리다이렉트하거나 메시지 표시
            return new Response(
                JSON.stringify({ error: '이미 응답한 사용자입니다.' }),
                { 
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    }

    // 설문 데이터를 TSurvey 타입으로 변환
    const surveyData: TSurvey = {
        id: survey.id,
        title: survey.title,
        description: survey.description || '',
        is_active: survey.is_active,
        allow_anonymous: survey.allow_anonymous,
        allow_url_param: survey.allow_url_param,
        email_required: survey.email_required,
        url_param_name: survey.url_param_name,
        allow_email_response_view: survey.allow_email_response_view,
        allow_duplicate_responses: survey.allow_duplicate_responses,
        questions: survey.questions || [],
        created_at: survey.created_at,
        updated_at: survey.updated_at,
        created_by: survey.created_by,
        updated_by: survey.updated_by
    };

    return (
        <div>
            <SurveyForm survey={surveyData} />
        </div>
    )
}