/**
 * Gemini API 客戶端
 * 統一管理 API 初始化、重試邏輯、JSON 清理等基礎功能
 */

import { GoogleGenAI } from "@google/genai";
import { AppError, ErrorType, handleGeminiError } from "../utils/errorHandler";

// --- API Key Management ---

export const getApiKey = (): string => {
  // First try localStorage (for deployed app)
  const storedKey = localStorage.getItem('gemini_api_key');
  if (storedKey) return storedKey;

  // Fallback to Vite env (for local dev)
  if (import.meta.env.VITE_API_KEY) return import.meta.env.VITE_API_KEY;

  throw new AppError({
    type: ErrorType.AUTH,
    message: "找不到 API 金鑰",
    userMessage: "找不到 API 金鑰。請在設定中輸入您的 Gemini API Key。",
  });
};

export const createClient = (): GoogleGenAI => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

// --- JSON Helpers ---

export const cleanJson = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json/, "").replace(/```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```/, "").replace(/```$/, "");
  }
  return clean.trim();
};

// --- File Helpers ---

export const fileToBase64 = async (file: File): Promise<string> => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error(`檔案大小超過限制（最大 ${MAX_SIZE / 1024 / 1024}MB）`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error('無法讀取檔案'));
      }
    };
    reader.onerror = () => reject(new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
};

export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  const base64String = await fileToBase64(file);
  const base64EncodedData = base64String.split(",")[1];
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

// --- Retry Logic (Exponential Backoff) ---

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 2000,
  factor: number = 2
): Promise<T> {
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt > retries) {
        console.warn(`[Gemini Retry] Exhausted all ${retries} retries. Last error:`, error);
        throw error;
      }

      // Use serializeError from errorHandler (no duplication)
      const errorStr = typeof error === 'string' ? error :
        (error instanceof Error ? error.message : JSON.stringify(error));

      let status = 0;
      if (error.status) status = Number(error.status);
      else if (error.code) status = Number(error.code);
      else if (error.error?.code) status = Number(error.error.code);

      const isRateLimit =
        status === 429 || errorStr.includes("429") ||
        errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota") ||
        errorStr.includes("Too Many Requests");

      const isServerBusy =
        status === 503 || errorStr.includes("503") || errorStr.includes("Overloaded");

      const isFetchError =
        errorStr.includes("fetch") || errorStr.includes("network") ||
        errorStr.includes("Failed to fetch");

      if (isRateLimit || isServerBusy || isFetchError) {
        console.warn(`[Gemini Retry] Attempt ${attempt}/${retries} failed (Status: ${status}). Retrying in ${currentDelay}ms...`);
        await wait(currentDelay);
        currentDelay *= factor;
      } else {
        throw error;
      }
    }
  }

  throw new Error("Unexpected retry loop exit");
}

// --- Safe API Call Wrapper ---

/**
 * Wraps an API call with standard error handling pattern
 */
export async function safeApiCall<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    handleGeminiError(error);
  }
}
