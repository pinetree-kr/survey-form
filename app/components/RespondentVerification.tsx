"use client"

import React, { useState, useCallback } from 'react';
import { TSurvey } from './types';

interface RespondentVerificationProps {
    survey: TSurvey;
    onVerificationSuccess: (respondentId: string) => void;
    initialRespondentId?: string;
}

export default function RespondentVerification({
    survey,
    onVerificationSuccess,
    initialRespondentId
}: RespondentVerificationProps) {
    const [respondentId, setRespondentId] = useState<string>(initialRespondentId || '');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string>('');

    // 이메일 유효성 검사
    const validateEmail = useCallback((email: string): string => {
        if (!email.trim()) {
            return '이메일 주소를 입력해주세요.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return '유효한 이메일 주소를 입력해주세요.';
        }
        return '';
    }, []);

    // 응답자 ID 유효성 검사
    const validateRespondentId = useCallback((id: string): string => {
        if (!id.trim()) {
            return '응답자 ID를 입력해주세요.';
        }
        if (id.trim().length < 2) {
            return '응답자 ID는 최소 2자 이상이어야 합니다.';
        }
        return '';
    }, []);

    // 화이트리스트 검증
    const checkAllowedList = useCallback((identifier: string): boolean => {
        if (!survey.allowed_list || survey.allowed_list.length === 0) {
            return true; // 화이트리스트가 없으면 모두 허용
        }
        
        // 화이트리스트에 포함되어 있는지 확인 (대소문자 구분 없이)
        return survey.allowed_list.some(allowed => 
            allowed.toLowerCase().trim() === identifier.toLowerCase().trim()
        );
    }, [survey.allowed_list]);

    // 중복 응답 확인
    const checkDuplicateResponse = useCallback(async (identifier: string): Promise<boolean> => {
        if (!survey.id || survey.allow_duplicate_responses) {
            return false; // 중복 허용이면 검사하지 않음
        }

        try {
            const response = await fetch(`/api/surveys/${survey.id}/responses/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    respondent: identifier,
                    email: survey.email_required ? identifier : undefined
                }),
            });

            if (response.ok) {
                const data = await response.json() as { 
                    isDuplicate: boolean; 
                    isNotAllowed?: boolean;
                };
                
                return data.isDuplicate || data.isNotAllowed || false;
            }
            return false;
        } catch (error) {
            console.error('중복 확인 오류:', error);
            return false;
        }
    }, [survey.id, survey.allow_duplicate_responses, survey.email_required]);

    // 검증 처리
    const handleVerification = useCallback(async () => {
        setError('');
        setIsVerifying(true);

        try {
            const identifier = respondentId.trim();

            // 1. 입력값 유효성 검사
            let validationError = '';
            if (survey.email_required) {
                validationError = validateEmail(identifier);
            } else {
                validationError = validateRespondentId(identifier);
            }

            if (validationError) {
                setError(validationError);
                return;
            }

            // 2. 화이트리스트 검증
            if (!checkAllowedList(identifier)) {
                setError('허용되지 않은 응답자입니다. 관리자에게 문의하세요.');
                return;
            }

            // 3. 중복 응답 확인
            const isDuplicate = await checkDuplicateResponse(identifier);
            if (isDuplicate) {
                setError('이미 응답하신 응답자입니다.');
                return;
            }

            // 4. 검증 성공
            onVerificationSuccess(identifier);

        } catch (error) {
            setError('검증 중 오류가 발생했습니다. 다시 시도해주세요.');
            console.error('검증 오류:', error);
        } finally {
            setIsVerifying(false);
        }
    }, [
        respondentId,
        survey.email_required,
        validateEmail,
        validateRespondentId,
        checkAllowedList,
        checkDuplicateResponse,
        onVerificationSuccess
    ]);

    // 입력값 변경 핸들러
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setRespondentId(e.target.value);
        if (error) {
            setError(''); // 입력 시 에러 초기화
        }
    }, [error]);

    // Enter 키 처리
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isVerifying) {
            handleVerification();
        }
    }, [handleVerification, isVerifying]);

    const isInputValid = respondentId.trim().length > 0 && !error;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
                    {survey.description && (
                        <p className="text-gray-600">{survey.description}</p>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4 text-center">
                            {survey.email_required ? '이메일 확인' : '응답자 확인'}
                        </h2>
                        <p className="text-gray-600 text-sm text-center mb-6">
                            {survey.email_required 
                                ? '설문을 시작하기 전에 이메일 주소를 입력해주세요.'
                                : '설문을 시작하기 전에 응답자 ID를 입력해주세요.'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {survey.email_required ? '이메일 주소' : '응답자 ID'} 
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type={survey.email_required ? 'email' : 'text'}
                            value={respondentId}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={survey.email_required ? 'example@email.com' : '응답자 ID를 입력하세요'}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                                error
                                    ? 'border-red-500 focus:ring-red-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            disabled={isVerifying}
                            autoFocus
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* 화이트리스트 안내문 */}
                    {survey.allowed_list && survey.allowed_list.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-blue-800 font-medium text-sm">안내</span>
                            </div>
                            <p className="text-blue-700 text-sm">
                                이 설문은 특정 응답자만 참여할 수 있습니다. 
                                허용되지 않은 경우 관리자에게 문의해주세요.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleVerification}
                        disabled={!isInputValid || isVerifying}
                        className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                            isInputValid && !isVerifying
                                ? 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {isVerifying ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                확인 중...
                            </div>
                        ) : (
                            '설문 시작하기'
                        )}
                    </button>
                </div>

                {/* 익명 허용 안내 */}
                {survey.allow_anonymous && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-green-800 font-medium text-sm">익명 응답 가능</span>
                            </div>
                            <p className="text-green-700 text-sm">
                                이 설문은 익명으로도 응답하실 수 있습니다.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}