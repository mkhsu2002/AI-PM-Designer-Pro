import { GoogleGenAI } from "@google/genai";
import { DIRECTOR_SYSTEM_PROMPT, CONTENT_PLANNER_SYSTEM_PROMPT, MARKET_ANALYST_SYSTEM_PROMPT, CONTENT_STRATEGIST_SYSTEM_PROMPT } from "../prompts";
import { DirectorOutput, ContentPlan, MarketingRoute, ProductAnalysis, ContentItem, MarketAnalysis, ContentStrategy } from "../types";
import { handleGeminiError, AppError, ErrorType } from "../utils/errorHandler";
import { validateDirectorOutput, validateContentPlan, validateMarketAnalysis, validateContentStrategy } from "../utils/validators";
import { extractImageColors, colorToPromptFragment } from "../utils/imageColorExtractor";
import { isChineseMode, extractEnglishElements } from "../utils/languageMode";

// --- Helpers ---

const getApiKey = (): string => {
  // First try localStorage (for deployed app)
  const storedKey = localStorage.getItem('gemini_api_key');
  if (storedKey) return storedKey;

  // Fallback to process.env (for local dev if set)
  if (process.env.API_KEY) return process.env.API_KEY;

  throw new AppError({
    type: ErrorType.AUTH,
    message: "找不到 API 金鑰",
    userMessage: "找不到 API 金鑰。請在設定中輸入您的 Gemini API Key。",
  });
};

const cleanJson = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.replace(/^```json/, "").replace(/```$/, "");
  } else if (clean.startsWith("```")) {
    clean = clean.replace(/^```/, "").replace(/```$/, "");
  }
  return clean.trim();
};

export const fileToBase64 = async (file: File): Promise<string> => {
  // 檔案大小檢查
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
    reader.onerror = () => {
      reject(new Error('檔案讀取失敗'));
    };
    reader.readAsDataURL(file);
  });
};

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  const base64String = await fileToBase64(file);
  const base64EncodedData = base64String.split(",")[1];
  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

// --- Robust Error Serializer (保留用於重試邏輯) ---

const serializeError = (error: unknown): string => {
  try {
    if (typeof error === 'string') return error;

    if (error instanceof Error) {
      const errObj: Record<string, unknown> = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };

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

// --- Retry Logic Helper (Exponential Backoff) ---

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
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
      // 如果是最後一次嘗試，直接拋出錯誤
      if (attempt > retries) {
        console.warn(`[Gemini Retry] Exhausted all ${retries} retries. Last error:`, error);
        throw error;
      }

      // 1. 序列化錯誤以進行完整文字比對
      const errorStr = serializeError(error);

      // 2. 取得 Status Code (強制轉為 Number 以避免 "429" !== 429 的型別錯誤)
      // GoogleGenAIError 可能在 error.status, error.code, 或是 response.status
      let status = 0;
      if (error.status) status = Number(error.status);
      else if (error.code) status = Number(error.code);
      else if (error.error?.code) status = Number(error.error.code);

      // 3. 判斷特徵 (包含 Google 特有的錯誤碼與字串)
      const isRateLimit =
        status === 429 ||
        errorStr.includes("429") ||
        errorStr.includes("RESOURCE_EXHAUSTED") ||
        errorStr.includes("quota") ||
        errorStr.includes("Too Many Requests");

      const isServerBusy =
        status === 503 ||
        errorStr.includes("503") ||
        errorStr.includes("Overloaded");

      const isFetchError =
        errorStr.includes("fetch") ||
        errorStr.includes("network") ||
        errorStr.includes("Failed to fetch");

      if (isRateLimit || isServerBusy || isFetchError) {
        console.warn(`[Gemini Retry] Attempt ${attempt}/${retries} failed (Status: ${status}). Retrying in ${currentDelay}ms...`);
        console.debug(`[Gemini Retry] Error causing retry:`, errorStr);
        await wait(currentDelay);
        currentDelay *= factor;
      } else {
        // 如果是 400 (Bad Request), 401 (Auth), 403 (Permission) 等無法透過重試解決的錯誤，直接拋出
        throw error;
      }
    }
  }

  throw new Error("Unexpected retry loop exit");
}

// Error handling is now imported from utils/errorHandler

// --- API Calls ---

