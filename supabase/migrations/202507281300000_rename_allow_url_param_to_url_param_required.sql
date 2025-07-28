-- Rename allow_url_param column to url_param_required for better semantic meaning
ALTER TABLE surveys 
RENAME COLUMN allow_url_param TO url_param_required;

-- Update comment for better documentation
COMMENT ON COLUMN surveys.url_param_required IS 'Whether URL parameter is required for survey access. When true, respondent must be identified via URL parameter.';