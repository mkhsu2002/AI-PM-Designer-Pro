import { MARKET_ANALYST_SYSTEM_PROMPT, CONTENT_STRATEGIST_SYSTEM_PROMPT } from "../prompts";
import { MarketAnalysis, ContentStrategy, MarketingRoute } from "../types";
import { AppError, ErrorType, handleGeminiError } from "../utils/errorHandler";
import { validateMarketAnalysis, validateContentStrategy } from "../utils/validators";
import { retryWithBackoff, getGeminiClient, cleanJson } from "./baseService";

export const generateMarketAnalysis = async (
    productName: string,
    selectedRoute: MarketingRoute,
    productImageBase64: string
): Promise<MarketAnalysis> => {
    try {
        const ai = getGeminiClient();
        const promptText = `產品名稱: ${productName}\n選定策略: ${selectedRoute.route_name}...`;
        const parts: any[] = [{ text: promptText }];

        const match = productImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (match) parts.push({ inlineData: { data: match[2], mimeType: match[1] } });

        const response = await retryWithBackoff(async () => {
            return await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts },
                config: {
                    systemInstruction: MARKET_ANALYST_SYSTEM_PROMPT,
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingBudget: 1024 }
                }
            });
        });

        return validateMarketAnalysis(JSON.parse(cleanJson(response.text || "{}")));
    } catch (error) {
        if (error instanceof AppError) throw error;
        handleGeminiError(error);
    }
};

export const generateContentStrategy = async (
    marketAnalysis: MarketAnalysis,
    productName: string,
    selectedRoute: MarketingRoute,
    imageFileNames?: Map<string, string>,
    imageDescriptions?: Map<string, string>
): Promise<ContentStrategy> => {
    try {
        const ai = getGeminiClient();
        let imageMappingText = '';
        if (imageFileNames && imageFileNames.size > 0 && imageDescriptions) {
            imageMappingText = `\n\nPhase 2 圖片映射: ...`;
        }

        const promptText = `產品: ${productName}\n分析: ${JSON.stringify(marketAnalysis)}\n${imageMappingText}`;

        const response = await retryWithBackoff(async () => {
            return await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ text: promptText }] },
                config: {
                    systemInstruction: CONTENT_STRATEGIST_SYSTEM_PROMPT,
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingBudget: 1024 }
                }
            });
        });

        return validateContentStrategy(JSON.parse(cleanJson(response.text || "{}")));
    } catch (error) {
        if (error instanceof AppError) throw error;
        handleGeminiError(error);
    }
};
