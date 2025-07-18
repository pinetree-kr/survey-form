"use client"

import React, { useState } from 'react';
import { TSurvey } from '@/app/components';
import { toast } from 'react-toastify';

interface JsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyData: TSurvey;
}

export function JsonExportModal({ isOpen, onClose, surveyData }: JsonExportModalProps) {
  const [copied, setCopied] = useState(false);

  // ID를 제거하는 함수 (survey의 id만 제거)
  const removeIds = (data: any): any => {
    if (Array.isArray(data)) {
      return data.map(item => removeIds(item));
    }

    if (data && typeof data === 'object') {
      const newData: any = {};
      for (const [key, value] of Object.entries(data)) {
        // survey 레벨의 id만 제거하고, questions 내부의 id는 유지
        if (key === 'id' && !Array.isArray(data) && !data.questions) {
          // survey 객체의 id만 제거 (questions 배열이 없는 최상위 객체)
          continue;
        }
        newData[key] = removeIds(value);
      }
      return newData;
    }

    return data;
  };

  const handleCopy = async () => {
    try {
      // ID를 제거한 데이터로 JSON 생성
      // const dataWithoutIds = removeIds(surveyData);

      delete surveyData.id
      const jsonString = JSON.stringify(surveyData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success('JSON이 클립보드에 복사되었습니다. (ID 제거됨)');

      // 2초 후 복사 상태 초기화
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('클립보드 복사에 실패했습니다.');
      console.error('클립보드 복사 오류:', err);
    }
  };

  const handleDownload = () => {
    try {
      // ID를 제거한 데이터로 JSON 생성
      const dataWithoutIds = removeIds(surveyData);
      const jsonString = JSON.stringify(dataWithoutIds, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${surveyData.title || 'survey'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('JSON 파일이 다운로드되었습니다. (ID 제거됨)');
    } catch (err) {
      toast.error('파일 다운로드에 실패했습니다.');
      console.error('파일 다운로드 오류:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">설문 JSON Export</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              설문 제목: <span className="font-medium">{surveyData.title || '제목 없음'}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                다운로드
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? '복사됨' : '클립보드 복사'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-2">미리보기 (ID 포함)</div>
            <pre className="text-sm overflow-auto max-h-96 font-mono text-gray-800">
              {JSON.stringify(surveyData, null, 2)}
            </pre>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>참고:</strong> 클립보드 복사 및 다운로드 시 설문 ID만 제거되고, 문항 ID는 유지됩니다.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
} 