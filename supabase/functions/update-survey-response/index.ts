import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  responseId: string
  surveyId: string
  answers: Record<string, any>
  respondent?: string
  email?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { responseId, surveyId, answers, respondent, email }: RequestBody = await req.json()

    if (!responseId || !surveyId || !answers) {
      return new Response(
        JSON.stringify({ error: '필수 파라미터가 누락되었습니다.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. 기존 응답 확인
    const { data: existingResponse, error: fetchError } = await supabaseClient
      .from('survey_responses')
      .select('*')
      .eq('id', responseId)
      .eq('survey_id', surveyId)
      .single()

    if (fetchError || !existingResponse) {
      return new Response(
        JSON.stringify({ error: '응답을 찾을 수 없습니다.' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const now = new Date().toISOString()

    // 2. 새 응답 생성
    const newResponseData = {
      survey_id: surveyId,
      respondent: respondent || existingResponse.respondent,
      email: email || existingResponse.email,
      is_anonymous: existingResponse.is_anonymous,
      answers: answers,
      ip_address: existingResponse.ip_address,
      user_agent: existingResponse.user_agent,
      started_at: now,
      completed_at: now
    }

    const { data: newResponse, error: insertError } = await supabaseClient
      .from('survey_responses')
      .insert(newResponseData)
      .select()
      .single()

    if (insertError) {
      console.error('새 응답 생성 오류:', insertError)
      return new Response(
        JSON.stringify({ error: '응답 수정에 실패했습니다.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 3. 기존 응답에 덮어쓰기 플래그 설정
    const { error: updateError } = await supabaseClient
      .from('survey_responses')
      .update({
        is_overwritten: true,
        overwritten_by: newResponse.id,
        overwritten_at: now
      })
      .eq('id', responseId)

    if (updateError) {
      console.error('기존 응답 플래그 업데이트 오류:', updateError)
      // 새로 생성된 응답을 롤백
      await supabaseClient
        .from('survey_responses')
        .delete()
        .eq('id', newResponse.id)
      
      return new Response(
        JSON.stringify({ error: '응답 수정에 실패했습니다.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        message: '응답이 성공적으로 수정되었습니다.',
        data: newResponse,
        original_response_id: responseId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('응답 수정 중 오류:', error)
    return new Response(
      JSON.stringify({ error: '시스템 오류가 발생했습니다.' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
