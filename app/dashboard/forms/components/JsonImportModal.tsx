"use client"

import React, { useState } from 'react';
import { TSurvey } from '@/app/components';
import { v4 as uuidv4 } from 'uuid';

interface JsonImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (surveyData: TSurvey) => void;
}

export function JsonImportModal({ isOpen, onClose, onImport }: JsonImportModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    try {
      setError(null);

      if (!jsonInput.trim()) {
        setError('JSON 데이터를 입력해주세요.');
        return;
      }

      const parsedData = JSON.parse(jsonInput);

      // 기본적인 유효성 검사
      if (!parsedData.title) {
        setError('설문 제목이 필요합니다.');
        return;
      }

      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        setError('문항 배열이 필요합니다.');
        return;
      }

      // questions의 id 검증
      for (let i = 0; i < parsedData.questions.length; i++) {
        const question = parsedData.questions[i];
        if (!question.id || question.id.trim() === '') {
          question.id = uuidv4();
        }
      }

      // questions 처리: show_conditions는 is_hidden이 true일 때만 가져오기
      const processedQuestions = parsedData.questions.map((question: any) => {
        const processedQuestion = { ...question };

        // is_hidden이 true가 아닌 경우 show_conditions 제거
        if (!processedQuestion.is_hidden) {
          delete processedQuestion.show_conditions;
        }

        return processedQuestion;
      });

      // 응답자 식별 설정 유효성 검사
      const allowAnonymous = parsedData.allow_anonymous ?? true;
      const accessTokenRequired = parsedData.access_token_required ?? false;
      const emailRequired = parsedData.email_required ?? false;

      // 최소 하나의 식별 방법은 허용되어야 함
      if (!allowAnonymous && !accessTokenRequired && !emailRequired) {
        setError('최소 하나의 응답자 식별 방법을 허용해야 합니다. (allow_anonymous, access_token_required, email_required 중 하나 이상이 true여야 함)');
        return;
      }

      // URL 파라미터 설정 검증
      if (accessTokenRequired && !parsedData.access_secret_key) {
        setError('엑세스 토큰 방식을 허용하는 경우 access_secret_key을 설정해야 합니다.');
        return;
      }

      // TSurvey 형태로 변환 (새로운 필드들 포함)
      const surveyData: TSurvey = {
        id: parsedData.id || '',
        title: parsedData.title,
        description: parsedData.description || '',
        is_active: parsedData.is_active ?? true,
        allow_anonymous: allowAnonymous,
        access_token_required: accessTokenRequired,
        email_required: emailRequired,
        access_secret_key: parsedData.access_secret_key,
        allow_response_view: parsedData.allow_response_view ?? false,
        allow_response_modification: parsedData.allow_response_modification ?? false,
        allow_duplicate_responses: parsedData.allow_duplicate_responses ?? true,
        opens_at: parsedData.opens_at || null,
        closes_at: parsedData.closes_at || null,
        allowed_list: parsedData.allowed_list || null,
        questions: processedQuestions
      };

      onImport(surveyData);
      setJsonInput('');
      onClose();
    } catch (err) {
      setError('올바른 JSON 형식이 아닙니다.');
      console.error('JSON 파싱 오류:', err);
    }
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      setJsonInput(text);
    }).catch(err => {
      console.error('클립보드 읽기 오류:', err);
      setError('클립보드에서 데이터를 읽을 수 없습니다.');
    });
  };

  const handleClear = () => {
    setJsonInput('');
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">JSON에서 설문 가져오기</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1 rounded hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON 데이터 입력
            </label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={handlePaste}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                클립보드에서 붙여넣기
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                지우기
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={`{
  "title": "설문 제목",
  "description": "설문 설명",
  "is_active": true,
  "allow_anonymous": true,
  "access_token_required": false,
  "email_required": false,
  "access_secret_key": "access_secret_key",
  "allow_response_view": false,
  "allow_duplicate_responses": true,
  "opens_at": "2024-01-01T00:00:00.000Z",
  "closes_at": "2024-12-31T23:59:59.000Z",
  "questions": [
    {
      "id": "question-1",
      "title": "질문 제목",
      "description": "질문 설명",
      "question_type": "single_choice",
      "required": true,
      "options": [
        {
          "label": "옵션 1",
          "key": "option1"
        }
      ]
    }
  ]
}`}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">JSON 형식 가이드</h3>
            <div className="text-sm text-blue-800 space-y-3">
              <div>
                <h4 className="font-medium">기본 정보</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>title</strong>: 설문 제목 (필수)</li>
                  <li>• <strong>description</strong>: 설문 설명 (선택)</li>
                  <li>• <strong>is_active</strong>: 설문 활성화 여부 (기본값: true)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">응답자 식별 설정</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>allow_anonymous</strong>: 익명 응답 허용 (기본값: true)</li>
                  <li>• <strong>access_token_required</strong>: 엑세스 토큰 허용 (기본값: false)</li>
                  <li>• <strong>email_required</strong>: 이메일 입력 필수 (기본값: false)</li>
                  <li>• <strong>access_secret_key</strong>: 엑세스 토큰 키 (기본값: &#34;access_secret_key&#34;)</li>
                  <li>• <strong>allow_response_view</strong>: 이메일로 응답 조회 허용 (기본값: false)</li>
                  <li>• <strong>allow_duplicate_responses</strong>: 중복 응답 허용 (기본값: true)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">설문 시간 설정</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>opens_at</strong>: 설문 시작 시간 (UTC, ISO 8601 형식)</li>
                  <li>• <strong>closes_at</strong>: 설문 종료 시간 (UTC, ISO 8601 형식)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium">문항 정보</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <strong>questions</strong>: 문항 배열 (필수)</li>
                  <li>• 각 문항은 <strong>id</strong>, <strong>title</strong>, <strong>question_type</strong>을 포함해야 합니다</li>
                  <li>• <strong>id</strong>: 각 문항의 고유 ID (필수, 비어있으면 자동 생성)</li>
                  <li>• <strong>question_type</strong>은 &#34;single_choice&#34;, &#34;multiple_choice&#34;, &#34;text&#34;, &#34;dropdown&#34; 등</li>
                </ul>
              </div>

              <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                <strong>주의:</strong> 최소 하나의 응답자 식별 방법(allow_anonymous, access_token_required, email_required)을 허용해야 합니다.
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            가져오기
          </button>
        </div>
      </div>
    </div>
  );
} 