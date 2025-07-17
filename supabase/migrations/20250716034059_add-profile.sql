-- enum 타입 생성
CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');

-- 프로필 테이블 생성 (이미 존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE NOT NULL,
    display_name text,
    role user_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


-- 인덱스 추가 (성능 향상)
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- 현재 사용자 역할 뷰
CREATE VIEW current_user_role AS
SELECT id, role FROM public.profiles WHERE id = auth.uid();

-- 정책 설정 (사용자 자신의 프로필만 조회 및 수정 가능)
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 정책 설정 (관리자는 모든 프로필 조회 및 수정 가능)
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

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- 새 사용자 생성 시 프로필 자동 추가 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 이메일의 로컬 파트를 기본 username으로 사용
    INSERT INTO public.profiles (id, username, display_name)
    VALUES (
        NEW.id, 
        -- SPLIT_PART(NEW.email, '@', 1),  -- 이메일 앞부분을 username으로
        NEW.email,  -- 이메일을 username으로
        NEW.raw_user_meta_data->>'full_name'  -- 선택적: 전체 이름 메타데이터 사용
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성: auth.users에 새 레코드 삽입 시 호출
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();



