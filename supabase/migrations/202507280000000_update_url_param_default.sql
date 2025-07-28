-- Update default value for url_param_name from 'id' to 'rid'
ALTER TABLE public.surveys ALTER COLUMN url_param_name SET DEFAULT 'rid';

-- Update comment to reflect new default value
COMMENT ON COLUMN public.surveys.url_param_name IS 'URL 파라미터 이름 (기본값: rid)';