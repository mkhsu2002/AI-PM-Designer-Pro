/**
 * 使用 Zod 進行執行時型別驗證
 */
import { z } from 'zod';
import { ProductAnalysis, MarketingRoute, DirectorOutput, ContentItem, ContentPlan, MarketAnalysis, ContentStrategy } from '../types';
import { AppError, ErrorType } from './errorHandler';

// ProductAnalysis Schema - 使用更寬鬆的驗證
export const ProductAnalysisSchema = z.object({
  name: z.string().min(1, '產品名稱不能為空'),
  visual_description: z.string().min(5, '視覺描述至少需要 5 個字元'), // 降低要求
  key_features_zh: z.string().min(5, '核心賣點至少需要 5 個字元'), // 降低要求
});

// PromptData Schema - 使用更寬鬆的驗證
export const PromptDataSchema = z.object({
  prompt_en: z.string().min(20, '提示詞至少需要 20 個字元'), // 降低要求
  summary_zh: z.string().optional().default(''), // 允許省略或空字串
});

// MarketingRoute Schema - 使用更寬鬆的驗證
export const MarketingRouteSchema = z.object({
  route_name: z.string().min(1).max(50), // 放寬長度限制
  headline_zh: z.string().min(1).max(100), // 放寬長度限制
  subhead_zh: z.string().min(1).max(200), // 放寬長度限制
  style_brief_zh: z.string().min(5), // 降低要求
  target_audience_zh: z.string().optional(),
  visual_elements_zh: z.string().optional(),
  image_prompts: z.array(PromptDataSchema).min(1).max(10), // 允許 1-10 個，不強制恰好 3 個
});

// DirectorOutput Schema - 使用更寬鬆的驗證
export const DirectorOutputSchema = z.object({
  product_analysis: ProductAnalysisSchema,
  marketing_routes: z.array(MarketingRouteSchema).min(1).max(10), // 允許 1-10 條路線
});

// ContentItem Schema - 使用更寬鬆的驗證
export const ContentItemSchema = z.object({
  id: z.string().min(1), // 放寬 ID 格式要求，只要非空即可
  type: z.enum(['main_white', 'main_lifestyle', 'story_slide']),
  ratio: z.enum(['1:1', '9:16', '16:9']),
  title_zh: z.string().min(1).max(100), // 放寬長度限制
  copy_zh: z.string().min(1).max(500), // 放寬長度限制
  visual_prompt_en: z.string().min(20).max(1000), // 放寬長度限制
  visual_summary_zh: z.string().min(1).max(200).optional().default(''), // 允許空字串或省略
});

// ContentPlan Schema - 使用更寬鬆的驗證
export const ContentPlanSchema = z.object({
  plan_name: z.string().min(1).max(200), // 放寬長度限制
  items: z.array(ContentItemSchema).min(1).max(20), // 允許 1-20 個項目，不強制恰好 8 個
});

/**
 * 驗證並解析 DirectorOutput
 * 使用 safeParse 並嘗試修復常見問題
 */
export const validateDirectorOutput = (data: unknown): DirectorOutput => {
  // 先嘗試直接解析
  const result = DirectorOutputSchema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  // 如果失敗，嘗試修復常見問題
  if (typeof data === 'object' && data !== null) {
    const fixed = { ...data } as Record<string, unknown>;
    
    // 確保 marketing_routes 是陣列
    if (!Array.isArray(fixed.marketing_routes)) {
      fixed.marketing_routes = [];
    }
    
    // 確保每個 route 都有 image_prompts
    if (Array.isArray(fixed.marketing_routes)) {
      fixed.marketing_routes = fixed.marketing_routes.map((route: unknown) => {
        if (typeof route === 'object' && route !== null) {
          const routeObj = route as Record<string, unknown>;
          if (!Array.isArray(routeObj.image_prompts)) {
            routeObj.image_prompts = [];
          }
          // 確保每個 prompt 都有 summary_zh
          if (Array.isArray(routeObj.image_prompts)) {
            routeObj.image_prompts = routeObj.image_prompts.map((prompt: unknown) => {
              if (typeof prompt === 'object' && prompt !== null) {
                const promptObj = prompt as Record<string, unknown>;
                if (!promptObj.summary_zh) {
                  promptObj.summary_zh = '';
                }
                return promptObj;
              }
              return prompt;
            });
          }
          return routeObj;
        }
        return route;
      });
    }
    
    // 再次嘗試解析修復後的資料
    const retryResult = DirectorOutputSchema.safeParse(fixed);
    if (retryResult.success) {
      console.warn('驗證失敗後成功修復資料格式');
      return retryResult.data;
    }
  }
  
  // 如果還是失敗，記錄詳細錯誤並拋出
  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
  console.error('API 回應格式驗證失敗：', result.error);
  console.error('原始資料：', JSON.stringify(data, null, 2));
  throw new Error(`API 回應格式驗證失敗：\n${errors}`);
};

