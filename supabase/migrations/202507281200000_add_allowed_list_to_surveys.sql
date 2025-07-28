-- Add allowed_list JSON column to surveys table for respondent whitelist management
ALTER TABLE surveys 
ADD COLUMN allowed_list JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN surveys.allowed_list IS 'JSON array containing allowed respondent identifiers. NULL means whitelist is disabled.';

-- Create index for efficient JSON array queries
CREATE INDEX idx_surveys_allowed_list ON surveys USING GIN (allowed_list) WHERE allowed_list IS NOT NULL;