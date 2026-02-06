import { GoogleGenAI } from "@google/genai";
import { AppError, ErrorType } from "../utils/errorHandler";

export const getApiKey = (): string => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) return storedKey;

    if (process.env.API_KEY) return process.env.API_KEY;

    throw new AppError({
        type: ErrorType.AUTH,
        message: "找不到 API 金鑰",
        userMessage: "找不到 API 金鑰。請在設定中輸入您的 Gemini API Key。",
    });
};

export const cleanJson = (text: string): string => {
    let clean = text.trim();
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json/, "").replace(/```$/, "");
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```/, "").replace(/```$/, "");
    }
    return clean.trim();
};

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const serializeError = (error: unknown): string => {
    try {
        if (typeof error === 'string') return error;
        if (error instanceof Error) {
            return JSON.stringify({
                name: error.name,
                message: error.message,
                stack: error.stack,
            }, null, 2);
        }
        return JSON.stringify(error, null, 2);
    } catch (e) {
        return String(error);
    }
};

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
            if (attempt > retries) throw error;

            const errorStr = serializeError(error);
            let status = 0;
            if (error.status) status = Number(error.status);
            else if (error.code) status = Number(error.code);

            const isRateLimit = status === 429 || errorStr.includes("RESOURCE_EXHAUSTED");
            const isServerBusy = status === 503 || errorStr.includes("Overloaded");
            const isFetchError = errorStr.includes("fetch") || errorStr.includes("network");

            if (isRateLimit || isServerBusy || isFetchError) {
                await wait(currentDelay);
                currentDelay *= factor;
            } else {
                throw error;
            }
        }
    }
    throw new Error("Unexpected retry loop exit");
}

export const getGeminiClient = () => {
    return new GoogleGenAI({ apiKey: getApiKey() });
};
