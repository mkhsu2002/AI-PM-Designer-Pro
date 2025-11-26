
export interface ProductAnalysis {
  name: string;
  visual_description: string;
  key_features_zh: string;
}

export interface PromptData {
  prompt_en: string;
  summary_zh: string;
}

export interface MarketingRoute {
  route_name: string;
  headline_zh: string;
  subhead_zh: string;
  style_brief_zh: string;
  target_audience_zh?: string; // 目標客群描述（新增，可選以保持向後相容）
  visual_elements_zh?: string; // 具體視覺元素（新增，可選以保持向後相容）
  image_prompts: PromptData[];
}

export interface DirectorOutput {
  product_analysis: ProductAnalysis;
  marketing_routes: MarketingRoute[];
}

// --- PRO Version Types ---

export interface ContentItem {
  id: string;
  type: 'main_white' | 'main_lifestyle' | 'story_slide';
  ratio: '1:1' | '9:16' | '16:9';
  title_zh: string;
  copy_zh: string; // 文案內容
  visual_prompt_en: string;
  visual_summary_zh: string;
}

export interface ContentPlan {
  plan_name: string;
  items: ContentItem[];
}

export enum AppState {
  IDLE,
  ANALYZING,
  RESULTS, // Phase 1 Done (Routes visible)
  PLANNING, // Phase 2 Analyzing (Generating Script)
  SUITE_READY, // Phase 2 Script Ready (Review Mode)
  ANALYZING_MARKET, // Phase 3 Analyzing (Market Analysis)
  MARKET_READY, // Phase 3 Done (Market Analysis Ready)
  ANALYZING_CONTENT, // Phase 4 Analyzing (Content Strategy)
  CONTENT_READY, // Phase 4 Done (Content Strategy Ready)
  ERROR
}

// --- Phase 3: Market Analysis Types ---

export interface ProductCoreValue {
  mainFeatures: string[];
  coreAdvantages: string[];
  painPointsSolved: string[];
}

export interface MarketPositioning {
  culturalInsights: string;
  consumerHabits: string;
  languageNuances: string;
  searchTrends: string[];
}

export interface Competitor {
  brandName: string;
  marketingStrategy: string;
  advantages: string[];
  weaknesses: string[];
}

export interface BuyerPersona {
  name: string;
  demographics: string;
  interests: string[];
  painPoints: string[];
  searchKeywords: string[];
}

export interface MarketAnalysis {
  productCoreValue: ProductCoreValue;
  marketPositioning: MarketPositioning;
  competitors: Competitor[];
  buyerPersonas: BuyerPersona[];
}

// --- Phase 4: Content Strategy Types ---

export interface ContentTopic {
  title: string;
  description: string;
  focusKeyword: string;
  longTailKeywords: string[];
  seoGuidance: {
    keywordDensity: string;
    semanticKeywords: string[];
    internalLinks: string[];
    externalLinks: string[];
  };
}

export interface InteractiveElement {
  type: string;
  description: string;
}

export interface ContentStrategy {
  contentTopics: ContentTopic[];
  interactiveElements: InteractiveElement[];
  ctaSuggestions: string[];
  aiStudioPrompts: string[]; // 每個內容主題對應一個 AI Studio 提示詞（React + Tailwind CSS）
  gammaPrompts: string[]; // 每個內容主題對應一個 Gamma.app 提示詞
}
