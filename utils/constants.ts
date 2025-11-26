/**
 * 應用程式常數定義
 */

// 顏色系統
export const COLORS = {
  primary: '#9333ea',      // purple-600
  secondary: '#2563eb',     // blue-600
  background: '#15151a',
  backgroundSecondary: '#1a1a1f',
  backgroundTertiary: '#1e1e24',
  border: 'rgba(255, 255, 255, 0.1)',
  text: {
    primary: '#ffffff',
    secondary: '#e5e7eb',
    tertiary: '#9ca3af',
    muted: '#6b7280',
  },
  error: {
    background: 'rgba(127, 29, 29, 0.2)',
    border: 'rgba(239, 68, 68, 0.5)',
    text: '#fca5a5',
  },
} as const;

// API 配置
export const API_CONFIG = {
  MAX_RETRIES: 3,
  PRO_IMAGE_MAX_RETRIES: 5,
  INITIAL_DELAY: 2000,
  PRO_IMAGE_INITIAL_DELAY: 5000,
  RETRY_FACTOR: 2,
  THINKING_BUDGET: 1024,
} as const;

// 檔案限制
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE_MB: 10,
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;

// 輸入限制
export const INPUT_LIMITS = {
  PRODUCT_NAME_MAX: 100,
  BRAND_CONTEXT_MAX: 5000,
  REF_COPY_MAX: 10000,
} as const;

// 快取配置
export const CACHE_CONFIG = {
  IMAGE_CACHE_PREFIX: 'pm_designer_image_',
  IMAGE_CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

// 圖片比例
export const ASPECT_RATIOS = {
  SQUARE: '1:1' as const,
  PORTRAIT: '9:16' as const,
  LANDSCAPE: '16:9' as const,
  PORTRAIT_ALT: '3:4' as const,
  LANDSCAPE_ALT: '4:3' as const,
} as const;


