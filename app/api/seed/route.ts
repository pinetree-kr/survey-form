import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from '@/lib/supabase-ssr'
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const supabase = await createClient(env, env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🌱 시작: API를 통한 시드 데이터 삽입...')

    // 1. 사용자 데이터 삽입
    console.log('👤 사용자 데이터 삽입 중...')
    
    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@example.com',
        password: 'password123',
        full_name: '관리자',
        role: 'admin' as const
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'user@example.com',
        password: 'password123',
        full_name: '일반사용자',
        role: 'user' as const
      }
    ]

    for (const user of users) {
      // auth.users에 사용자 생성
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name
        }
      })

      if (authError) {
        console.error(`❌ 사용자 생성 실패 (${user.email}):`, authError.message)
        continue
      }

      console.log(`✅ 사용자 생성 완료: ${user.email}`)

      // profiles 테이블에 프로필 데이터 삽입
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email,
          display_name: user.full_name,
          role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error(`❌ 프로필 생성 실패 (${user.email}):`, profileError.message)
      } else {
        console.log(`✅ 프로필 생성 완료: ${user.email}`)
      }
    }

    // 2. 설문 데이터 삽입
    console.log('📝 설문 데이터 삽입 중...')
    
    const surveyData = {
      id: '33333333-3333-3333-3333-333333333333',
      title: '샘플 설문조사',
      description: '이것은 샘플 설문조사입니다.',
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: '이름을 입력해주세요.',
          required: true
        },
        {
          id: 'q2',
          type: 'radio',
          question: '성별을 선택해주세요.',
          options: ['남성', '여성', '기타'],
          required: true
        },
        {
          id: 'q3',
          type: 'checkbox',
          question: '관심 있는 분야를 선택해주세요. (복수 선택 가능)',
          options: ['기술', '예술', '스포츠', '음식', '여행'],
          required: false
        },
        {
          id: 'q4',
          type: 'textarea',
          question: '추가 의견이 있으시면 작성해주세요.',
          required: false
        }
      ],
      is_active: true,
      allow_anonymous: true,
      allow_url_param: false,
      email_required: false,
      url_param_name: 'rid',
      allow_email_response_view: false,
      allow_duplicate_responses: true,
      created_by: '11111111-1111-1111-1111-111111111111'
    }

    const { error: surveyError } = await supabase
      .from('surveys')
      .upsert({
        ...surveyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (surveyError) {
      console.error('❌ 설문 생성 실패:', surveyError.message)
    } else {
      console.log('✅ 설문 생성 완료')
    }

    // 3. 샘플 응답 데이터 삽입 (선택사항)
    console.log('📊 응답 데이터 삽입 중...')
    
    const responseData = {
      id: '44444444-4444-4444-4444-444444444444',
      survey_id: '33333333-3333-3333-3333-333333333333',
      respondent_id: '22222222-2222-2222-2222-222222222222', // UUID를 text로 저장
      is_anonymous: false,
      answers: {
        q1: '홍길동',
        q2: '남성',
        q3: ['기술', '여행'],
        q4: '매우 유용한 설문이었습니다.'
      },
      started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1시간 전
      completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30분 전
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }

    const { error: responseError } = await supabase
      .from('survey_responses')
      .upsert(responseData)

    if (responseError) {
      console.error('❌ 응답 데이터 생성 실패:', responseError.message)
    } else {
      console.log('✅ 응답 데이터 생성 완료')
    }

    console.log('🎉 시드 데이터 삽입 완료!')

    return NextResponse.json({ 
      success: true, 
      message: '시드 데이터가 성공적으로 삽입되었습니다.' 
    })

  } catch (error) {
    console.error('❌ 시드 실행 중 오류 발생:', error)
    return NextResponse.json(
      { success: false, error: '시드 데이터 삽입 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 