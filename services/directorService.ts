import { DIRECTOR_SYSTEM_PROMPT } from "../prompts";
import { DirectorOutput } from "../types";
import { AppError, ErrorType, handleGeminiError } from "../utils/errorHandler";
import { validateDirectorOutput } from "../utils/validators";
import { retryWithBackoff, getGeminiClient, cleanJson } from "./baseService";

export const fileToBase64 = async (file: File): Promise<string> => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        throw new Error(`檔案大小超過限制（最大 ${MAX_SIZE / 1024 / 1024}MB）`);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) resolve(reader.result as string);
            else reject(new Error('無法讀取檔案'));
        };
        reader.onerror = () => reject(new Error('檔案讀取失敗'));
        reader.readAsDataURL(file);
    });
};

const fileToGenerativePart = async (file: File) => {
    const base64String = await fileToBase64(file);
    const base64EncodedData = base64String.split(",")[1];
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
};

export const analyzeProductImage = async (
    file: File,
    productName: string,
    brandContext: string
): Promise<DirectorOutput> => {
    try {
        const ai = getGeminiClient();
        const imagePart = await fileToGenerativePart(file);

        const promptText = `
      產品名稱: ${productName || "未提供"}
      品牌/背景資訊: ${brandContext || "未提供"}
      請根據上述資訊與圖片，執行視覺行銷總監的分析任務。
    `;

        const response = await retryWithBackoff(async () => {
            return await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: {
                    parts: [imagePart, { text: promptText }],
                },
                config: {
                    systemInstruction: DIRECTOR_SYSTEM_PROMPT,
                    responseMimeType: "application/json",
                },
            });
        });

        if (!response.text) {
            throw new AppError({
                type: ErrorType.API,
                message: "Gemini 沒有回應文字",
                userMessage: "AI 服務沒有回應，請稍候再試。",
            });
        }

        const cleaned = cleanJson(response.text);
        const parsed = JSON.parse(cleaned);
        return validateDirectorOutput(parsed);
    } catch (error) {
        if (error instanceof AppError) throw error;
        handleGeminiError(error);
    }
};
