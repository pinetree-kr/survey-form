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
          // setError(`${i + 1}번 문항의 ID가 없습니다. 모든 문항은 고유한 ID를 가져야 합니다.`);
          // return;
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

      // TSurvey 형태로 변환
      const surveyData: TSurvey = {
        id: parsedData.id || '',
        title: parsedData.title,
        description: parsedData.description || '',
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
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

        <div className="p-6 space-y-4">
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
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder={`{
  "title": "설문 제목",
  "description": "설문 설명",
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
          "value": "option1"
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
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>title</strong>: 설문 제목 (필수)</li>
              <li>• <strong>description</strong>: 설문 설명 (선택)</li>
              <li>• <strong>questions</strong>: 문항 배열 (필수)</li>
              <li>• 각 문항은 <strong>id</strong>, <strong>title</strong>, <strong>question_type</strong>을 포함해야 합니다</li>
              <li>• <strong>id</strong>: 각 문항의 고유 ID (필수, 비어있으면 안됨)</li>
              <li>• <strong>question_type</strong>은 "single_choice", "multiple_choice", "text", "dropdown" 중 하나여야 합니다</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
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