export const analyzeProductImage = async (
  file: File,
  productName: string,
  brandContext: string
): Promise<DirectorOutput> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const imagePart = await fileToGenerativePart(file);

    const promptText = `
      產品名稱: ${productName || "未提供"}
      品牌/背景資訊: ${brandContext || "未提供"}
      
      請根據上述資訊與圖片，執行視覺行銷總監的分析任務。
    `;

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [imagePart, { text: promptText }],
        },
        config: {
          systemInstruction: DIRECTOR_SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });
    }, 3, 2000); // Flash 模型重試 3 次

    if (!response.text) {
      throw new AppError({
        type: ErrorType.API,
        message: "Gemini 沒有回應文字",
        userMessage: "AI 服務沒有回應，請稍候再試。",
      });
    }

    try {
      const cleaned = cleanJson(response.text);
      const parsed = JSON.parse(cleaned);

      // 記錄原始回應以便除錯
      console.log('AI 回應原始資料：', JSON.stringify(parsed, null, 2));

      // 使用 Zod 驗證回應格式
      return validateDirectorOutput(parsed);
    } catch (e) {
      console.error("Failed to parse or validate JSON", response.text);
      console.error("Error details:", e);

      if (e instanceof AppError) {
        throw e;
      }

      // 提供更詳細的錯誤訊息（開發用）
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new AppError({
        type: ErrorType.VALIDATION,
        message: `AI 總監返回了無效的格式: ${errorMessage}`,
        userMessage: "AI 回應格式不正確，請再試一次。如問題持續發生，請聯繫技術支援。",
        originalError: e,
      });
    }
  } catch (error) {
    // 如果已經是 AppError，直接拋出
    if (error instanceof AppError) {
      throw error;
    }
    // 否則使用錯誤處理器轉換
    handleGeminiError(error);
  }
};

export const generateContentPlan = async (
  route: MarketingRoute,
  analysis: ProductAnalysis,
  referenceCopy: string,
  brandContext?: string
): Promise<ContentPlan> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    // 分析品牌資訊中的英文元素
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
          thinkingConfig: { thinkingBudget: 1024 }
        }
      });
    }, 3, 2000);

    if (!response.text) {
      throw new AppError({
        type: ErrorType.API,
        message: "Gemini Planning failed",
        userMessage: "內容企劃生成失敗，請稍候再試。",
      });
    }

    try {
      const cleaned = cleanJson(response.text);
      const parsed = JSON.parse(cleaned);

      // 記錄原始回應以便除錯
      console.log('內容企劃 AI 回應原始資料：', JSON.stringify(parsed, null, 2));

      // 使用 Zod 驗證回應格式
      return validateContentPlan(parsed);
    } catch (e) {
      console.error("Failed to parse or validate ContentPlan JSON", response.text);
      console.error("Error details:", e);

      if (e instanceof AppError) {
        throw e;
      }

      // 提供更詳細的錯誤訊息（開發用）
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new AppError({
        type: ErrorType.VALIDATION,
        message: `企劃生成格式錯誤: ${errorMessage}`,
        userMessage: "內容企劃格式不正確，請再試一次。如問題持續發生，請聯繫技術支援。",
        originalError: e,
      });
    }
  } catch (error) {
    // 如果已經是 AppError，直接拋出
    if (error instanceof AppError) {
      throw error;
    }
    // 否則使用錯誤處理器轉換
    handleGeminiError(error);
  }
};

