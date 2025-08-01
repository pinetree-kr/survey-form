import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from 'next/server'

// 응답 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; responseId: string }> }
) {
  try {
    const { id: surveyId, responseId } = await params
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

    const body = await req.json()
    const { answers, respondent, email } = body as { answers: any, respondent: any, email: string }

    // 먼저 기존 응답과 설문 정보를 가져와서 수정 권한 확인
    const { data: response, error: responseError } = await supabase
      .from('survey_responses')
      .select(`
        *,
        surveys!survey_responses_survey_id_fkey(
          allow_response_modification,
          closes_at,
          url_param_required,
          url_param_name
        )
      `)
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .single()

    if (responseError || !response) {
      return NextResponse.json(
        { error: '응답을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 덮어쓰인 응답인지 확인
    if (response.is_overwritten) {
      return NextResponse.json(
        { error: '이 응답은 이미 수정되어 더 이상 변경할 수 없습니다.' },
        { status: 403 }
      )
    }

    const survey = response.surveys as any

    // 수정 허용 여부 확인
    if (!survey.allow_response_modification) {
      return NextResponse.json(
        { error: '이 설문은 응답 수정이 허용되지 않습니다.' },
        { status: 403 }
      )
    }

    // 마감시간 확인
    if (survey.closes_at && new Date() > new Date(survey.closes_at)) {
      return NextResponse.json(
        { error: '설문 마감시간이 지나 수정할 수 없습니다.' },
        { status: 403 }
      )
    }

    // URL 파라미터 권한 확인 (필요한 경우)
    if (survey.url_param_required && response.respondent !== respondent) {
      return NextResponse.json(
        { error: '이 응답을 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // Edge Function 호출
    const functionUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-survey-response`
    const functionResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        responseId,
        surveyId,
        answers,
        respondent,
        email
      })
    })

    if (!functionResponse.ok) {
      const errorData = await functionResponse.json() as { error?: string }
      return NextResponse.json(
        { error: errorData.error || '응답 수정에 실패했습니다.' },
        { status: functionResponse.status }
      )
    }

    const result = await functionResponse.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('응답 수정 중 오류:', error)
    return NextResponse.json(
      { error: '시스템 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}