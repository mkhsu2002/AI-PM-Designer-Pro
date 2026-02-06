import { CONTENT_PLANNER_SYSTEM_PROMPT } from "../prompts";
import { ContentPlan, MarketingRoute, ProductAnalysis } from "../types";
import { AppError, ErrorType, handleGeminiError } from "../utils/errorHandler";
import { validateContentPlan } from "../utils/validators";
import { extractImageColors, colorToPromptFragment } from "../utils/imageColorExtractor";
import { isChineseMode, extractEnglishElements } from "../utils/languageMode";
import { retryWithBackoff, getGeminiClient, cleanJson } from "./baseService";

export const generateContentPlan = async (
    route: MarketingRoute,
    analysis: ProductAnalysis,
    referenceCopy: string,
    brandContext?: string,
    productImageBase64?: string
): Promise<ContentPlan> => {
    try {
        const ai = getGeminiClient();
        const englishElements = brandContext ? extractEnglishElements(brandContext) : null;
        const languageNote = isChineseMode()
            ? (englishElements && (englishElements.hasEnglishSlogan || englishElements.hasEnglishBrandName)
                ? `注意：品牌資訊中包含英文元素（Slogan: ${englishElements.englishSlogans.join(', ')}，品牌名稱: ${englishElements.englishBrandNames.join(', ')}）。可保留英文元素，但其他必須使用繁體中文。`
                : `注意：所有行銷文案都必須使用繁體中文。`)
            : '';

        const promptText = `
        選定策略路線: ${route.route_name}
        主標題: ${route.headline_zh}
        風格: ${route.style_brief_zh}
        產品名稱: ${analysis.name}
        產品特點: ${analysis.key_features_zh}
        參考文案/競品資訊: ${referenceCopy || "無"}
        ${languageNote}
        請生成 8 張圖的完整內容企劃 (JSON)。
      `;

        const parts: any[] = [{ text: promptText }];
        if (productImageBase64) {
            const match = productImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (match) parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
        }

        const response = await retryWithBackoff(async () => {
            return await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts },
                config: {
                    systemInstruction: CONTENT_PLANNER_SYSTEM_PROMPT,
                    responseMimeType: "application/json",
                    thinkingConfig: { thinkingBudget: 1024 }
                }
            });
        });

        if (!response.text) throw new AppError({ type: ErrorType.API, message: "Gemini Planning failed", userMessage: "生成規劃時發生錯誤，請稍後再試。" });

        const cleaned = cleanJson(response.text);
        return validateContentPlan(JSON.parse(cleaned));
    } catch (error) {
        if (error instanceof AppError) throw error;
        handleGeminiError(error);
    }
};

export const generateMarketingImage = async (
    prompt: string,
    referenceImageBase64?: string,
    aspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9' = '3:4'
): Promise<string> => {
    try {
        const ai = getGeminiClient();
        let enhancedPrompt = prompt;

        if (referenceImageBase64) {
            try {
                const colors = await extractImageColors(referenceImageBase64);
                const colorFragment = colorToPromptFragment(colors);
                if (colorFragment) enhancedPrompt = `${colorFragment}\n\n${prompt}`;
                enhancedPrompt = `IMPORTANT: Use provided reference image as a style guide...\n\n${enhancedPrompt}`;
            } catch (e) { console.warn('Color extraction failed', e); }
        }

        if (isChineseMode()) {
            enhancedPrompt += "\n\nCRITICAL: All rendered text must be in Traditional Chinese characters.";
        }

        const parts: any[] = [];
        if (referenceImageBase64) {
            const match = referenceImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (match) parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
        }
        parts.push({ text: enhancedPrompt });

        const response = await retryWithBackoff(async () => {
            return await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: { parts },
                config: { imageConfig: { aspectRatio, imageSize: "1K" } },
            });
        }, 5, 5000);

        const part = response.candidates?.[0]?.content.parts.find(p => p.inlineData?.data);
        if (part?.inlineData) return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;

        throw new AppError({ type: ErrorType.API, message: "No image data", userMessage: "無法生成圖片資料，請稍後再試。" });
    } catch (error) {
        if (error instanceof AppError) throw error;
        handleGeminiError(error);
    }
};
