import React from 'react';
import { ErrorType } from '../utils/errorHandler';
import { AppState } from '../types';

interface ErrorBannerProps {
  errorMsg: string;
  errorType: ErrorType | null;
  onReset: () => void;
}

const ERROR_TITLES: Record<ErrorType, string> = {
  [ErrorType.AUTH]: '認證錯誤',
  [ErrorType.NETWORK]: '網路錯誤',
  [ErrorType.RATE_LIMIT]: '請求限制',
  [ErrorType.VALIDATION]: '驗證錯誤',
  [ErrorType.API]: '發生錯誤',
  [ErrorType.UNKNOWN]: '發生錯誤',
};

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ errorMsg, errorType, onReset }) => {
  if (!errorMsg) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mb-8 p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-left shadow-lg overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-red-500/30 pb-2">
        <h3 className="text-red-400 font-bold flex items-center gap-2 text-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {errorType ? ERROR_TITLES[errorType] : '發生錯誤'}
        </h3>
        <button onClick={onReset} className="text-sm text-red-300 hover:text-white underline">重置並返回首頁</button>
      </div>
      <p className="text-red-200 text-sm leading-relaxed">
        {errorMsg}
      </p>
      {errorType === ErrorType.RATE_LIMIT && (
        <p className="text-red-300/70 text-xs mt-3">
          💡 提示：API 請求次數已達上限，請稍候 1-2 分鐘後再試，或檢查您的 API 配額設定。
        </p>
      )}
    </div>
  );
};