export const generateMarketingImage = async (
  prompt: string,
  referenceImageBase64?: string,
  aspectRatio: '1:1' | '9:16' | '3:4' | '4:3' | '16:9' = '3:4'
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    // 優化提示詞：如果有參考圖片，提取顏色並加入提示詞，並強制產品顏色與 Logo/文字依參考圖
    let enhancedPrompt = prompt;
    if (referenceImageBase64) {
      const referenceInstructions = [
        'CRITICAL - Reference image rules (you MUST follow):',
        '1. PRODUCT COLORS: The product (e.g. body, handle, strap) must use ONLY the colors visible on the product in the reference image. Do NOT use red, crimson, or scarlet for the product unless the reference image clearly shows the product in red.',
        '2. LOGO & BRAND: Any logo, brand mark, label, or text ON the product (e.g. on strap, tag, body) must be replicated EXACTLY as in the reference image—same design, same wording, same placement. Do not invent or change logos or text.',
        '3. NO INVENTED COLORS: Do not add colors to the product that are not present in the reference image. If the reference product is silver, gray, black, or white, keep it that way—do not render it red.',
      ].join('\n');

      try {
        const colors = await extractImageColors(referenceImageBase64);
        const colorFragment = colorToPromptFragment(colors);
        if (colorFragment) {
          enhancedPrompt = `${referenceInstructions}\n\n${colorFragment}\n\n${prompt}`;
        } else {
          enhancedPrompt = `${referenceInstructions}\n\n${prompt}`;
        }
      } catch (colorError) {
        console.warn('顏色提取失敗，使用原始提示詞:', colorError);
        enhancedPrompt = `${referenceInstructions}\n\n${prompt}`;
      }
    }

    // 在中文模式下，強制確保所有文字都是繁體中文
    if (isChineseMode()) {
      // 檢查 prompt 中是否有 "Render text" 或 "Display text" 指示
      const hasTextRenderInstruction = /render\s+text|display\s+text|text\s+like|text\s+['"]/i.test(enhancedPrompt);

      // 如果沒有明確的文字渲染指示，加入強制使用繁體中文的指示
      if (!hasTextRenderInstruction) {
        enhancedPrompt = `${enhancedPrompt}\n\nIMPORTANT: If this image contains any text, marketing copy, testimonials, or call-to-action buttons, ALL text must be rendered in Traditional Chinese characters. Do NOT use English marketing text. Only brand names (like "Horizon") may appear in English if they are part of the product name.`;
      } else {
        // 即使有文字渲染指示，也加強繁體中文要求
        enhancedPrompt = `${enhancedPrompt}\n\nCRITICAL: All rendered text must be in Traditional Chinese characters. Do NOT generate English marketing copy, testimonials, or button text.`;
      }
    }

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

    // 如果有參考圖片，先添加參考圖片，然後添加文字提示詞
    // 這樣 AI 會先看到參考圖，然後根據提示詞生成
    if (referenceImageBase64) {
      const match = referenceImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            data: match[2],
            mimeType: match[1]
          }
        });
      }
    }

    // 添加文字提示詞
    parts.push({ text: enhancedPrompt });

    // 使用高品質模型 gemini-3-pro-image-preview
    // 重試策略強化：Pro Image 模型較容易觸發限流，增加重試次數至 5 次
    // 延遲策略：5s -> 10s -> 20s -> 40s -> 80s (總共可覆蓋超過 2 分鐘的等待)
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts: parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K"
          }
        },
      });
    }, 5, 5000, 2);

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
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
  } catch (error) {
    // 如果已經是 AppError，直接拋出
    if (error instanceof AppError) {
      throw error;
    }
    // 否則使用錯誤處理器轉換
    handleGeminiError(error);
  }
};

export const generateFullReport = (
  analysis: ProductAnalysis,
  routes: MarketingRoute[],
  selectedRouteIndex: number,
  contentPlan: ContentPlan,
  editedPlanItems: ContentItem[]
): string => {
  const route = routes[selectedRouteIndex];
  const date = new Date().toLocaleDateString();

  let report = `AI PM Designer PRO v1.01 - Product Marketing Strategy Report\n`;
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
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

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

    // 添加產品圖片
    const match = productImageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          data: match[2],
          mimeType: match[1]
        }
      });
    }

    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: parts },
        config: {
          systemInstruction: MARKET_ANALYST_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 1024 }
        }
      });
    }, 3, 2000);

    if (!response.text) {
      throw new AppError({
        type: ErrorType.API,
        message: "Gemini Market Analysis failed",
        userMessage: "市場分析生成失敗，請稍候再試。",
      });
    }

    try {
      const cleaned = cleanJson(response.text);
      const parsed = JSON.parse(cleaned);

      console.log('市場分析 AI 回應原始資料：', JSON.stringify(parsed, null, 2));

      return validateMarketAnalysis(parsed);
    } catch (e) {
      console.error("Failed to parse or validate MarketAnalysis JSON", response.text);
      console.error("Error details:", e);

      if (e instanceof AppError) {
        throw e;
      }

      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new AppError({
        type: ErrorType.VALIDATION,
        message: `市場分析格式錯誤: ${errorMessage}`,
        userMessage: "市場分析格式不正確，請再試一次。如問題持續發生，請聯繫技術支援。",
        originalError: e,
      });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    handleGeminiError(error);
  }
};

// --- Phase 4: Content Strategy ---

