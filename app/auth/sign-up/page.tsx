import { SignUpForm } from '../components'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createClient } from '@/lib/supabase-ssr'

export default async function AuthSignUpPage() {

    const handleSignUp = async (email: string, password: string) => {
        'use server'

        const { env } = await getCloudflareContext({ async: true })
        const supabase = await createClient(env)

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })
        console.log({ data, error })
        if (error) {
            return { error: { message: error.message } }
        }

        // 회원가입 성공 시 성공 메시지와 함께 응답
        return { success: true, message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.' }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        회원가입
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        새로운 계정을 만들어주세요
                    </p>
                </div>
                <SignUpForm action={handleSignUp} />
            </div>
        </div>
    )
} 