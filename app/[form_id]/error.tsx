'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  // 에러 메시지에 따른 다른 UI 표시
  const getErrorContent = () => {
    const message = error.message.toLowerCase()
    
    if (message.includes('액세스 토큰이 필요') || message.includes('access token required')) {
      return {
        title: '액세스 토큰 필요',
        description: '이 설문에 접근하려면 유효한 액세스 토큰이 필요합니다.',
        icon: (
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      }
    }
    
    if (message.includes('유효하지 않은') || message.includes('invalid token')) {
      return {
        title: '유효하지 않은 토큰',
        description: '제공된 액세스 토큰이 유효하지 않습니다.',
        icon: (
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        )
      }
    }
    
    if (message.includes('이미 응답') || message.includes('already responded')) {
      return {
        title: '중복 응답',
        description: '이미 응답한 사용자입니다.',
        icon: (
          <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      }
    }
    
    if (message.includes('허용된 응답자') || message.includes('not allowed')) {
      return {
        title: '접근 권한 없음',
        description: '허용된 응답자가 아닙니다.',
        icon: (
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        )
      }
    }
    
    if (message.includes('아직 시작되지 않았습니다') || message.includes('not started')) {
      return {
        title: '설문 시작 전',
        description: '설문이 아직 시작되지 않았습니다.',
        icon: (
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    }
    
    if (message.includes('종료되었습니다') || message.includes('ended') || message.includes('closed')) {
      return {
        title: '설문 종료',
        description: '설문이 종료되었습니다.',
        icon: (
          <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    }
    
    // 기본 에러
    return {
      title: '오류가 발생했습니다',
      description: '설문을 불러오는 중 문제가 발생했습니다.',
      icon: (
        <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }
  }

  const errorContent = getErrorContent()

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {errorContent.icon}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{errorContent.title}</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            {errorContent.description}
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800 font-semibold">접근 오류</span>
          </div>
          <p className="text-red-700 text-sm">
            올바른 링크를 사용하거나 관리자에게 문의해 주세요.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            이전으로
          </button>
          <button
            onClick={reset}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>

        <p className="text-gray-500 text-sm mt-6">
          문제가 계속되면 관리자에게 문의해 주세요.
        </p>
      </div>
    </div>
  )
}