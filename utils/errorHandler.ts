/**
 * 錯誤處理系統
 * 提供錯誤分類與使用者友善的錯誤訊息
 */

export enum ErrorType {
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  API = 'API',
  UNKNOWN = 'UNKNOWN',
}

export interface AppErrorInfo {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: unknown;
  statusCode?: number;
  retryable?: boolean;
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly originalError?: unknown;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(info: AppErrorInfo) {
    super(info.message);
    this.name = 'AppError';
    this.type = info.type;
    this.userMessage = info.userMessage;
    this.originalError = info.originalError;
    this.statusCode = info.statusCode;
    this.retryable = info.retryable ?? false;
  }
}

/**
 * 序列化錯誤為字串（用於除錯）
 */
const serializeError = (error: unknown): string => {
  try {
    if (typeof error === 'string') return error;
    
    if (error instanceof Error) {
      const errObj: Record<string, unknown> = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      
      // 提取額外屬性
      const customProps = Object.getOwnPropertyNames(error).reduce((acc, key) => {
        if (key !== 'name' && key !== 'message' && key !== 'stack') {
          acc[key] = (error as Record<string, unknown>)[key];
        }
        return acc;
      }, {} as Record<string, unknown>);
      
      return JSON.stringify({ ...errObj, ...customProps }, null, 2);
    }

    return JSON.stringify(error, null, 2);
  } catch (e) {
    return String(error);
  }
};

/**
 * 從錯誤中提取 HTTP 狀態碼
 */
const extractStatusCode = (error: unknown): number | undefined => {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.status === 'number') return err.status;
    if (typeof err.code === 'number') return err.code;
    if (err.error && typeof err.error === 'object') {
      const innerErr = err.error as Record<string, unknown>;
      if (typeof innerErr.code === 'number') return innerErr.code;
    }
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (typeof response.status === 'number') return response.status;
    }
  }
  return undefined;
};

/**
 * 判斷是否為可重試的錯誤
 */
const isRetryableError = (error: unknown, statusCode?: number): boolean => {
  const errorStr = serializeError(error);
  
  // 網路錯誤
  if (errorStr.includes('fetch') || errorStr.includes('network') || errorStr.includes('Failed to fetch')) {
    return true;
  }
  
  // 限流錯誤 (429)
  if (statusCode === 429 || errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
    return true;
  }
  
  // 伺服器忙碌 (503)
  if (statusCode === 503 || errorStr.includes('503') || errorStr.includes('Overloaded')) {
    return true;
  }
  
  return false;
};

/**
 * 將 API 錯誤轉換為使用者友善的訊息
 */
const getUserFriendlyMessage = (type: ErrorType, statusCode?: number): string => {
  switch (type) {
    case ErrorType.NETWORK:
      return '網路連線發生問題，請檢查您的網路連線後再試一次。';
    
    case ErrorType.RATE_LIMIT:
      return 'API 請求次數已達上限，請稍候片刻後再試，或檢查您的 API 配額設定。';
    
    case ErrorType.AUTH:
      return 'API 金鑰驗證失敗，請檢查您的 Gemini API Key 是否正確，或前往設定頁面重新輸入。';
    
    case ErrorType.VALIDATION:
      return '輸入資料格式不正確，請檢查您輸入的內容後再試一次。';
    
    case ErrorType.API:
      if (statusCode === 400) {
        return '請求格式錯誤，請確認輸入的資料是否正確。';
      }
      if (statusCode === 403) {
        return '沒有權限執行此操作，請檢查您的 API Key 權限設定。';
      }
      if (statusCode === 404) {
        return '請求的資源不存在，請確認 API 端點是否正確。';
      }
      if (statusCode === 500) {
        return '伺服器發生錯誤，請稍候片刻後再試。';
      }
      return `API 發生錯誤 (狀態碼: ${statusCode || '未知'})，請稍候再試或聯繫技術支援。`;
    
    case ErrorType.UNKNOWN:
    default:
      return '發生未知錯誤，請稍候再試。如問題持續發生，請聯繫技術支援。';
  }
};

/**
 * 處理 Gemini API 錯誤
 * 將原始錯誤轉換為結構化的 AppError
 */
export const handleGeminiError = (error: unknown): never => {
  console.error('Gemini API Error Details:', error);
  
  const statusCode = extractStatusCode(error);
  const errorStr = serializeError(error);
  
  let errorType: ErrorType = ErrorType.UNKNOWN;
  
  // 判斷錯誤類型
  if (errorStr.includes('fetch') || errorStr.includes('network') || errorStr.includes('Failed to fetch')) {
    errorType = ErrorType.NETWORK;
  } else if (statusCode === 429 || errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota') || errorStr.includes('Too Many Requests')) {
    errorType = ErrorType.RATE_LIMIT;
  } else if (statusCode === 401 || statusCode === 403 || errorStr.includes('API Key') || errorStr.includes('Permission') || errorStr.includes('authentication') || errorStr.includes('unauthorized')) {
    errorType = ErrorType.AUTH;
  } else if (statusCode === 400 || errorStr.includes('validation') || errorStr.includes('invalid')) {
    errorType = ErrorType.VALIDATION;
  } else if (statusCode !== undefined) {
    errorType = ErrorType.API;
  }
  
  const retryable = isRetryableError(error, statusCode);
  const userMessage = getUserFriendlyMessage(errorType, statusCode);
  
  throw new AppError({
    type: errorType,
    message: `[${errorType}] ${errorStr}`,
    userMessage,
    originalError: error,
    statusCode,
    retryable,
  });
};

/**
 * 驗證 API Key 格式
 */
export const validateApiKey = (key: string): { valid: boolean; error?: string } => {
  if (!key || key.trim().length === 0) {
    return { valid: false, error: 'API Key 不能為空' };
  }
  
  if (key.length < 20) {
    return { valid: false, error: 'API Key 長度不足，請確認是否正確' };
  }
  
  // Gemini API Key 通常以 AIza 開頭
  if (!key.startsWith('AIza')) {
    return { valid: false, error: 'API Key 格式不正確，Gemini API Key 應以 AIza 開頭' };
  }
  
  return { valid: true };
};