/**
 * 驗證並解析 ContentPlan
 * 使用 safeParse 並嘗試修復常見問題
 */
export const validateContentPlan = (data: unknown): ContentPlan => {
  // 先嘗試直接解析
  const result = ContentPlanSchema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  // 如果失敗，嘗試修復常見問題
  if (typeof data === 'object' && data !== null) {
    const fixed = { ...data } as Record<string, unknown>;
    
    // 確保 items 是陣列
    if (!Array.isArray(fixed.items)) {
      fixed.items = [];
    }
    
    // 修復每個 item 的常見問題
    if (Array.isArray(fixed.items)) {
      fixed.items = fixed.items.map((item: unknown, index: number) => {
        if (typeof item === 'object' && item !== null) {
          const itemObj = item as Record<string, unknown>;
          
          // 如果沒有 id，自動生成
          if (!itemObj.id || typeof itemObj.id !== 'string') {
            const typeMap: Record<string, string> = {
              'main_white': 'white',
              'main_lifestyle': 'lifestyle',
              'story_slide': index === 0 ? 'hook' : 
                            index === 1 ? 'problem' :
                            index === 2 ? 'solution' :
                            index === 3 ? 'features' :
                            index === 4 ? 'trust' : 'cta'
            };
            const itemType = (itemObj.type as string) || 'story_slide';
            itemObj.id = `img_${index + 1}_${typeMap[itemType] || 'item'}`;
          }
          
          // 確保 type 存在
          if (!itemObj.type || !['main_white', 'main_lifestyle', 'story_slide'].includes(itemObj.type as string)) {
            // 根據 index 推斷 type
            if (index === 0) itemObj.type = 'main_white';
            else if (index === 1) itemObj.type = 'main_lifestyle';
            else itemObj.type = 'story_slide';
          }
          
          // 確保 ratio 存在
          if (!itemObj.ratio || !['1:1', '9:16', '16:9'].includes(itemObj.ratio as string)) {
            itemObj.ratio = itemObj.type === 'story_slide' ? '9:16' : '1:1';
          }
          
          // 確保字串欄位存在且非空
          if (!itemObj.title_zh || typeof itemObj.title_zh !== 'string') {
            itemObj.title_zh = `項目 ${index + 1}`;
          }
          if (!itemObj.copy_zh || typeof itemObj.copy_zh !== 'string') {
            itemObj.copy_zh = '';
          }
          if (!itemObj.visual_prompt_en || typeof itemObj.visual_prompt_en !== 'string') {
            itemObj.visual_prompt_en = '';
          }
          if (!itemObj.visual_summary_zh || typeof itemObj.visual_summary_zh !== 'string') {
            itemObj.visual_summary_zh = '';
          }
          
          return itemObj;
        }
        return item;
      });
    }
    
    // 確保 plan_name 存在
    if (!fixed.plan_name || typeof fixed.plan_name !== 'string') {
      fixed.plan_name = '內容企劃';
    }
    
    // 再次嘗試解析修復後的資料
    const retryResult = ContentPlanSchema.safeParse(fixed);
    if (retryResult.success) {
      console.warn('內容企劃驗證失敗後成功修復資料格式');
      return retryResult.data;
    }
  }
  
  // 如果還是失敗，記錄詳細錯誤並拋出
  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
  console.error('內容企劃格式驗證失敗：', result.error);
  console.error('原始資料：', JSON.stringify(data, null, 2));
  throw new Error(`內容企劃格式驗證失敗：\n${errors}`);
};

/**
 * 驗證使用者輸入
 */
export const validateProductName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '產品名稱不能為空' };
  }
  if (name.length > 100) {
    return { valid: false, error: '產品名稱不能超過 100 個字元' };
  }
  return { valid: true };
};

export const validateBrandContext = (context: string): { valid: boolean; error?: string } => {
  if (context.length > 5000) {
    return { valid: false, error: '品牌資訊不能超過 5000 個字元' };
  }
  return { valid: true };
};

export const validateRefCopy = (copy: string): { valid: boolean; error?: string } => {
  if (copy.length > 10000) {
    return { valid: false, error: '參考文案不能超過 10000 個字元' };
  }
  return { valid: true };
};

// --- Phase 3: Market Analysis Schemas ---

const ProductCoreValueSchema = z.object({
  mainFeatures: z.array(z.string().min(5)).min(3).max(10),
  coreAdvantages: z.array(z.string().min(5)).min(3).max(10),
  painPointsSolved: z.array(z.string().min(5)).min(3).max(10),
});

const MarketPositioningSchema = z.object({
  culturalInsights: z.string().min(50).max(500),
  consumerHabits: z.string().min(50).max(500),
  languageNuances: z.string().min(20).max(300),
  searchTrends: z.array(z.string().min(1)).min(3).max(15),
});

