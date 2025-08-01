-- =====================================================
-- REMOVE SURVEY CREATOR UPDATE POLICY
-- Remove policy that allows survey creators to update responses
-- =====================================================

-- Drop the policy that allows survey creators to update responses
DROP POLICY IF EXISTS "Allow survey creators to update responses" ON public.survey_responses;