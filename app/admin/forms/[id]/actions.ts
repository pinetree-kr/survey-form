"use server"

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { TSurvey } from '@/app/components'

export async function fetchSurvey(id: string): Promise<TSurvey | null> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const supabase = await createClient(env)

            const { data, error } = await supabase
          .from('surveys')
          .select(`
            id,
            title,
            description,
            questions,
            is_active,
            allow_anonymous,
            allow_url_param,
            email_required,
            url_param_name,
            allow_email_response_view,
            allow_duplicate_responses,
            opens_at,
            closes_at,
            created_by,
            updated_by,
            created_at,
            updated_at,
            creator:profiles!surveys_created_by_fkey(
              id, 
              username, 
              display_name
            ),
            updater:profiles!surveys_updated_by_fkey(
              id, 
              username, 
              display_name
            )
          `)
          .eq('id', id)
          .single<TSurvey>()

    if (error || !data) {
      return null
    }
    
    return data
  } catch (error) {
    console.error('설문 데이터 가져오기 실패:', error)
    return null
  }
} 