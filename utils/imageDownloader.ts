/**
 * 批次圖片下載工具
 * 使用 JSZip 打包所有圖片並提供下載
 */

import JSZip from 'jszip';
import { ContentItem } from '../types';
import { generateImageFileName } from './imageNaming';

/**
 * 將 base64 data URL 轉換為 Blob
 */
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

/**
 * 批次下載所有圖片
 * 
 * @param images Map<itemId, base64ImageData>
 * @param items ContentItem 陣列（用於生成檔名）
 * @param zipFileName ZIP 檔名（不含副檔名）
 */
export const downloadAllImages = async (
  images: Map<string, string>,
  items: ContentItem[],
  zipFileName: string = 'marketing-assets'
): Promise<void> => {
  if (images.size === 0) {
    throw new Error('沒有可下載的圖片');
  }

  const zip = new JSZip();
  
  // 建立檔名映射表
  const fileNameMap = new Map<string, string>();
  items.forEach((item, index) => {
    fileNameMap.set(item.id, generateImageFileName(item, index));
  });

  // 將所有圖片加入 ZIP
  for (const [itemId, imageData] of images.entries()) {
    const fileName = fileNameMap.get(itemId);
    
    if (!fileName) {
      console.warn(`找不到 itemId ${itemId} 對應的檔名，跳過`);
      continue;
    }

    try {
      // 轉換 base64 為 Blob
      const blob = dataURLtoBlob(imageData);
      
      // 加入 ZIP
      zip.file(fileName, blob);
    } catch (error) {
      console.error(`處理圖片 ${itemId} 時發生錯誤:`, error);
      // 繼續處理其他圖片
    }
  }

  // 生成 ZIP 檔案並觸發下載
  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${zipFileName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('生成 ZIP 檔案時發生錯誤:', error);
    throw new Error('下載失敗，請稍候再試');
  }
};

/**
 * 下載單一圖片
 * 
 * @param imageData base64 圖片資料
 * @param fileName 檔名
 */
export const downloadSingleImage = (
  imageData: string,
  fileName: string
): void => {
  try {
    const blob = dataURLtoBlob(imageData);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下載圖片時發生錯誤:', error);
    throw new Error('下載失敗，請稍候再試');
  }
};

