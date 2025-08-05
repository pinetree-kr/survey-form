-- Add access token feature and remove URL parameter required functionality
-- This migration adds access token functionality while removing URL parameter requirement

-- Add new columns for access token feature
ALTER TABLE surveys 
ADD COLUMN access_token_required boolean NOT NULL DEFAULT false,
ADD COLUMN access_secret_key text;


-- Update constraint to reflect new identification methods
-- First check if constraint exists, then drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_respondent_identification' 
        AND table_name = 'surveys'
    ) THEN
        ALTER TABLE surveys DROP CONSTRAINT check_respondent_identification;
    END IF;
END $$;


-- Update existing data to satisfy new constraint
-- For surveys that don't meet the new constraint, enable allow_anonymous
UPDATE surveys 
SET allow_anonymous = true 
WHERE allow_anonymous = false 
  AND access_token_required = false 
  AND email_required = false;

-- Add new constraint
ALTER TABLE surveys 
ADD CONSTRAINT check_respondent_identification 
CHECK (
    -- 최소 하나의 식별 방법은 허용되어야 함
    allow_anonymous = true OR access_token_required = true OR email_required = true
);

-- Update comments for new columns
COMMENT ON COLUMN surveys.access_token_required IS 'Whether access token is required for survey access. When true, respondent must provide valid access token.';
COMMENT ON COLUMN surveys.access_secret_key IS 'Secret key for access token validation. Generated when access_token_required is enabled.';


-- Remove URL parameter required column (we're replacing it with access token)
ALTER TABLE surveys 
DROP COLUMN url_param_required,
DROP COLUMN url_param_name;

-- Create function to generate random secret key
CREATE OR REPLACE FUNCTION generate_secret_key() 
RETURNS text AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to generate secret key when access_token_required is enabled
CREATE OR REPLACE FUNCTION auto_generate_secret_key()
RETURNS TRIGGER AS $$
BEGIN
    -- If access_token_required is being set to true and secret key is null, generate one
    IF NEW.access_token_required = true AND NEW.access_secret_key IS NULL THEN
        NEW.access_secret_key = generate_secret_key();
    END IF;
    
    -- If access_token_required is being set to false, clear the secret key
    IF NEW.access_token_required = false THEN
        NEW.access_secret_key = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate secret key
CREATE TRIGGER on_survey_access_token_change
    BEFORE INSERT OR UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_secret_key();

-- Add comment for the function
COMMENT ON FUNCTION generate_secret_key IS 'Generates a random 64-character hex string for use as access token secret key';
COMMENT ON FUNCTION auto_generate_secret_key IS 'Trigger function to automatically generate or clear secret key based on access_token_required setting';