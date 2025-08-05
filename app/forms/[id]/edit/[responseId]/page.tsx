import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { notFound } from 'next/navigation'
import { SurveyForm } from '@/app/components'
import { TSurvey, TSurveyResponse } from '@/app/components'

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

// 응답 데이터 가져오기
async function getResponse(responseId: string, surveyId: string) {
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    const { data: response, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('id', responseId)
        .eq('survey_id', surveyId)
        .single()

    if (error || !response) {
        return null
    }

    return response
}

export default async function ResponseEditPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string; responseId: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { id: surveyId, responseId } = await params;
    const resolvedSearchParams = await searchParams;

    // 설문 데이터 가져오기
    const survey = await getSurvey(surveyId);
    
    if (!survey) {
        notFound();
    }

    // 응답 데이터 가져오기
    const response = await getResponse(responseId, surveyId);
    
    if (!response) {
        notFound();
    }

    // 수정 허용 조건 확인
    const isEditAllowed = survey.allow_response_modification;
    const isDeadlinePassed = survey.closes_at && new Date() > new Date(survey.closes_at);
    const isOverwritten = response.is_overwritten;

    if (!isEditAllowed || isDeadlinePassed || isOverwritten) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="text-yellow-800 font-semibold">응답 수정 불가</span>
                        </div>
                        <p className="text-yellow-700 text-sm">
                            {!isEditAllowed && "이 설문은 응답 수정이 허용되지 않습니다."}
                            {isDeadlinePassed && "설문 마감시간이 지나 수정할 수 없습니다."}
                            {isOverwritten && "이 응답은 이미 수정되어 더 이상 변경할 수 없습니다."}
                        </p>
                    </div>

                    <p className="text-gray-500 text-sm">
                        문의사항이 있으시면 관리자에게 연락해 주세요.
                    </p>
                </div>
            </div>
        );
    }

    // URL 파라미터에서 respondent_id 추출 및 검증
    const urlParamName = survey.url_param_name || 'rid';
    const urlRespondentId = resolvedSearchParams[urlParamName];
    const finalRespondentId = Array.isArray(urlRespondentId) ? urlRespondentId[0] : urlRespondentId;

    // URL 파라미터가 필요한 경우 검증
    if (survey.access_token_required && !finalRespondentId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
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
                    </div>

                    <p className="text-gray-500 text-sm">
                        올바른 링크를 사용하거나 관리자에게 문의해 주세요.
                    </p>
                </div>
            </div>
        );
    }

    // 응답자 ID 검증 (URL 파라미터와 응답 데이터의 respondent 필드 비교)
    if (survey.access_token_required && response.respondent !== finalRespondentId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                            <span className="text-red-800 font-semibold">접근 권한 없음</span>
                        </div>
                        <p className="text-red-700 text-sm">
                            이 응답을 수정할 권한이 없습니다.
                        </p>
                    </div>

                    <p className="text-gray-500 text-sm">
                        올바른 링크를 사용하거나 관리자에게 문의해 주세요.
                    </p>
                </div>
            </div>
        );
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
        opens_at: survey.opens_at,
        closes_at: survey.closes_at,
        questions: survey.questions || [],
        created_at: survey.created_at,
        updated_at: survey.updated_at,
        created_by: survey.created_by,
        updated_by: survey.updated_by,
        creator: survey.creator,
        updater: survey.updater
    };

    // 응답 데이터를 TSurveyResponse 타입으로 변환
    const responseData: TSurveyResponse = {
        id: response.id,
        survey_id: response.survey_id,
        respondent_id: response.respondent,
        is_anonymous: response.is_anonymous,
        answers: response.answers || {},
        started_at: response.started_at,
        completed_at: response.completed_at,
        ip_address: response.ip_address,
        user_agent: response.user_agent
    };

    return (
        <SurveyForm 
            survey={surveyData} 
            initialData={responseData}
            isEditMode={true}
            respondentId={finalRespondentId}
        />
    );
}