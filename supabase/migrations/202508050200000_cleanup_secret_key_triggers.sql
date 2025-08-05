-- Clean up and reorganize secret key management triggers
-- Remove any duplicate or conflicting triggers and functions

-- Drop all existing triggers and functions related to secret key management
DROP TRIGGER IF EXISTS on_survey_access_token_change ON surveys;
DROP TRIGGER IF EXISTS manage_access_secret_key ON surveys;
DROP FUNCTION IF EXISTS auto_generate_secret_key();
DROP FUNCTION IF EXISTS manage_access_secret_key();

-- Recreate the auto_generate_secret_key function with updated logic
-- This function only generates keys when needed, never clears them
CREATE OR REPLACE FUNCTION auto_generate_secret_key()
RETURNS TRIGGER AS $$
BEGIN
    -- If access_token_required is being set to true and secret key is null, generate one
    IF NEW.access_token_required = true AND NEW.access_secret_key IS NULL THEN
        NEW.access_secret_key = generate_secret_key();
    END IF;
    
    -- Note: We preserve existing secret keys even when access_token_required is false
    -- This allows users to toggle the feature without losing their generated keys
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to automatically manage secret keys
CREATE TRIGGER on_survey_access_token_change
    BEFORE INSERT OR UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_secret_key();