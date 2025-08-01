-- Add webhook_url column to surveys table
ALTER TABLE surveys 
ADD COLUMN webhook_url TEXT NULL;

-- Add comment for the column
COMMENT ON COLUMN surveys.webhook_url IS 'Webhook URL to send notifications when survey responses are submitted';

-- Optional: Add index for performance if needed
-- CREATE INDEX idx_surveys_webhook_url ON surveys(webhook_url) WHERE webhook_url IS NOT NULL;