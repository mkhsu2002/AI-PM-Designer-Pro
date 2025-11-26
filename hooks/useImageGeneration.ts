/**
 * 圖片生成自訂 Hook
 * 統一處理圖片生成、快取、錯誤處理
 */

import { useState, useCallback } from 'react';
import { generateMarketingImage } from '../services/geminiService';
import { getCachedImage, setCachedImage } from '../utils/imageCache';
import { AppError } from '../utils/errorHandler';

type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3';

interface UseImageGenerationReturn {
  image: string | null;
  loading: boolean;
  error: string | null;
  generateImage: (
    prompt: string,
    aspectRatio: AspectRatio,
    refImageBase64?: string
  ) => Promise<void>;
  clearImage: () => void;
}

export const useImageGeneration = (): UseImageGenerationReturn => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(
    async (
      prompt: string,
      aspectRatio: AspectRatio,
      refImageBase64?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        // 先檢查快取
        const cached = getCachedImage(prompt, aspectRatio, refImageBase64);
        if (cached) {
          setImage(cached);
          setLoading(false);
          return;
        }

        // 從 API 生成圖片
        const imageData = await generateMarketingImage(
          prompt,
          refImageBase64,
          aspectRatio
        );

        // 儲存到快取
        setCachedImage(prompt, aspectRatio, imageData, refImageBase64);

        setImage(imageData);
      } catch (err) {
        if (err instanceof AppError) {
          setError(err.userMessage);
        } else {
          setError('圖片生成失敗，請稍候再試。');
        }
        setImage(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearImage = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return {
    image,
    loading,
    error,
    generateImage,
    clearImage,
  };
};


