/**
 * 圖片檔名到用途描述的映射工具
 * 用於 Phase 4 提示詞生成時自動識別圖片用途
 */

import { ContentItem } from '../types';
import { generateImageFileName, parseImageFileName, generateFileNameMap } from './imageNaming';

/**
 * 圖片關鍵字到用途描述的映射
 */
const KEYWORD_TO_DESCRIPTION: Record<string, string> = {
  'product': '產品主圖（白底商品圖）',
  'lifestyle': '產品情境圖（生活場景）',
  'hook': '封面圖（吸引注意的開場圖）',
  'problem': '痛點圖（消費者困擾情境）',
  'solution': '解決方案圖（產品如何解決問題）',
  'features': '功能特色圖（產品細節與特點）',
  'trust': '信任背書圖（證言、數據、認證）',
  'cta': '行動呼籲圖（購買按鈕、促銷資訊）',
  'testimonial': '客戶見證圖',
  'scene': '使用場景圖',
};

/**
 * 圖片類型到用途描述的映射
 */
const TYPE_TO_DESCRIPTION: Record<string, string> = {
  'main-white': '產品主圖（白底商品圖）',
  'main-lifestyle': '產品情境圖（生活場景）',
  'story': '故事圖（銷售漏斗中的一頁）',
};

/**
 * 獲取圖片的用途描述
 */
export const getImageDescription = (filename: string, item?: ContentItem): string => {
  const parsed = parseImageFileName(filename);
  
  if (!parsed) {
    return '產品圖片';
  }
  
  // 優先使用關鍵字映射
  if (KEYWORD_TO_DESCRIPTION[parsed.keyword]) {
    return KEYWORD_TO_DESCRIPTION[parsed.keyword];
  }
  
  // 其次使用類型映射
  if (TYPE_TO_DESCRIPTION[parsed.type]) {
    return TYPE_TO_DESCRIPTION[parsed.type];
  }
  
  // 如果有 item 資訊，使用 item 的描述
  if (item) {
    return item.visual_summary_zh || item.title_zh || '產品圖片';
  }
  
  return '產品圖片';
};

/**
 * 生成圖片檔名到描述的映射表
 * 返回格式：Map<filename, description>
 */
export const generateImageDescriptionMap = (
  items: ContentItem[],
  generatedImageIds: Set<string>
): Map<string, string> => {
  const map = new Map<string, string>();
  
  items.forEach((item, index) => {
    // 只包含已生成的圖片
    if (generatedImageIds.has(item.id)) {
      const filename = generateImageFileName(item, index);
      const description = getImageDescription(filename, item);
      map.set(filename, description);
    }
  });
  
  return map;
};

/**
 * 將圖片映射格式化為文字描述（用於 AI 提示詞）
 */
export const formatImageMappingForPrompt = (
  imageFileNames: Map<string, string>,
  imageDescriptions: Map<string, string>
): string => {
  if (imageFileNames.size === 0) {
    return '';
  }
  
  const lines: string[] = [
    '以下是在 Phase 2 中已生成的圖片檔名及其用途：',
    ''
  ];
  
  imageFileNames.forEach((filename, itemId) => {
    const description = imageDescriptions.get(filename) || '產品圖片';
    lines.push(`- ${filename}: ${description}`);
  });
  
  lines.push('');
  lines.push('在生成網頁提示詞時，請根據內容主題選擇合適的圖片，並在提示詞中明確指定圖片檔名。');
  lines.push('例如：使用 "main-white_1x1_01_product.png" 作為產品主圖，使用 "story-hook_9x16_03_hook.png" 作為封面圖。');
  
  return lines.join('\n');
};

