
-- 설문 테이블 생성 (이미 존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS public.surveys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    questions jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamp with time zone DEFAULT now()
);

-- 설문 응답 테이블 생성 (이미 존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    -- respondent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    respondent_id uuid,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    ip_address inet,
    user_agent text
);

-- 설문 통계 테이블 생성 (이미 존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS public.survey_statistics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    question_id text NOT NULL,
    answer_data jsonb NOT NULL,
    response_count integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(survey_id, question_id, answer_data)
);

-- 인덱스 생성 (성능 향상) - 이미 존재하지 않는 경우에만
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_surveys_created_by') THEN
        CREATE INDEX idx_surveys_created_by ON public.surveys(created_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_surveys_is_active') THEN
        CREATE INDEX idx_surveys_is_active ON public.surveys(is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_surveys_created_at') THEN
        CREATE INDEX idx_surveys_created_at ON public.surveys(created_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_surveys_updated_at') THEN
        CREATE INDEX idx_surveys_updated_at ON public.surveys(updated_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_surveys_updated_by') THEN
        CREATE INDEX idx_surveys_updated_by ON public.surveys(updated_by);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_survey_responses_survey_id') THEN
        CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_survey_responses_respondent_id') THEN
        CREATE INDEX idx_survey_responses_respondent_id ON public.survey_responses(respondent_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_survey_responses_completed_at') THEN
        CREATE INDEX idx_survey_responses_completed_at ON public.survey_responses(completed_at);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_survey_statistics_survey_id') THEN
        CREATE INDEX idx_survey_statistics_survey_id ON public.survey_statistics(survey_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_survey_statistics_question_id') THEN
        CREATE INDEX idx_survey_statistics_question_id ON public.survey_statistics(question_id);
    END IF;
END $$;

-- 현재 사용자 역할 뷰 (기존 profiles 테이블 활용)
CREATE OR REPLACE VIEW current_user_role AS
SELECT id, role FROM public.profiles WHERE id = auth.uid();

-- 설문 테이블 RLS 정책 설정
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow public to view active surveys" ON public.surveys;
DROP POLICY IF EXISTS "Allow creators to manage their surveys" ON public.surveys;
DROP POLICY IF EXISTS "Allow admin to manage all surveys" ON public.surveys;

-- 모든 사용자가 활성화된 설문을 조회할 수 있음
CREATE POLICY "Allow public to view active surveys" ON public.surveys
    FOR SELECT USING (is_active = true);

-- 설문 작성자는 자신이 만든 설문을 조회/수정/삭제할 수 있음
CREATE POLICY "Allow creators to manage their surveys" ON public.surveys
    FOR ALL USING (auth.uid() = created_by);

-- 관리자는 모든 설문을 관리할 수 있음
CREATE POLICY "Allow admin to manage all surveys" ON public.surveys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

-- 설문 응답 테이블 RLS 정책 설정
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow public to create survey responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow respondents to view their responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow survey creators to view all responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow admin to view all responses" ON public.survey_responses;

-- 모든 사용자가 설문에 응답할 수 있음 (익명 응답 허용)
CREATE POLICY "Allow public to create survey responses" ON public.survey_responses
    FOR INSERT WITH CHECK (true);

-- 응답자는 자신의 응답을 조회할 수 있음
CREATE POLICY "Allow respondents to view their responses" ON public.survey_responses
    FOR SELECT USING (
        respondent_id = auth.uid() OR respondent_id IS NULL
    );

-- 설문 작성자는 자신의 설문에 대한 모든 응답을 조회할 수 있음
CREATE POLICY "Allow survey creators to view all responses" ON public.survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_responses.survey_id 
            AND created_by = auth.uid()
        )
    );

-- 관리자는 모든 응답을 조회할 수 있음
CREATE POLICY "Allow admin to view all responses" ON public.survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

-- 설문 통계 테이블 RLS 정책 설정
ALTER TABLE public.survey_statistics ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Allow survey creators to view statistics" ON public.survey_statistics;
DROP POLICY IF EXISTS "Allow admin to view all statistics" ON public.survey_statistics;

-- 설문 작성자는 자신의 설문 통계를 조회할 수 있음
CREATE POLICY "Allow survey creators to view statistics" ON public.survey_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_statistics.survey_id 
            AND created_by = auth.uid()
        )
    );

-- 관리자는 모든 통계를 조회할 수 있음
CREATE POLICY "Allow admin to view all statistics" ON public.survey_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

-- 설문 수정 시 updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS on_survey_updated ON public.surveys;
DROP TRIGGER IF EXISTS on_survey_statistics_updated ON public.survey_statistics;

-- 설문 수정 시 updated_at 자동 업데이트 트리거
CREATE TRIGGER on_survey_updated
    BEFORE UPDATE ON public.surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_updated_at();

-- 설문 통계 수정 시 updated_at 자동 업데이트 트리거
CREATE TRIGGER on_survey_statistics_updated
    BEFORE UPDATE ON public.survey_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_updated_at();

-- 설문 조회를 위한 뷰 생성 (활성화된 설문만)
-- CREATE OR REPLACE VIEW active_surveys AS
-- SELECT 
--     id,
--     title,
--     description,
--     questions,
--     created_by,
--     created_at,
--     updated_at
-- FROM public.surveys
-- WHERE is_active = true
-- ORDER BY created_at DESC;

CREATE OR REPLACE VIEW active_surveys AS
SELECT 
    s.id,
    s.title,
    s.description,
    s.questions,
    s.created_by,
    s.updated_by,
    s.created_at,
    s.updated_at,
    creator.username as creator_username,
    creator.display_name as creator_display_name,
    updater.username as updater_username,
    updater.display_name as updater_display_name
FROM public.surveys s
LEFT JOIN public.profiles creator ON s.created_by = creator.id
LEFT JOIN public.profiles updater ON s.updated_by = updater.id
WHERE s.is_active = true
ORDER BY s.created_at DESC; 

-- 설문 응답 요약 뷰 생성
CREATE OR REPLACE VIEW survey_response_summary AS
SELECT 
    s.id as survey_id,
    s.title as survey_title,
    COUNT(sr.id) as total_responses,
    COUNT(sr.completed_at) as completed_responses,
    AVG(EXTRACT(EPOCH FROM (sr.completed_at - sr.started_at))/60) as avg_completion_time_minutes
FROM public.surveys s
LEFT JOIN public.survey_responses sr ON s.id = sr.survey_id
GROUP BY s.id, s.title
ORDER BY s.created_at DESC;
