/**
 * 語言模式管理
 */

export enum LanguageMode {
  ZH_TW = 'zh-TW', // 繁體中文
  EN = 'en', // 英文（開發中）
}

export interface LanguageConfig {
  mode: LanguageMode;
  isEnglishModeEnabled: boolean; // 是否啟用英文模式（目前為開發中）
}

/**
 * 取得當前語言模式
 */
export const getLanguageMode = (): LanguageMode => {
  const stored = localStorage.getItem('pm_designer_language_mode');
  if (stored === LanguageMode.EN) {
    return LanguageMode.EN;
  }
  return LanguageMode.ZH_TW; // 預設繁體中文
};

/**
 * 設定語言模式
 */
export const setLanguageMode = (mode: LanguageMode): void => {
  localStorage.setItem('pm_designer_language_mode', mode);
};

/**
 * 檢查是否為中文模式
 */
export const isChineseMode = (): boolean => {
  return getLanguageMode() === LanguageMode.ZH_TW;
};

/**
 * 檢查是否為英文模式
 */
export const isEnglishMode = (): boolean => {
  return getLanguageMode() === LanguageMode.EN;
};

/**
 * 從品牌資訊中提取英文元素
 */
export const extractEnglishElements = (brandContext: string): {
  hasEnglishSlogan: boolean;
  hasEnglishBrandName: boolean;
  englishSlogans: string[];
  englishBrandNames: string[];
} => {
  const result = {
    hasEnglishSlogan: false,
    hasEnglishBrandName: false,
    englishSlogans: [] as string[],
    englishBrandNames: [] as string[],
  };

  if (!brandContext || brandContext.trim().length === 0) {
    return result;
  }

  // 簡單的英文檢測：包含英文單字（至少 2 個字母）
  const englishWordPattern = /\b[A-Za-z]{2,}\b/g;
  const englishWords = brandContext.match(englishWordPattern) || [];

  // 檢測可能的 slogan（通常是大寫或首字母大寫的短句）
  const sloganPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,5})\b/g;
  const slogans = brandContext.match(sloganPattern) || [];
  
  // 檢測品牌名稱（通常在產品名稱或品牌介紹開頭）
  const brandNamePattern = /(?:品牌|Brand|品牌名稱|Brand Name)[:：]\s*([A-Z][a-zA-Z\s]+)/i;
  const brandNameMatch = brandContext.match(brandNamePattern);

  if (slogans.length > 0) {
    result.hasEnglishSlogan = true;
    result.englishSlogans = slogans;
  }

  if (brandNameMatch) {
    result.hasEnglishBrandName = true;
    result.englishBrandNames = [brandNameMatch[1]];
  }

  return result;
};

