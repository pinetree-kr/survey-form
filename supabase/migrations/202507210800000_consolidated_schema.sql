-- =====================================================
-- CONSOLIDATED DATABASE SCHEMA MIGRATION
-- This file contains all database schema changes in one place
-- =====================================================

-- =====================================================
-- 1. USER MANAGEMENT
-- =====================================================

-- User role enum type
CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    display_name text,
    role user_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Profile indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- Current user role view
CREATE VIEW current_user_role AS
SELECT id, role FROM public.profiles WHERE id = auth.uid();

-- Profile RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow admin to read all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM current_user_role WHERE role = 'admin'
  )
);

CREATE POLICY "Allow admin to update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM current_user_role WHERE role = 'admin'
  )
);

-- New user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id, 
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New user trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. SURVEY SYSTEM
-- =====================================================

-- Surveys table
CREATE TABLE IF NOT EXISTS public.surveys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    questions jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Respondent identification settings
    allow_anonymous boolean NOT NULL DEFAULT true,
    allow_url_param boolean NOT NULL DEFAULT false,
    email_required boolean NOT NULL DEFAULT false,
    url_param_name text DEFAULT 'id',
    allow_email_response_view boolean NOT NULL DEFAULT false,
    allow_duplicate_responses boolean NOT NULL DEFAULT true,
    
    -- Survey timing settings
    opens_at timestamp with time zone,
    closes_at timestamp with time zone
);

-- Survey responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
    respondent text,
    email text,
    answers jsonb NOT NULL DEFAULT '{}'::jsonb,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    ip_address inet,
    user_agent text,
    is_anonymous boolean NOT NULL DEFAULT false
);

-- Survey statistics table
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

-- Survey indexes
CREATE INDEX idx_surveys_created_by ON public.surveys(created_by);
CREATE INDEX idx_surveys_is_active ON public.surveys(is_active);
CREATE INDEX idx_surveys_created_at ON public.surveys(created_at);
CREATE INDEX idx_surveys_updated_at ON public.surveys(updated_at);
CREATE INDEX idx_surveys_updated_by ON public.surveys(updated_by);

-- Survey responses indexes
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_respondent ON public.survey_responses(respondent);
CREATE INDEX idx_survey_responses_email ON public.survey_responses(email);
CREATE INDEX idx_survey_responses_completed_at ON public.survey_responses(completed_at);
CREATE INDEX idx_survey_responses_is_anonymous ON public.survey_responses(is_anonymous);
CREATE INDEX idx_survey_responses_survey_respondent ON public.survey_responses(survey_id, respondent) WHERE respondent IS NOT NULL;
CREATE INDEX idx_survey_responses_respondent_email ON public.survey_responses(respondent) WHERE respondent LIKE '%@%';

-- Survey statistics indexes
CREATE INDEX idx_survey_statistics_survey_id ON public.survey_statistics(survey_id);
CREATE INDEX idx_survey_statistics_question_id ON public.survey_statistics(question_id);

-- Survey constraints
ALTER TABLE public.surveys 
ADD CONSTRAINT check_respondent_identification 
CHECK (
    -- 최소 하나의 식별 방법은 허용되어야 함
    allow_anonymous = true OR allow_url_param = true OR email_required = true
);

ALTER TABLE public.survey_responses 
ADD CONSTRAINT check_anonymous_consistency 
CHECK (
    (respondent IS NULL AND is_anonymous = true) OR 
    (respondent IS NOT NULL AND is_anonymous = false)
);

-- Survey RLS policies
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to view active surveys" ON public.surveys
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow creators to manage their surveys" ON public.surveys
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Allow admin to manage all surveys" ON public.surveys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

-- Survey responses RLS policies
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to create survey responses" ON public.survey_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_responses.survey_id 
            AND (allow_anonymous = true OR auth.uid() IS NOT NULL)
        )
    );

CREATE POLICY "Allow respondents to view their responses" ON public.survey_responses
    FOR SELECT USING (
        (respondent = auth.uid()::text AND is_anonymous = false) OR 
        (respondent IS NULL AND is_anonymous = true)
    );

CREATE POLICY "Allow survey creators to view all responses" ON public.survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_responses.survey_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Allow admin to view all responses" ON public.survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

CREATE POLICY "Allow email response view" ON public.survey_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_responses.survey_id 
            AND allow_email_response_view = true
            AND survey_responses.email IS NOT NULL
        )
    );

-- Survey statistics RLS policies
ALTER TABLE public.survey_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow survey creators to view statistics" ON public.survey_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_statistics.survey_id 
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Allow admin to view all statistics" ON public.survey_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