export const generateContentStrategy = async (
  marketAnalysis: MarketAnalysis,
  productName: string,
  selectedRoute: MarketingRoute,
  imageFileNames?: Map<string, string>,
  imageDescriptions?: Map<string, string>
): Promise<ContentStrategy> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    let imageMappingText = '';
    if (imageFileNames && imageFileNames.size > 0 && imageDescriptions) {
      const lines: string[] = [
        'Phase 2 已生成的圖片檔名及其用途：'
      ];
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
          thinkingConfig: { thinkingBudget: 1024 }
        }
      });
    }, 3, 2000);

    if (!response.text) {
      throw new AppError({
        type: ErrorType.API,
        message: "Gemini Content Strategy failed",
        userMessage: "內容策略生成失敗，請稍候再試。",
      });
    }

    try {
      let cleaned = cleanJson(response.text);

      // 嘗試修復常見的 JSON 格式問題
      // 1. 修復提示詞陣列中的多行字串問題
      // 使用更精確的正則表達式來匹配陣列內容
      cleaned = cleaned.replace(/("aiStudioPrompts"\s*:\s*\[)([\s\S]*?)(\])/g, (match, start, content, end) => {
        // 嘗試提取每個字串元素
        const prompts: string[] = [];
        let currentString = '';
        let inString = false;
        let escapeNext = false;
        let depth = 0;

        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          const nextChar = content[i + 1];

          if (escapeNext) {
            currentString += char;
            escapeNext = false;
            continue;
          }

          if (char === '\\') {
            escapeNext = true;
            currentString += char;
            continue;
          }

          if (char === '"' && !escapeNext) {
            if (inString) {
              // 結束字串
              prompts.push(currentString);
              currentString = '';
              inString = false;
            } else {
              // 開始字串
              inString = true;
            }
            continue;
          }

          if (inString) {
            currentString += char;
          } else if (char === '[') {
            depth++;
          } else if (char === ']') {
            depth--;
          }
        }

        // 重新構建陣列，確保每個字串都正確轉義
        const fixedPrompts = prompts.map(p => {
          // 轉義特殊字元
          const escaped = p
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `"${escaped}"`;
        }).join(',');

        return `${start}${fixedPrompts}${end}`;
      });

      // 同樣處理 gammaPrompts
      cleaned = cleaned.replace(/("gammaPrompts"\s*:\s*\[)([\s\S]*?)(\])/g, (match, start, content, end) => {
        const prompts: string[] = [];
        let currentString = '';
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < content.length; i++) {
          const char = content[i];

          if (escapeNext) {
            currentString += char;
            escapeNext = false;
            continue;
          }

          if (char === '\\') {
            escapeNext = true;
            currentString += char;
            continue;
          }

          if (char === '"' && !escapeNext) {
            if (inString) {
              prompts.push(currentString);
              currentString = '';
              inString = false;
            } else {
              inString = true;
            }
            continue;
          }

          if (inString) {
            currentString += char;
          }
        }

        const fixedPrompts = prompts.map(p => {
          const escaped = p
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `"${escaped}"`;
        }).join(',');

        return `${start}${fixedPrompts}${end}`;
      });

      const parsed = JSON.parse(cleaned);

      console.log('內容策略 AI 回應原始資料：', JSON.stringify(parsed, null, 2));

      return validateContentStrategy(parsed);
    } catch (e) {
      console.error("Failed to parse or validate ContentStrategy JSON", response.text);
      console.error("Error details:", e);

      if (e instanceof AppError) {
        throw e;
      }

      // 嘗試更簡單的修復策略：直接使用 JSON5 或手動修復
      try {
        let cleaned = response.text.trim();
        // 移除 markdown 代碼塊
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

        // 嘗試使用更寬鬆的解析方式
        // 如果解析失敗，嘗試提取並重新構建 JSON
        const parsed = JSON.parse(cleaned);
        console.warn('使用簡單修復策略成功解析 JSON');
        return validateContentStrategy(parsed);
      } catch (repairError) {
        console.error("修復策略也失敗:", repairError);
      }

      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new AppError({
        type: ErrorType.VALIDATION,
        message: `內容策略格式錯誤: ${errorMessage}`,
        userMessage: "內容策略格式不正確，請再試一次。如問題持續發生，請聯繫技術支援。",
        originalError: e,
      });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    handleGeminiError(error);
  }
};