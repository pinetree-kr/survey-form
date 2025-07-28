-- Rename allow_email_response_view to allow_response_view and add allow_response_modification
ALTER TABLE surveys 
RENAME COLUMN allow_email_response_view TO allow_response_view;

-- Add new column for response modification capability
ALTER TABLE surveys 
ADD COLUMN allow_response_modification BOOLEAN DEFAULT false;

-- Add comment for the renamed column
COMMENT ON COLUMN surveys.allow_response_view IS 'Allow respondents to view their responses using their identifier';

-- Add comment for the new column
COMMENT ON COLUMN surveys.allow_response_modification IS 'Allow respondents to modify their responses before survey closes';