-- 응답 수정 이력 관리를 위한 컬럼 추가
ALTER TABLE public.survey_responses 
ADD COLUMN overwritten_by uuid REFERENCES public.survey_responses(id) ON DELETE SET NULL,
ADD COLUMN is_overwritten boolean NOT NULL DEFAULT false,
ADD COLUMN overwritten_at timestamp with time zone;

-- 인덱스 추가
CREATE INDEX idx_survey_responses_overwritten_by ON public.survey_responses(overwritten_by);
CREATE INDEX idx_survey_responses_is_overwritten ON public.survey_responses(is_overwritten);

-- 활성 응답만 조회하는 뷰 생성
CREATE VIEW active_survey_responses AS
SELECT * FROM public.survey_responses 
WHERE is_overwritten = false;

-- 댓글: 
-- overwritten_by: 이 응답을 덮어쓴 새 응답의 ID
-- is_overwritten: 이 응답이 덮어써진 상태인지 여부
-- overwritten_at: 덮어써진 시점