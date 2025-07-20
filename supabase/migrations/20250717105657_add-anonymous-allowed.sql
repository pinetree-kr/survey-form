-- 익명 허용 필드 추가
ALTER TABLE public.surveys 
ADD COLUMN IF NOT EXISTS allow_anonymous boolean NOT NULL DEFAULT false;

-- 기존 설문들의 익명 허용을 false로 설정 (기본값)
UPDATE public.surveys 
SET allow_anonymous = false 
WHERE allow_anonymous IS NULL; 