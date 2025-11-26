/**
 * 圖片上傳自訂 Hook
 * 統一處理圖片上傳、驗證、Base64 轉換
 */

import { useState, useCallback } from 'react';
import { fileToBase64 } from '../services/geminiService';
import { FILE_LIMITS } from '../utils/constants';
import { AppError, ErrorType } from '../utils/errorHandler';

interface UseImageUploadReturn {
  image: string | null;
  loading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<void>;
  clearImage: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // 驗證檔案類型
      if (!FILE_LIMITS.ACCEPTED_TYPES.includes(file.type)) {
        throw new AppError({
          type: ErrorType.VALIDATION,
          message: '不支援的檔案類型',
          userMessage: `不支援的檔案類型。請上傳 JPG、PNG 或 WebP 格式的圖片。`,
        });
      }

      // 驗證檔案大小
      if (file.size > FILE_LIMITS.MAX_IMAGE_SIZE) {
        throw new AppError({
          type: ErrorType.VALIDATION,
          message: '檔案大小超過限制',
          userMessage: `檔案大小超過 ${FILE_LIMITS.MAX_IMAGE_SIZE_MB}MB 限制。請壓縮圖片後再試。`,
        });
      }

      // 轉換為 Base64
      const base64 = await fileToBase64(file);
      setImage(base64);
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.userMessage);
      } else {
        setError('圖片上傳失敗，請稍候再試。');
      }
      setImage(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return {
    image,
    loading,
    error,
    uploadImage,
    clearImage,
  };
};


