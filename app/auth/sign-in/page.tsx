import { LoginForm } from '../components'
import { handleLogin, verifyAccessToken } from '../actions'
import Link from 'next/link'


export default async function AuthLoginPage() {
  await verifyAccessToken("/admin")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            관리자 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            관리자 계정으로 로그인하세요
          </p>
        </div>
        <LoginForm action={handleLogin} />
        <div className="text-center mt-4">
          <Link
            href="/auth/sign-up"
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            계정이 없으신가요? 회원가입하기
          </Link>
        </div>
      </div>
    </div>
  )
} 