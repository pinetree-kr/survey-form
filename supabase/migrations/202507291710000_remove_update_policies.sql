-- =====================================================
-- REMOVE UPDATE POLICIES FOR SURVEY_RESPONSES
-- Remove all UPDATE policies and use service role key instead
-- =====================================================

-- Drop all UPDATE policies for survey_responses
DROP POLICY IF EXISTS "Allow respondents to update their responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow survey creators to update responses" ON public.survey_responses;