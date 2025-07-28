import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { notFound } from 'next/navigation'
import { SurveyForm } from '@/app/components'
import { TSurvey } from '@/app/components'

// 설문 데이터 가져오기
async function getSurvey(surveyId: string) {
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    const { data: survey, error } = await supabase
        .from('surveys')
        .select(`
            *,
            creator:profiles!surveys_created_by_fkey(id, username, display_name),
            updater:profiles!surveys_updated_by_fkey(id, username, display_name)
        `)
        .eq('id', surveyId)
        .eq('is_active', true)
        .single()

    if (error || !survey) {
        return null
    }

    return survey
}

export default async function FormViewPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { id: surveyId } = await params;
    const resolvedSearchParams = await searchParams;

    // 설문 데이터 가져오기
    const survey = await getSurvey(surveyId);
    
    if (!survey) {
        notFound();
    }

    // URL 파라미터에서 respondent_id 추출
    const urlParamName = survey.url_param_name || 'rid';
    const urlRespondentId = resolvedSearchParams[urlParamName];
    const finalRespondentId = Array.isArray(urlRespondentId) ? urlRespondentId[0] : urlRespondentId;

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
        updated_by: survey.updated_by,
        creator: survey.creator ? {
            id: survey.creator.id,
            username: survey.creator.username,
            display_name: survey.creator.display_name
        } : undefined,
        updater: survey.updater ? {
            id: survey.updater.id,
            username: survey.updater.username,
            display_name: survey.updater.display_name
        } : undefined
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <SurveyForm 
                survey={surveyData} 
                initialRespondentId={finalRespondentId}
            />
        </div>
    )
} 