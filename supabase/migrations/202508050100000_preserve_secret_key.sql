-- Remove the logic that clears access_secret_key when access_token_required is false
-- This allows users to preserve their secret keys even when they disable access token requirement

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS manage_access_secret_key ON surveys;
DROP FUNCTION IF EXISTS manage_access_secret_key();

-- Recreate the function without the logic that clears the secret key
CREATE OR REPLACE FUNCTION manage_access_secret_key()
RETURNS TRIGGER AS $$
BEGIN
    -- If access_token_required is being set to true and secret key is null, generate one
    IF NEW.access_token_required = true AND NEW.access_secret_key IS NULL THEN
        NEW.access_secret_key = generate_secret_key();
    END IF;
    
    -- Note: We no longer clear the secret key when access_token_required is false
    -- This preserves the existing secret key for future use
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER manage_access_secret_key
    BEFORE INSERT OR UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION manage_access_secret_key();