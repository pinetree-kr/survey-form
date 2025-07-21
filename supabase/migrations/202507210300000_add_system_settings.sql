-- 시스템 설정 테이블 생성
CREATE TABLE IF NOT EXISTS public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    category text NOT NULL DEFAULT 'general',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_system_settings_key ON public.system_settings(key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);

-- 기본 시스템 설정 데이터 삽입
INSERT INTO public.system_settings (key, value, description, category) VALUES
-- 사용자 관리 설정
('user.default_role', '"user"', '새 사용자의 기본 역할', 'user_management'),
('user.allow_registration', 'true', '회원가입 허용 여부', 'user_management'),
('user.require_email_verification', 'false', '이메일 인증 필수 여부', 'user_management'),

-- 설문 시스템 설정
('survey.default_active', 'true', '새 설문의 기본 활성화 상태', 'survey_system'),
('survey.default_allow_anonymous', 'false', '새 설문의 기본 익명 응답 허용 여부', 'survey_system'),
('survey.response_retention_days', '365', '설문 응답 보관 기간 (일)', 'survey_system'),
('survey.max_surveys_per_user', '50', '사용자당 최대 설문 수', 'survey_system'),

-- 보안 설정
('security.session_timeout_minutes', '60', '세션 타임아웃 시간 (분)', 'security'),
('security.password_min_length', '8', '비밀번호 최소 길이', 'security'),
('security.require_special_char', 'false', '비밀번호 특수문자 필수 여부', 'security'),
('security.max_login_attempts', '5', '최대 로그인 시도 횟수', 'security'),

-- 시스템 정보
('system.version', '"1.0.0"', '시스템 버전', 'system_info'),
('system.maintenance_mode', 'false', '시스템 유지보수 모드', 'system_info')
ON CONFLICT (key) DO NOTHING;

-- RLS 정책 설정
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 관리자만 시스템 설정을 조회/수정할 수 있음
CREATE POLICY "Allow admin to manage system settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

-- 시스템 설정 수정 시 updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 시스템 설정 수정 시 updated_at 자동 업데이트 트리거
CREATE TRIGGER on_system_settings_updated
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at(); 