/**
 * Gemini API 服務
 * 各 Phase 的 API 呼叫邏輯
 */

import { DIRECTOR_SYSTEM_PROMPT, CONTENT_PLANNER_SYSTEM_PROMPT, MARKET_ANALYST_SYSTEM_PROMPT, CONTENT_STRATEGIST_SYSTEM_PROMPT } from "../prompts";
import { DirectorOutput, ContentPlan, MarketingRoute, ProductAnalysis, ContentItem, MarketAnalysis, ContentStrategy } from "../types";
import { AppError, ErrorType } from "../utils/errorHandler";
import { validateDirectorOutput, validateContentPlan, validateMarketAnalysis, validateContentStrategy } from "../utils/validators";
import { extractImageColors, colorToPromptFragment } from "../utils/imageColorExtractor";
import { isChineseMode, extractEnglishElements } from "../utils/languageMode";
import { API_CONFIG } from "../utils/constants";
import { createClient, fileToGenerativePart, fileToBase64, cleanJson, retryWithBackoff, safeApiCall } from "./geminiClient";

// Re-export for backward compatibility
export { fileToBase64 } from "./geminiClient";

// --- Helper: Parse and validate API response ---

function parseAndValidate<T>(
  responseText: string | undefined,
  validator: (data: unknown) => T,
  errorContext: string,
  userErrorMessage: string
): T {
  if (!responseText) {
    throw new AppError({
      type: ErrorType.API,
      message: `${errorContext}: No response text`,
      userMessage: `${userErrorMessage}，請稍候再試。`,
    });
  }

  try {
    const cleaned = cleanJson(responseText);
    const parsed = JSON.parse(cleaned);
    console.log(`${errorContext} AI 回應原始資料：`, JSON.stringify(parsed, null, 2));
    return validator(parsed);
  } catch (e) {
    console.error(`Failed to parse or validate ${errorContext}`, responseText);
    console.error("Error details:", e);

    if (e instanceof AppError) throw e;

    const errorMessage = e instanceof Error ? e.message : String(e);
    throw new AppError({
      type: ErrorType.VALIDATION,
      message: `${errorContext} 格式錯誤: ${errorMessage}`,
      userMessage: `${userErrorMessage}格式不正確，請再試一次。如問題持續發生，請聯繫技術支援。`,
      originalError: e,
    });
  }
}

// --- Phase 1: Analyze Product Image ---

export const analyzeProductImage = async (
  file: File,
  productName: string,
  brandContext: string
): Promise<DirectorOutput> => {
  return safeApiCall(async () => {
    const ai = createClient();
    const imagePart = await fileToGenerativePart(file);

    const promptText = `
      產品名稱: ${productName || "未提供"}
      品牌/背景資訊: ${brandContext || "未提供"}
      
      請根據上述資訊與圖片，執行視覺行銷總監的分析任務。
    `;

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, { text: promptText }] },
        config: {
          systemInstruction: DIRECTOR_SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.INITIAL_DELAY);

    return parseAndValidate(response.text, validateDirectorOutput, "AI 總監分析", "AI 回應");
  });
};

// --- Phase 2: Generate Content Plan ---

export const generateContentPlan = async (
  route: MarketingRoute,
  analysis: ProductAnalysis,
  referenceCopy: string,
  brandContext?: string
): Promise<ContentPlan> => {
  return safeApiCall(async () => {
    const ai = createClient();

    const englishElements = brandContext ? extractEnglishElements(brandContext) : null;
    const languageNote = isChineseMode()
      ? (englishElements && (englishElements.hasEnglishSlogan || englishElements.hasEnglishBrandName)
        ? `注意：品牌資訊中包含英文元素（Slogan: ${englishElements.englishSlogans.join(', ') || '無'}，品牌名稱: ${englishElements.englishBrandNames.join(', ') || '無'}）。在生成文案時，可以保留這些英文元素，但其他所有文字都必須使用繁體中文。`
        : `注意：所有行銷文案都必須使用繁體中文。`)
      : '';

    const promptText = `
        選定策略路線: ${route.route_name}
        主標題: ${route.headline_zh}
        風格: ${route.style_brief_zh}
        
        產品名稱: ${analysis.name}
        產品特點: ${analysis.key_features_zh}
        
        參考文案/競品資訊: ${referenceCopy || "無 (請自行規劃最佳結構)"}
        
        ${languageNote}
        
        請生成 8 張圖的完整內容企劃 (JSON)。
      `;

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: promptText }] },
        config: {
          systemInstruction: CONTENT_PLANNER_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: API_CONFIG.THINKING_BUDGET }
        }
      });
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.INITIAL_DELAY);

    return parseAndValidate(response.text, validateContentPlan, "內容企劃", "內容企劃");
  });
};