const CompetitorSchema = z.object({
  brandName: z.string().min(1).max(100),
  marketingStrategy: z.string().min(20).max(300),
  advantages: z.array(z.string().min(5)).min(2).max(10),
  weaknesses: z.array(z.string().min(5)).min(2).max(10),
});

const BuyerPersonaSchema = z.object({
  name: z.string().min(1).max(50),
  demographics: z.string().min(20).max(300),
  interests: z.array(z.string().min(1)).min(3).max(15),
  painPoints: z.array(z.string().min(5)).min(2).max(10),
  searchKeywords: z.array(z.string().min(1)).min(3).max(15),
});

const MarketAnalysisSchema = z.object({
  productCoreValue: ProductCoreValueSchema,
  marketPositioning: MarketPositioningSchema,
  competitors: z.array(CompetitorSchema).min(2).max(5),
  buyerPersonas: z.array(BuyerPersonaSchema).min(2).max(5),
});

// --- Phase 4: Content Strategy Schemas ---

const SEOGuidanceSchema = z.object({
  keywordDensity: z.string().min(1).max(20),
  semanticKeywords: z.array(z.string().min(1)).min(3).max(15),
  internalLinks: z.array(z.string().min(1)).min(2).max(10),
  externalLinks: z.array(z.string().min(1)).min(2).max(10),
});

const ContentTopicSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(50).max(500),
  focusKeyword: z.string().min(1).max(50),
  longTailKeywords: z.array(z.string().min(1)).min(3).max(15),
  seoGuidance: SEOGuidanceSchema,
});

const InteractiveElementSchema = z.object({
  type: z.string().min(1).max(100),
  description: z.string().min(20).max(300),
});

const ContentStrategySchema = z.object({
  contentTopics: z.array(ContentTopicSchema).min(2).max(5),
  interactiveElements: z.array(InteractiveElementSchema).min(1).max(5),
  ctaSuggestions: z.array(z.string().min(3).max(50)).min(2).max(5),
  aiStudioPrompts: z.array(z.string().min(100).max(2000)).min(2).max(5),
});

/**
 * 驗證並解析 MarketAnalysis
 */
export const validateMarketAnalysis = (data: unknown): MarketAnalysis => {
  const result = MarketAnalysisSchema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  // 嘗試修復常見問題
  if (typeof data === 'object' && data !== null) {
    const fixed = { ...data } as Record<string, unknown>;
    
    // 確保陣列存在
    if (!Array.isArray(fixed.competitors)) fixed.competitors = [];
    if (!Array.isArray(fixed.buyerPersonas)) fixed.buyerPersonas = [];
    
    // 確保 productCoreValue 存在
    if (!fixed.productCoreValue || typeof fixed.productCoreValue !== 'object') {
      fixed.productCoreValue = {
        mainFeatures: [],
        coreAdvantages: [],
        painPointsSolved: [],
      };
    }
    
    // 確保 marketPositioning 存在
    if (!fixed.marketPositioning || typeof fixed.marketPositioning !== 'object') {
      fixed.marketPositioning = {
        culturalInsights: '',
        consumerHabits: '',
        languageNuances: '',
        searchTrends: [],
      };
    }
    
    const retryResult = MarketAnalysisSchema.safeParse(fixed);
    if (retryResult.success) {
      console.warn('市場分析驗證失敗後成功修復資料格式');
      return retryResult.data;
    }
  }
  
  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
  throw new AppError({
    type: ErrorType.VALIDATION,
    message: `市場分析格式驗證失敗：\n${errors}`,
    userMessage: "市場分析格式不正確，請再試一次。如問題持續發生，請聯繫技術支援。",
    originalError: result.error,
  });
};

/**
 * 驗證並解析 ContentStrategy
 */
export const validateContentStrategy = (data: unknown): ContentStrategy => {
  const result = ContentStrategySchema.safeParse(data);
  
  if (result.success) {
    return result.data;
  }
  
  // 嘗試修復常見問題
  if (typeof data === 'object' && data !== null) {
    const fixed = { ...data } as Record<string, unknown>;
    
    // 確保陣列存在
    if (!Array.isArray(fixed.contentTopics)) fixed.contentTopics = [];
    if (!Array.isArray(fixed.interactiveElements)) fixed.interactiveElements = [];
    if (!Array.isArray(fixed.ctaSuggestions)) fixed.ctaSuggestions = [];
    if (!Array.isArray(fixed.aiStudioPrompts)) fixed.aiStudioPrompts = [];
    
    const retryResult = ContentStrategySchema.safeParse(fixed);
    if (retryResult.success) {
      console.warn('內容策略驗證失敗後成功修復資料格式');
      return retryResult.data;
    }
  }
  
  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
  throw new AppError({
    type: ErrorType.VALIDATION,
    message: `內容策略格式驗證失敗：\n${errors}`,
    userMessage: "內容策略格式不正確，請再試一次。如問題持續發生，請聯繫技術支援。",
    originalError: result.error,
  });
};

