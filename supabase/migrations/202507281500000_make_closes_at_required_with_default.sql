-- Make closes_at required with default value of 1 week from now
-- First, update existing surveys that have NULL closes_at
UPDATE surveys 
SET closes_at = (NOW() + INTERVAL '7 days')::timestamp with time zone
WHERE closes_at IS NULL;

-- Then make the column NOT NULL with a default value
ALTER TABLE surveys 
ALTER COLUMN closes_at SET DEFAULT (NOW() + INTERVAL '7 days')::timestamp with time zone,
ALTER COLUMN closes_at SET NOT NULL;

-- Add comment for the column
COMMENT ON COLUMN surveys.closes_at IS 'Survey closing date and time (required, defaults to 1 week from creation)';