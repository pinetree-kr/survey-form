'use client'

import React from 'react'

export function ConfirmPageClient() {
  React.useEffect(() => {
    setTimeout(() => {
      window.location.href = '/auth/sign-in'
    }, 3000)
  }, [])

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              인증 완료!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              이메일 인증이 성공적으로 완료되었습니다.
              <br />
              잠시 후 로그인 페이지로 이동합니다.
            </p>
          </div>
        </div>
      </div>
    </>
  )
} 