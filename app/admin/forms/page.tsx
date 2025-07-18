import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SurveyList from './components/SurveyList'

export default async function FormsAdminPage() {
    const getSurveys = async () => {
        "use server"

        const { env } = await getCloudflareContext({ async: true })
        const supabase = await createClient(env)

        // 현재 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            throw new Error('인증이 필요합니다')
        }

        // 사용자 역할 확인
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !userProfile) {
            throw new Error('사용자 정보를 불러올 수 없습니다')
        }

        let query = supabase
            .from('surveys')
            .select(`
                *, 
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
            .order('created_at', { ascending: false })

        // user 역할인 경우 자신이 작성한 설문만 조회
        if (userProfile.role === 'user') {
            query = query.eq('created_by', user.id)
        }
        // admin과 moderator는 모든 설문 조회

        const { data, error } = await query

        if (error) {
            console.error('설문 목록을 불러오는데 실패했습니다:', error)
            return { surveys: [], userRole: userProfile.role }
        }

        return { surveys: data, userRole: userProfile.role }
    }

    const deleteSurvey = async (surveyId: string) => {
        "use server"

        const { env } = await getCloudflareContext({ async: true })
        const supabase = await createClient(env)

        // 현재 사용자 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            throw new Error('인증이 필요합니다')
        }

        // 사용자 역할 확인
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !userProfile) {
            throw new Error('사용자 정보를 불러올 수 없습니다')
        }

        // 설문 정보 조회
        const { data: survey, error: surveyError } = await supabase
            .from('surveys')
            .select('created_by')
            .eq('id', surveyId)
            .single()

        if (surveyError || !survey) {
            throw new Error('설문을 찾을 수 없습니다')
        }

        // 권한 확인: admin이거나 설문 작성자인 경우만 삭제 가능
        if (userProfile.role !== 'admin' && survey.created_by !== user.id) {
            throw new Error('삭제 권한이 없습니다')
        }

        const { error } = await supabase
            .from('surveys')
            .delete()
            .eq('id', surveyId)

        if (error) {
            throw new Error('설문 삭제에 실패했습니다')
        }

        return true
    }

    const { surveys, userRole } = await getSurveys()

    return (
        <div className="py-6 sm:px-6 lg:px-8 space-y-6">
            <div className="flex justify-between items-top">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">설문 관리</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        설문조사를 생성하고 관리하세요.
                    </p>
                </div>
                <span>
                    <Link
                        href="/admin/forms/create"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        새 설문 생성
                    </Link>
                </span>
            </div>

            <SurveyList surveys={surveys} deleteSurvey={deleteSurvey} userRole={userRole} />
        </div>
    )
} 