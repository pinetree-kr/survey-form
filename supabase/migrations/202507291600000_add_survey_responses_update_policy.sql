-- =====================================================
-- ADD UPDATE POLICIES FOR SURVEY_RESPONSES TABLE
-- Allows response updates but restricts admin access
-- =====================================================

-- Allow respondents to update their own responses
CREATE POLICY "Allow respondents to update their responses" ON public.survey_responses
    FOR UPDATE USING (
        -- Only allow updates for responses that belong to the current user/respondent
        (respondent = auth.uid()::text AND is_anonymous = false) OR 
        (respondent IS NULL AND is_anonymous = true)
    );

-- Allow survey creators to update responses (but not admins)
CREATE POLICY "Allow survey creators to update responses" ON public.survey_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.surveys 
            WHERE id = survey_responses.survey_id 
            AND created_by = auth.uid()
        )
        -- Exclude admins from updating responses
        AND NOT EXISTS (
            SELECT 1 FROM current_user_role WHERE role = 'admin'
        )
    );

COMMENT ON POLICY "Allow respondents to update their responses" ON public.survey_responses 
IS '응답자가 자신의 응답을 수정할 수 있도록 허용';

COMMENT ON POLICY "Allow survey creators to update responses" ON public.survey_responses 
IS '설문 작성자가 응답을 수정할 수 있지만 관리자는 제외';