// --- Phase 2: Generate Marketing Image ---

export const generateMarketingImage = async (
  prompt: string,
  referenceImageBase64?: string,
  aspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9' = '3:4'
): Promise<string> => {
  return safeApiCall(async () => {
    const ai = createClient();

    let enhancedPrompt = prompt;
    if (referenceImageBase64) {
      const referenceLead = 'Use the reference image for product appearance, colors, and any logo or text on the product. Compose the scene freely from the prompt below.\n\n';
      try {
        const colors = await extractImageColors(referenceImageBase64);
        const colorFragment = colorToPromptFragment(colors);
        enhancedPrompt = colorFragment
          ? `${referenceLead}${colorFragment}\n\n${prompt}`
          : `${referenceLead}${prompt}`;
      } catch (colorError) {
        console.warn('顏色提取失敗，使用原始提示詞:', colorError);
        enhancedPrompt = `${referenceLead}${prompt}`;
      }
    }

    if (isChineseMode()) {
      const hasTextRenderInstruction = /render\s+text|display\s+text|text\s+like|text\s+['"]/i.test(enhancedPrompt);
      enhancedPrompt += hasTextRenderInstruction
        ? '\n\nAll rendered text in Traditional Chinese.'
        : '\n\nRendered text: Traditional Chinese only (brand names in English if applicable).';
    }

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

    if (referenceImageBase64) {
      const match = referenceImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
      }
    }
    parts.push({ text: enhancedPrompt });

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts: parts },
        config: {
          imageConfig: { aspectRatio: aspectRatio, imageSize: "1K" }
        },
      });
    }, API_CONFIG.PRO_IMAGE_MAX_RETRIES, API_CONFIG.PRO_IMAGE_INITIAL_DELAY, API_CONFIG.RETRY_FACTOR);

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const responseParts = candidates[0].content.parts;
      for (const part of responseParts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new AppError({
      type: ErrorType.API,
      message: "未生成圖片 (No image data in response)",
      userMessage: "圖片生成失敗，請稍候再試。如問題持續發生，請檢查提示詞內容或聯繫技術支援。",
    });
  });
};

// --- Full Report Generator (kept for backward compatibility) ---

export const generateFullReport = (
  analysis: ProductAnalysis,
  routes: MarketingRoute[],
  selectedRouteIndex: number,
  contentPlan: ContentPlan,
  editedPlanItems: ContentItem[]
): string => {
  const route = routes[selectedRouteIndex];
  const date = new Date().toLocaleDateString();

  let report = `AI PM Designer PRO v1.02 - Product Marketing Strategy Report\n`;
  report += `Date: ${date}\n`;
  report += `=================================================\n\n`;

  report += `[PRODUCT ANALYSIS]\n`;
  report += `Name: ${analysis.name}\n`;
  report += `Visual Description: ${analysis.visual_description}\n`;
  report += `Key Features: ${analysis.key_features_zh}\n\n`;

  report += `[SELECTED STRATEGY: ${route.route_name}]\n`;
  report += `Headline: ${route.headline_zh}\n`;
  report += `Subhead: ${route.subhead_zh}\n`;
  report += `Style: ${route.style_brief_zh}\n\n`;

  report += `[PHASE 1: CONCEPT VISUALS]\n`;
  route.image_prompts.forEach((p, i) => {
    report += `Poster ${i + 1}:\n`;
    report += `Summary: ${p.summary_zh}\n`;
    report += `Prompt: ${p.prompt_en}\n\n`;
  });

  report += `-------------------------------------------------\n`;
  report += `[PHASE 2: CONTENT SUITE PLAN]\n`;
  report += `Plan Name: ${contentPlan.plan_name}\n\n`;

  editedPlanItems.forEach((item) => {
    report += `--- Slide: ${item.type} (${item.ratio}) ---\n`;
    report += `Title: ${item.title_zh}\n`;
    report += `Copy: ${item.copy_zh}\n`;
    report += `Visual Summary: ${item.visual_summary_zh}\n`;
    report += `PROMPT:\n${item.visual_prompt_en}\n\n`;
  });

  return report;
};

