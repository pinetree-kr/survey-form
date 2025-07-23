import { SignUpForm } from '../components'
import { verifyAccessToken, handleSignUp } from '../actions'

export default async function AuthSignUpPage() {
    await verifyAccessToken("/dashboard")

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