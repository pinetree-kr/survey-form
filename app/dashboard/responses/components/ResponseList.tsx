'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { ResponseListProps, FormattedResponseData } from '@/app/types'

export function ResponseList({ surveys }: ResponseListProps) {
  const [expandedSurveys, setExpandedSurveys] = useState<Set<string>>(new Set())

  const toggleSurvey = (surveyId: string) => {
    const newExpanded = new Set(expandedSurveys)
    if (newExpanded.has(surveyId)) {
      newExpanded.delete(surveyId)
    } else {
      newExpanded.add(surveyId)
    }
    setExpandedSurveys(newExpanded)
  }

  const formatResponseData = (responseData: Record<string, any>): FormattedResponseData[] => {
    return Object.entries(responseData).map(([questionId, value]) => {
      let displayValue = value
      
      if (Array.isArray(value)) {
        displayValue = value.join(', ')
      } else if (typeof value === 'object' && value !== null) {
        displayValue = JSON.stringify(value, null, 2)
      }
      
      return { questionId, value: displayValue }
    })
  }

  const getTotalResponses = () => {
    return surveys.reduce((total, survey) => total + survey.responses.length, 0)
  }

  const getActiveSurveys = () => {
    return surveys.filter(survey => survey.is_active)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isDeadlinePassed = (closesAt: string | null) => {
    if (!closesAt) return false;
    return new Date() > new Date(closesAt);
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 설문</dt>
                  <dd className="text-lg font-medium text-gray-900">{surveys.length}개</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">활성 설문</dt>
                  <dd className="text-lg font-medium text-gray-900">{getActiveSurveys().length}개</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">전체 응답</dt>
                  <dd className="text-lg font-medium text-gray-900">{getTotalResponses()}개</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 설문 목록 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {surveys.map((survey) => (
            <li key={survey.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleSurvey(survey.id)}
                      className="mr-3 text-gray-400 hover:text-gray-600"
                    >
                      {expandedSurveys.has(survey.id) ? (
                        <ChevronDownIcon className="h-5 w-5" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {survey.title}
                          </h3>
                          {survey.description && (
                            <p className="mt-1 text-sm text-gray-500 truncate">
                              {survey.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            survey.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {survey.is_active ? '활성' : '비활성'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {survey.responses.length}개 응답
                          </span>
                        </div>
                      </div>
                                             <div className="mt-2 text-sm text-gray-500">
                         생성일: {formatDate(survey.created_at)}
                       </div>
                    </div>
                  </div>
                </div>

                {/* 응답 목록 (확장 시 표시) */}
                {expandedSurveys.has(survey.id) && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    {survey.responses.length === 0 ? (
                      <div className="text-center py-8">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">응답이 없습니다</h3>
                        <p className="mt-1 text-sm text-gray-500">아직 이 설문에 대한 응답이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {survey.responses.map((response) => (
                          <div key={response.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-900">
                                  응답 #{response.id.slice(-8)}
                                </span>
                                {response.email && (
                                  <span className="text-sm text-gray-500">
                                    {response.email}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                  {formatDateTime(response.completed_at || response.started_at)}
                                </span>
                                {survey.allow_response_modification && !isDeadlinePassed(survey.closes_at) && (
                                  <a
                                    href={`/forms/${survey.id}/edit/${response.id}${survey.url_param_required && response.respondent ? `?${survey.url_param_name || 'rid'}=${response.respondent}` : ''}`}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                                  >
                                    수정
                                  </a>
                                )}
                              </div>
                            </div>
                            
                                                         <div className="space-y-2">
                               {formatResponseData(response.answers as Record<string, any>).map(({ questionId, value }) => (
                                 <div key={questionId} className="text-sm">
                                   <span className="font-medium text-gray-700">문항 {questionId}:</span>
                                   <span className="ml-2 text-gray-600">{value}</span>
                                 </div>
                               ))}
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
} 