// --- Phase 3: Market Analysis ---

export const generateMarketAnalysis = async (
  productName: string,
  selectedRoute: MarketingRoute,
  productImageBase64: string
): Promise<MarketAnalysis> => {
  return safeApiCall(async () => {
    const ai = createClient();

    const promptText = `
      產品名稱: ${productName}
      
      選定的行銷策略路線:
      - 路線名稱: ${selectedRoute.route_name}
      - 主標題: ${selectedRoute.headline_zh}
      - 副標題: ${selectedRoute.subhead_zh}
      - 視覺風格: ${selectedRoute.style_brief_zh}
      - 目標客群: ${selectedRoute.target_audience_zh || '未指定'}
      - 視覺元素: ${selectedRoute.visual_elements_zh || '未指定'}
      
      請根據以上資訊生成完整的市場分析報告 (JSON)。
    `;

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: promptText }];

    const match = productImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      parts.push({ inlineData: { data: match[2], mimeType: match[1] } });
    }

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: parts },
        config: {
          systemInstruction: MARKET_ANALYST_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: API_CONFIG.THINKING_BUDGET }
        }
      });
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.INITIAL_DELAY);

    return parseAndValidate(response.text, validateMarketAnalysis, "市場分析", "市場分析");
  });
};

// --- Phase 4: Content Strategy ---

export const generateContentStrategy = async (
  marketAnalysis: MarketAnalysis,
  productName: string,
  selectedRoute: MarketingRoute,
  imageFileNames?: Map<string, string>,
  imageDescriptions?: Map<string, string>
): Promise<ContentStrategy> => {
  return safeApiCall(async () => {
    const ai = createClient();

    let imageMappingText = '';
    if (imageFileNames && imageFileNames.size > 0 && imageDescriptions) {
      const lines: string[] = ['Phase 2 已生成的圖片檔名及其用途：'];
      imageFileNames.forEach((filename, itemId) => {
        const description = imageDescriptions.get(filename) || '產品圖片';
        lines.push(`- ${filename}: ${description}`);
      });
      imageMappingText = '\n\n' + lines.join('\n') + '\n\n請在生成提示詞時，根據內容主題智能選擇合適的圖片，並在提示詞中明確指定圖片檔名。';
    }

    const promptText = `
      產品名稱: ${productName}
      
      選定的行銷策略路線:
      - 路線名稱: ${selectedRoute.route_name}
      - 主標題: ${selectedRoute.headline_zh}
      - 副標題: ${selectedRoute.subhead_zh}
      - 視覺風格: ${selectedRoute.style_brief_zh}
      
      市場分析結果:
      ${JSON.stringify(marketAnalysis, null, 2)}${imageMappingText}
      
      請根據以上市場分析結果生成專業的內容策略與 SEO 優化方案 (JSON)。
    `;

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: promptText }] },
        config: {
          systemInstruction: CONTENT_STRATEGIST_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: API_CONFIG.THINKING_BUDGET }
        }
      });
    }, API_CONFIG.MAX_RETRIES, API_CONFIG.INITIAL_DELAY);

    return parseAndValidate(response.text, validateContentStrategy, "內容策略", "內容策略");
  });
};