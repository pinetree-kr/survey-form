-- 익명 응답 지원 개선

-- 1. 익명 응답을 위한 추가 필드들
ALTER TABLE public.survey_responses 
ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;

-- 2. 익명 응답 시 respondent_id가 NULL이면 is_anonymous를 true로 설정하는 제약 조건
ALTER TABLE public.survey_responses 
ADD CONSTRAINT check_anonymous_consistency 
CHECK (
    (respondent_id IS NULL AND is_anonymous = true) OR 
    (respondent_id IS NOT NULL AND is_anonymous = false)
);

-- 3. 익명 응답을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_survey_responses_is_anonymous 
ON public.survey_responses(is_anonymous);

-- 4. 기존 데이터에서 respondent_id가 NULL인 경우 is_anonymous를 true로 설정
UPDATE public.survey_responses 
SET is_anonymous = true 
WHERE respondent_id IS NULL;

-- 5. 익명 응답 정책 개선
DROP POLICY IF EXISTS "Allow public to create survey responses" ON public.survey_responses;

-- 익명 응답 허용 정책 (설문이 익명을 허용하는 경우에만)
CREATE POLICY "Allow public to create survey responses" ON public.survey_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_responses.survey_id 
            AND (allow_anonymous = true OR auth.uid() IS NOT NULL)
        )
    );

-- 6. 익명 응답 조회 정책 개선
DROP POLICY IF EXISTS "Allow respondents to view their responses" ON public.survey_responses;

-- 응답자는 자신의 응답을 조회할 수 있음 (익명 응답은 조회 불가)
CREATE POLICY "Allow respondents to view their responses" ON public.survey_responses
    FOR SELECT USING (
        (respondent_id = auth.uid() AND is_anonymous = false) OR 
        (respondent_id IS NULL AND is_anonymous = true)
    );

-- 7. 익명 응답 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW survey_anonymous_response_summary AS
SELECT 
    survey_id,
    COUNT(*) as total_anonymous_responses,
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_anonymous_responses,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_completion_time_minutes
FROM public.survey_responses 
WHERE is_anonymous = true
GROUP BY survey_id; 