/**
 * 圖片快取系統
 * 使用 localStorage 儲存已生成的圖片，避免重複 API 呼叫
 */

import { CACHE_CONFIG } from './constants';

interface CachedImage {
  data: string; // base64 data URL
  timestamp: number;
  prompt: string;
  aspectRatio: string;
  refImageHash?: string;
}

/**
 * 生成快取 key
 */
const generateCacheKey = (
  prompt: string,
  aspectRatio: string,
  refImageBase64?: string
): string => {
  // 簡單的 hash 函數
  const refHash = refImageBase64 
    ? refImageBase64.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '')
    : '';
  const combined = `${prompt}_${aspectRatio}_${refHash}`;
  
  // 使用簡單的 hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `${CACHE_CONFIG.IMAGE_CACHE_PREFIX}${Math.abs(hash).toString(36)}`;
};

/**
 * 檢查快取是否過期
 */
const isExpired = (timestamp: number): boolean => {
  return Date.now() - timestamp > CACHE_CONFIG.IMAGE_CACHE_EXPIRY;
};

/**
 * 從快取中取得圖片
 */
export const getCachedImage = (
  prompt: string,
  aspectRatio: string,
  refImageBase64?: string
): string | null => {
  try {
    const key = generateCacheKey(prompt, aspectRatio, refImageBase64);
    const cached = localStorage.getItem(key);
    
    if (!cached) return null;
    
    const imageData: CachedImage = JSON.parse(cached);
    
    // 檢查是否過期
    if (isExpired(imageData.timestamp)) {
      localStorage.removeItem(key);
      return null;
    }
    
    return imageData.data;
  } catch (error) {
    console.error('Failed to get cached image:', error);
    return null;
  }
};

/**
 * 儲存圖片到快取
 */
export const setCachedImage = (
  prompt: string,
  aspectRatio: string,
  imageData: string,
  refImageBase64?: string
): void => {
  try {
    const key = generateCacheKey(prompt, aspectRatio, refImageBase64);
    const cached: CachedImage = {
      data: imageData,
      timestamp: Date.now(),
      prompt,
      aspectRatio,
      refImageHash: refImageBase64?.substring(0, 50),
    };
    
    localStorage.setItem(key, JSON.stringify(cached));
    
    // 清理過期快取
    cleanupExpiredCache();
  } catch (error) {
    console.error('Failed to cache image:', error);
    // 如果儲存失敗（可能是空間不足），嘗試清理舊快取
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      cleanupExpiredCache();
    }
  }
};

/**
 * 清理過期的快取
 */
export const cleanupExpiredCache = (): void => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_CONFIG.IMAGE_CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    
    let cleaned = 0;
    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const imageData: CachedImage = JSON.parse(cached);
          if (isExpired(imageData.timestamp)) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      } catch (e) {
        // 如果解析失敗，直接刪除
        localStorage.removeItem(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }
  } catch (error) {
    console.error('Failed to cleanup cache:', error);
  }
};

/**
 * 清除所有圖片快取
 */
export const clearAllImageCache = (): void => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_CONFIG.IMAGE_CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keys.length} cached images`);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};

/**
 * 取得快取統計資訊
 */
export const getCacheStats = (): { count: number; totalSize: number } => {
  try {
    let count = 0;
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_CONFIG.IMAGE_CACHE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          count++;
          totalSize += new Blob([value]).size;
        }
      }
    }
    
    return { count, totalSize };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return { count: 0, totalSize: 0 };
  }
};


