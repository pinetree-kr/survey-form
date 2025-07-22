"use client"

import Link from 'next/link'
import { TSurvey } from '@/app/components'
import QuestionListView from './QuestionListView'
import { useState, useEffect } from 'react'
import { fetchSurvey } from '../actions'

interface SurveyDetailViewProps {
  surveyId: string
}

export default function SurveyDetailView({ surveyId }: SurveyDetailViewProps) {
  const [survey, setSurvey] = useState<TSurvey | null>(null)
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    async function loadSurvey() {
      try {
        const data = await fetchSurvey(surveyId)
        setSurvey(data)
      } catch (error) {
        console.error('설문 데이터 가져오기 실패:', error)
        setSurvey(null)
      } finally {
        setLoading(false)
      }
    }

    loadSurvey()
  }, [surveyId])

  const handleCopyLink = async () => {
    if (!survey) return
    
    const baseUrl = window.location.origin
    let surveyUrl = `${baseUrl}/forms/${survey.id}`
    
    // URL 파라미터가 설정되어 있다면 해당 파라미터를 포함한 URL 생성
    if (survey.allow_url_param && survey.url_param_name) {
      surveyUrl += `?${survey.url_param_name}=`
    }
    
    try {
      await navigator.clipboard.writeText(surveyUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
      // 폴백: 텍스트 영역을 생성하여 복사
      const textArea = document.createElement('textarea')
      textArea.value = surveyUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">설문을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-6 sm:px-6 lg:px-8 space-y-6 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">설문 상세</h1>
          <p className="mt-1 text-sm text-gray-500">
            설문조사 정보를 확인하세요.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">기본 정보</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 링크
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-sm">
                    {(() => {
                      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                      let url = `${baseUrl}/forms/${survey.id}`
                      if (survey.allow_url_param && survey.url_param_name) {
                        url += `?${survey.url_param_name}=`
                      }
                      return url
                    })()}
                  </div>
                  <button
                    onClick={() => handleCopyLink()}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      copySuccess
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copySuccess ? (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>복사됨</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>링크 복사</span>
                      </div>
                    )}
                  </button>
                </div>
                
                {survey.allow_url_param && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">URL 파라미터 사용 예시:</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 font-mono text-xs">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${survey.id}?${survey.url_param_name || 'id'}=`}
                      </div>
                      <button
                        onClick={() => {
                          const paramUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${survey.id}?${survey.url_param_name || 'id'}=`
                          navigator.clipboard.writeText(paramUrl)
                          setCopySuccess(true)
                          setTimeout(() => setCopySuccess(false), 2000)
                        }}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-xs font-medium transition-colors"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 ID
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                {survey.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 제목
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                {survey.title}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설문 설명
              </label>
              <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 min-h-[80px]">
                {survey.description || '설명 없음'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작성자
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {survey.creator?.display_name || survey.creator?.username || '알 수 없음'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  작성일
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {formatDate(survey.created_at || '')}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수정자
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {survey.updater?.display_name || survey.updater?.username || '수정 없음'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  수정일
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {formatDate(survey.updated_at || '')}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 시간
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {survey.opens_at ? new Date(survey.opens_at).toLocaleString('ko-KR', { timeZone: 'UTC' }) : '설정 없음'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 시간
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {survey.closes_at ? new Date(survey.closes_at).toLocaleString('ko-KR', { timeZone: 'UTC' }) : '설정 없음'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상태
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {survey.is_active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 응답자 식별 설정 섹션 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">응답자 식별 설정</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  중복 응답 허용
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.allow_duplicate_responses
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}>
                    {survey.allow_duplicate_responses ? '허용' : '불가'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  익명 허용 여부
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.allow_anonymous
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                    }`}>
                    {survey.allow_anonymous ? '허용' : '불가'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 입력 필수
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.email_required
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {survey.email_required ? '필수' : '선택'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 응답 조회 허용
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.allow_email_response_view
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {survey.allow_email_response_view ? '허용' : '불가'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL 파라미터 허용
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${survey.allow_url_param
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {survey.allow_url_param ? '허용' : '불가'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL 파라미터 이름
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  {survey.url_param_name || 'id'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <QuestionListView questions={survey.questions} />
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">JSON 데이터</h2>
          </div>
          <div className="px-6 py-4">
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
              {JSON.stringify(survey, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <Link
                href="/admin/forms"
                className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                목록으로
              </Link>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/forms/${survey.id}/preview`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Preview
              </Link>
              <Link
                href={`/admin/forms/${survey.id}/edit`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
              >
                수정
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 