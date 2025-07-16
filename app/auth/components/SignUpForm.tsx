"use client"

import { useState } from "react"
import { toast, ToastContainer } from "react-toastify"

export default function SignUpForm({
    action
}: {
    action: (email: string, password: string) => Promise<{ error?: { message: string }, success?: boolean, message?: string }>
}) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // 비밀번호 확인 검증
        if (password !== confirmPassword) {
            toast.error('비밀번호가 일치하지 않습니다.')
            setLoading(false)
            return
        }

        // 비밀번호 길이 검증
        if (password.length < 6) {
            toast.error('비밀번호는 최소 6자 이상이어야 합니다.')
            setLoading(false)
            return
        }

        try {
            const result = await action(email, password)
            if (result.error) {
                toast.error(result.error.message)
            } else if (result.success) {
                toast.success(result.message || '회원가입이 완료되었습니다.')
                // 성공 시 로그인 페이지로 리다이렉트
                setTimeout(() => {
                    window.location.href = '/auth/sign-in'
                }, 2000)
            }
        } catch (err) {
            toast.error('회원가입 중 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <form className="mt-8 space-y-6" onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}>
                <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label htmlFor="email" className="sr-only">
                            이메일
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">
                            비밀번호
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="비밀번호 (최소 6자)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="sr-only">
                            비밀번호 확인
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="비밀번호 확인"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        disabled={loading}
                        onClick={handleSignUp}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '회원가입 중...' : '회원가입'}
                    </button>
                </div>

                <div className="text-center">
                    <a 
                        href="/auth/sign-in" 
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                    >
                        이미 계정이 있으신가요? 로그인하기
                    </a>
                </div>
            </form>
            <ToastContainer />
        </div>
    )
} 