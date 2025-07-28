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

    // URL 파라미터에서 respondent_id 추출 및 검증
    const urlParamName = survey.url_param_name || 'rid';
    const urlRespondentId = resolvedSearchParams[urlParamName];
    const finalRespondentId = Array.isArray(urlRespondentId) ? urlRespondentId[0] : urlRespondentId;

    // URL 파라미터가 필수인데 없거나 빈값인 경우 오류 처리
    if (survey.url_param_required && !survey.allow_anonymous && !survey.email_required) {
        if (!finalRespondentId || finalRespondentId.trim() === '') {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="mb-8">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">접근 오류</h2>
                            <p className="text-gray-600 leading-relaxed mb-4">
                                이 설문은 URL 파라미터를 통한 응답자 식별이 필요합니다.
                            </p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                            <div className="flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-red-800 font-semibold">필수 파라미터 누락</span>
                            </div>
                            <p className="text-red-700 text-sm mb-2">
                                URL에 <code className="bg-red-100 px-1 rounded">{urlParamName}</code> 파라미터가 필요합니다.
                            </p>
                            <p className="text-red-700 text-sm">
                                예: <code className="bg-red-100 px-1 rounded">?{urlParamName}=user123</code>
                            </p>
                        </div>

                        <p className="text-gray-500 text-sm">
                            올바른 링크를 사용하거나 관리자에게 문의해 주세요.
                        </p>
                    </div>
                </div>
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
        url_param_required: survey.url_param_required,
        email_required: survey.email_required,
        url_param_name: survey.url_param_name,
        allow_response_view: survey.allow_response_view,
        allow_response_modification: survey.allow_response_modification,
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