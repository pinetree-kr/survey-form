import { createClient } from '@/lib/supabase-ssr'

// 응답자 식별자 결정 로직
export function determineRespondentIdentifier(
  respondent?: string,
  email?: string,
  allowAnonymous?: boolean
) {
  let finalRespondent: string | null = null;
  let finalEmail: string | null = null;
  let finalIsAnonymous = false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 1) respondent가 제공된 경우 (URL 파라미터 또는 이메일)
  if (respondent) {
    finalRespondent = respondent;
    // 이메일 형식인지 확인하여 finalEmail 설정
    if (emailRegex.test(respondent)) {
      finalEmail = respondent;
    }
    finalIsAnonymous = false;
  }
  // 2) 별도 이메일이 제공된 경우
  else if (email) {
    finalRespondent = email;
    finalEmail = email;
    finalIsAnonymous = false;
  }
  // 3) 익명 허용인 경우
  else if (allowAnonymous) {
    finalRespondent = null;
    finalIsAnonymous = true;
  }

  return {
    finalRespondent,
    finalEmail,
    finalIsAnonymous,
    isValid: finalRespondent !== null || finalIsAnonymous
  };
}

// 설문 유효성 검증
export function validateSurvey(survey: any) {
  if (!survey.is_active) {
    return { valid: false, error: '비활성화된 설문입니다.' };
  }

  const now = new Date();
  if (survey.opens_at && new Date(survey.opens_at) > now) {
    return { valid: false, error: '설문이 아직 시작되지 않았습니다.' };
  }
  if (survey.closes_at && new Date(survey.closes_at) < now) {
    return { valid: false, error: '설문이 종료되었습니다.' };
  }

  return { valid: true };
}

// 화이트리스트 확인
export function checkAllowedList(allowedList: string[] | null, identifier: string | null) {
  if (allowedList && Array.isArray(allowedList) && identifier) {
    return allowedList.includes(identifier);
  }
  return true; // 화이트리스트가 없거나 익명인 경우 허용
}

// 기존 응답 확인 (덮어쓰인 응답은 제외)
export async function findExistingResponse(
  supabase: any,
  surveyId: string,
  respondent: string | null,
  email: string | null
) {
  if (!respondent && !email) return null;

  const query = supabase
    .from('survey_responses')
    .select('id, answers, completed_at, respondent, email')
    .eq('survey_id', surveyId)
    .eq('is_overwritten', false); // 덮어쓰인 응답은 제외

  if (respondent && email) {
    query.or(`respondent.eq.${respondent},email.eq.${email}`);
  } else if (respondent) {
    query.eq('respondent', respondent);
  } else if (email) {
    query.eq('email', email);
  }

  const { data, error } = await query.single();
  return error ? null : data;
}

// 이메일 형식 검증
export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}