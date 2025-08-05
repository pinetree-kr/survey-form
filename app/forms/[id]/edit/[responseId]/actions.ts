"use server"

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { revalidatePath } from 'next/cache'

// 응답 데이터 수정
export async function updateSurveyResponse(
  responseId: string,
  surveyId: string,
  answers: Record<string, any>,
  respondentId?: string | null,
  email?: string | null
) {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    // 먼저 기존 응답과 설문 정보를 가져와서 수정 권한 확인
    const { data: response, error: responseError } = await supabase
      .from('survey_responses')
      .select(`
        *,
        surveys!survey_responses_survey_id_fkey(
          allow_response_modification,
          closes_at,
          access_token_required,
          access_secret_key
        )
      `)
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .single()

    if (responseError || !response) {
      return { 
        success: false, 
        error: '응답을 찾을 수 없습니다.' 
      }
    }

    const survey = response.surveys as any

    // 수정 허용 여부 확인
    if (!survey.allow_response_modification) {
      return { 
        success: false, 
        error: '이 설문은 응답 수정이 허용되지 않습니다.' 
      }
    }

    // 마감시간 확인
    if (survey.closes_at && new Date() > new Date(survey.closes_at)) {
      return { 
        success: false, 
        error: '설문 마감시간이 지나 수정할 수 없습니다.' 
      }
    }

    // URL 파라미터 권한 확인
    if (survey.access_token_required && response.respondent !== respondentId) {
      return { 
        success: false, 
        error: '이 응답을 수정할 권한이 없습니다.' 
      }
    }

    // 응답 업데이트
    const updateData: any = {
      answers,
      updated_at: new Date().toISOString()
    }

    // 이메일이 제공된 경우에만 업데이트
    if (email !== undefined) {
      updateData.email = email
    }

    const { data: updatedResponse, error: updateError } = await supabase
      .from('survey_responses')
      .update(updateData)
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .select()
      .single()

    if (updateError) {
      console.error('응답 업데이트 실패:', updateError)
      return { 
        success: false, 
        error: '응답 업데이트에 실패했습니다.' 
      }
    }

    // 캐시 무효화
    revalidatePath(`/dashboard/forms/${surveyId}/responses`)
    revalidatePath(`/forms/${surveyId}`)
    revalidatePath(`/forms/${surveyId}/edit/${responseId}`)

    return { 
      success: true, 
      data: updatedResponse 
    }

  } catch (error) {
    console.error('응답 수정 중 오류:', error)
    return { 
      success: false, 
      error: '시스템 오류가 발생했습니다.' 
    }
  }
}

// 응답 데이터 조회
export async function getSurveyResponse(responseId: string, surveyId: string) {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    const { data: response, error } = await supabase
      .from('survey_responses')
      .select(`
        *,
        surveys!survey_responses_survey_id_fkey(
          id,
          title,
          allow_response_modification,
          closes_at,
          access_token_required,
          access_secret_key
        )
      `)
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .single()

    if (error || !response) {
      return { 
        success: false, 
        error: '응답을 찾을 수 없습니다.' 
      }
    }

    return { 
      success: true, 
      data: response 
    }

  } catch (error) {
    console.error('응답 조회 중 오류:', error)
    return { 
      success: false, 
      error: '시스템 오류가 발생했습니다.' 
    }
  }
}