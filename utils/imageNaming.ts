/**
 * 圖片命名規則工具
 * 生成英文關鍵字檔名，方便網頁建置自動化程序識別
 */

import { ContentItem } from '../types';

/**
 * 從中文標題或摘要中提取英文關鍵字
 * 如果無法提取，則根據類型和使用場景推斷
 */
const extractKeyword = (item: ContentItem, index: number): string => {
  // 嘗試從 visual_summary_zh 或 title_zh 中提取關鍵字
  const text = `${item.visual_summary_zh} ${item.title_zh}`.toLowerCase();
  
  // 常見關鍵字映射
  const keywordMap: Record<string, string> = {
    'hook': 'hook',
    '開場': 'hook',
    '問題': 'problem',
    'problem': 'problem',
    '解決': 'solution',
    'solution': 'solution',
    '功能': 'features',
    'feature': 'features',
    '特色': 'features',
    '信任': 'trust',
    'trust': 'trust',
    '見證': 'testimonial',
    'testimonial': 'testimonial',
    '行動': 'cta',
    'cta': 'cta',
    '呼籲': 'cta',
    '產品': 'product',
    'product': 'product',
    '生活': 'lifestyle',
    'lifestyle': 'lifestyle',
    '場景': 'scene',
    'scene': 'scene',
  };
  
  // 搜尋關鍵字
  for (const [key, value] of Object.entries(keywordMap)) {
    if (text.includes(key)) {
      return value;
    }
  }
  
  // 如果無法從文字提取，根據類型推斷
  if (item.type === 'main_white') {
    return 'product';
  }
  
  if (item.type === 'main_lifestyle') {
    return 'lifestyle';
  }
  
  // story_slide 根據位置推斷
  if (item.type === 'story_slide') {
    const storyKeywords = ['hook', 'problem', 'solution', 'features', 'trust', 'cta'];
    // 假設 story slides 按照標準順序排列
    const keywordIndex = Math.min(index, storyKeywords.length - 1);
    return storyKeywords[keywordIndex];
  }
  
  // 預設使用 item id 的最後部分
  const idParts = item.id.split('_');
  return idParts[idParts.length - 1] || 'item';
};

/**
 * 將比例轉換為檔名格式
 */
const formatRatio = (ratio: string): string => {
  return ratio.replace(':', 'x');
};

/**
 * 將類型轉換為檔名格式
 */
const formatType = (type: ContentItem['type']): string => {
  const typeMap: Record<ContentItem['type'], string> = {
    'main_white': 'main-white',
    'main_lifestyle': 'main-lifestyle',
    'story_slide': 'story',
  };
  return typeMap[type] || 'item';
};

/**
 * 生成圖片檔名
 * 格式：{type}_{ratio}_{index:02d}_{keyword}.png
 * 
 * @param item ContentItem 物件
 * @param index 在內容企劃中的索引（從 0 開始）
 * @returns 檔名（不含路徑）
 * 
 * @example
 * generateImageFileName(item, 0) // "main-white_1x1_01_product.png"
 * generateImageFileName(item, 1) // "main-lifestyle_1x1_02_lifestyle.png"
 * generateImageFileName(item, 2) // "story-hook_9x16_03_hook.png"
 */
export const generateImageFileName = (item: ContentItem, index: number): string => {
  const type = formatType(item.type);
  const ratio = formatRatio(item.ratio);
  const keyword = extractKeyword(item, index);
  const indexStr = String(index + 1).padStart(2, '0');
  
  return `${type}_${ratio}_${indexStr}_${keyword}.png`;
};

/**
 * 從檔名解析回 ContentItem 的識別資訊
 * 用於網頁生成時自動識別圖片用途
 */
export const parseImageFileName = (filename: string): {
  type: string;
  ratio: string;
  index: number;
  keyword: string;
} | null => {
  // 移除副檔名
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  
  // 解析格式：{type}_{ratio}_{index}_{keyword}
  const parts = nameWithoutExt.split('_');
  
  if (parts.length < 4) {
    return null;
  }
  
  const [type, ratio, indexStr, ...keywordParts] = parts;
  const keyword = keywordParts.join('_');
  const index = parseInt(indexStr, 10) - 1; // 轉回 0-based index
  
  if (isNaN(index)) {
    return null;
  }
  
  return {
    type,
    ratio: ratio.replace('x', ':'),
    index,
    keyword,
  };
};

/**
 * 生成檔名映射表（用於網頁生成時快速查找）
 * 返回 Map<itemId, filename>
 */
export const generateFileNameMap = (items: ContentItem[]): Map<string, string> => {
  const map = new Map<string, string>();
  
  items.forEach((item, index) => {
    map.set(item.id, generateImageFileName(item, index));
  });
  
  return map;
};

