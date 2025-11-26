/**
 * 從參考圖片中提取顏色資訊
 * 用於優化圖片生成提示詞
 */

/**
 * 從 Base64 圖片中提取主要顏色
 * 使用 Canvas API 分析圖片像素
 */
export const extractImageColors = async (imageBase64: string): Promise<{
  dominantColors: string[]; // 主要顏色（hex）
  colorPalette: string[]; // 顏色調色板
  description: string; // 顏色描述（中文）
}> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('無法建立 Canvas 上下文'));
            return;
          }

          // 限制畫布大小以提高效能
          const maxSize = 200;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // 取得像素資料
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // 計算顏色頻率
          const colorMap = new Map<string, number>();
          const colorBuckets: Array<{ r: number; g: number; b: number; count: number }> = [];

          // 將顏色分組到桶中（簡化顏色空間）
          for (let i = 0; i < pixels.length; i += 4) {
            const r = Math.floor(pixels[i] / 32) * 32; // 量化到 32 級
            const g = Math.floor(pixels[i + 1] / 32) * 32;
            const b = Math.floor(pixels[i + 2] / 32) * 32;
            const a = pixels[i + 3];

            // 忽略透明或接近透明的像素
            if (a < 128) continue;

            const key = `${r},${g},${b}`;
            const existing = colorBuckets.find(bucket => 
              bucket.r === r && bucket.g === g && bucket.b === b
            );

            if (existing) {
              existing.count++;
            } else {
              colorBuckets.push({ r, g, b, count: 1 });
            }
          }

          // 排序並取得主要顏色
          colorBuckets.sort((a, b) => b.count - a.count);
          const topColors = colorBuckets.slice(0, 5); // 取前 5 個主要顏色

          const dominantColors = topColors.map(c => {
            const r = c.r.toString(16).padStart(2, '0');
            const g = c.g.toString(16).padStart(2, '0');
            const b = c.b.toString(16).padStart(2, '0');
            return `#${r}${g}${b}`;
          });

          // 生成顏色描述
          const colorDescriptions = topColors.map(c => {
            const hue = getColorHue(c.r, c.g, c.b);
            return describeColor(c.r, c.g, c.b, hue);
          });

          resolve({
            dominantColors,
            colorPalette: dominantColors,
            description: `主要顏色：${colorDescriptions.join('、')}`,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('圖片載入失敗'));
      };

      img.src = imageBase64;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 計算顏色的色調（Hue）
 */
const getColorHue = (r: number, g: number, b: number): number => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 0; // 無色

  let hue = 0;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
};

/**
 * 描述顏色（繁體中文）
 */
const describeColor = (r: number, g: number, b: number, hue: number): string => {
  const brightness = (r + g + b) / 3;
  const saturation = getSaturation(r, g, b);

  // 根據色調分類
  if (hue >= 0 && hue < 30) return '紅色';
  if (hue >= 30 && hue < 60) return '橙紅色';
  if (hue >= 60 && hue < 90) return '橙色';
  if (hue >= 90 && hue < 150) return '黃色';
  if (hue >= 150 && hue < 210) return '綠色';
  if (hue >= 210 && hue < 270) return '青色';
  if (hue >= 270 && hue < 330) return '藍色';
  if (hue >= 330 && hue < 360) return '紫色';

  // 根據亮度分類
  if (brightness < 50) return '深色';
  if (brightness > 200) return '淺色';

  return '中性色';
};

/**
 * 計算飽和度
 */
const getSaturation = (r: number, g: number, b: number): number => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return ((max - min) / max) * 100;
};

/**
 * 將顏色資訊轉換為英文提示詞片段
 */
export const colorToPromptFragment = (colors: {
  dominantColors: string[];
  description: string;
}): string => {
  if (colors.dominantColors.length === 0) {
    return '';
  }

  const colorList = colors.dominantColors.join(', ');
  return `Use the following color palette extracted from the reference product image: ${colorList}. Ensure the generated image prominently features these colors, especially for the product itself. The color scheme should be: ${colors.description}`;
};