-- =====================================================
-- 3. SYSTEM SETTINGS
-- =====================================================

-- System settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'general',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- System settings indexes
CREATE INDEX idx_system_settings_key ON public.system_settings(key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);

-- System settings RLS policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin to manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

-- =====================================================
-- 4. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Survey update trigger function
CREATE OR REPLACE FUNCTION update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Survey statistics update trigger function
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Duplicate response check function
CREATE OR REPLACE FUNCTION check_duplicate_response(
    p_survey_id uuid,
    p_respondent text,
    p_email text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
    -- 익명 응답이거나 respondent가 NULL인 경우 중복 확인 불필요
    IF p_respondent IS NULL THEN
        RETURN false;
    END IF;
    
    -- 해당 설문에서 동일한 응답자가 이미 응답했는지 확인
    -- respondent 또는 email로 중복 확인
    RETURN EXISTS (
        SELECT 1 FROM public.survey_responses 
        WHERE survey_id = p_survey_id 
        AND (
            respondent = p_respondent OR 
            (p_email IS NOT NULL AND email = p_email)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER on_survey_updated
    BEFORE UPDATE ON public.surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_updated_at();

CREATE TRIGGER on_survey_statistics_updated
    BEFORE UPDATE ON public.survey_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_updated_at();

CREATE TRIGGER on_system_settings_updated
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- =====================================================
-- 5. VIEWS
-- =====================================================

-- Active surveys view
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

-- Survey response summary view
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

-- Anonymous response summary view
CREATE OR REPLACE VIEW survey_anonymous_response_summary AS
SELECT 
    survey_id,
    COUNT(*) as total_anonymous_responses,
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_anonymous_responses,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_completion_time_minutes
FROM public.survey_responses 
WHERE is_anonymous = true
GROUP BY survey_id;

-- =====================================================
-- 6. DEFAULT DATA
-- =====================================================

-- Default system settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
-- User management settings
('user.default_role', '"user"', '새 사용자의 기본 역할', 'user_management'),
('user.allow_registration', 'true', '회원가입 허용 여부', 'user_management'),
('user.require_email_verification', 'false', '이메일 인증 필수 여부', 'user_management'),

-- Survey system settings
('survey.default_active', 'true', '새 설문의 기본 활성화 상태', 'survey_system'),
('survey.default_allow_anonymous', 'false', '새 설문의 기본 익명 응답 허용 여부', 'survey_system'),
('survey.response_retention_days', '365', '설문 응답 보관 기간 (일)', 'survey_system'),
('survey.max_surveys_per_user', '50', '사용자당 최대 설문 수', 'survey_system'),

-- Security settings
('security.session_timeout_minutes', '60', '세션 타임아웃 시간 (분)', 'security'),
('security.password_min_length', '8', '비밀번호 최소 길이', 'security'),
('security.require_special_char', 'false', '비밀번호 특수문자 필수 여부', 'security'),
('security.max_login_attempts', '5', '최대 로그인 시도 횟수', 'security'),

-- System information
('system.version', '"1.0.0"', '시스템 버전', 'system_info'),
('system.maintenance_mode', 'false', '시스템 유지보수 모드', 'system_info')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON COLUMN public.survey_responses.respondent IS '응답자 식별자 (URL 파라미터 값 또는 기타 텍스트)';
COMMENT ON COLUMN public.survey_responses.email IS '응답자 이메일 주소 (이메일 입력 시나리오에서 사용)';
COMMENT ON COLUMN public.surveys.allow_anonymous IS '익명 응답 허용 여부';
COMMENT ON COLUMN public.surveys.allow_url_param IS 'URL 파라미터로 응답자 ID 받기 허용 여부';
COMMENT ON COLUMN public.surveys.email_required IS '이메일 입력 필수 여부';
COMMENT ON COLUMN public.surveys.url_param_name IS 'URL 파라미터 이름 (기본값: id)';
COMMENT ON COLUMN public.surveys.allow_email_response_view IS '이메일로 응답 조회 허용 여부';
COMMENT ON COLUMN public.surveys.allow_duplicate_responses IS '동일한 응답자의 중복 응답 허용 여부';
COMMENT ON COLUMN public.surveys.opens_at IS '설문 시작 시간 (UTC)';
COMMENT ON COLUMN public.surveys.closes_at IS '설문 종료 시간 (UTC)';
COMMENT ON FUNCTION check_duplicate_response IS '중복 응답 확인 함수 (respondent 또는 email로 확인)'; 