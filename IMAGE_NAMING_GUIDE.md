# 圖片命名規則說明

## 📋 命名格式

所有圖片檔名採用以下格式：

```
{type}_{ratio}_{index:02d}_{keyword}.png
```

### 格式說明

- **type**: 圖片類型
  - `main-white`: 主圖（白底）
  - `main-lifestyle`: 主圖（生活場景）
  - `story`: 故事圖（內容介紹組圖）

- **ratio**: 圖片比例（使用 `x` 代替 `:`）
  - `1x1`: 1:1 方形
  - `9x16`: 9:16 直式
  - `16x9`: 16:9 橫式

- **index**: 在內容企劃中的順序（從 01 開始，兩位數補零）

- **keyword**: 英文關鍵字（根據內容自動識別）
  - `product`: 產品圖
  - `lifestyle`: 生活場景
  - `hook`: 開場/吸引注意
  - `problem`: 問題描述
  - `solution`: 解決方案
  - `features`: 功能特色
  - `trust`: 信任/見證
  - `cta`: 行動呼籲

## 📝 命名範例

```
main-white_1x1_01_product.png
main-lifestyle_1x1_02_lifestyle.png
story-hook_9x16_03_hook.png
story-problem_9x16_04_problem.png
story-solution_9x16_05_solution.png
story-features_9x16_06_features.png
story-trust_9x16_07_trust.png
story-cta_9x16_08_cta.png
```

## 🎯 使用場景

### 1. 批次下載
- 點擊「下載所有圖片」按鈕
- 所有圖片會打包成 ZIP 檔案
- ZIP 檔名使用企劃名稱（清理特殊字元後）
- 每個圖片使用上述命名規則

### 2. 單張下載
- 點擊單張圖片的下載按鈕
- 使用相同的命名規則
- 方便後續整理和識別

### 3. 網頁建置自動化
- 檔名包含所有必要資訊（類型、比例、順序、用途）
- 可以根據檔名自動識別圖片用途
- 方便程式自動化處理和排版

## 🔍 關鍵字識別邏輯

系統會自動從以下來源識別關鍵字：

1. **視覺摘要** (`visual_summary_zh`)
2. **標題** (`title_zh`)
3. **圖片類型** (`type`)
4. **位置順序** (`index`)

如果無法從文字中識別，系統會根據圖片類型和位置推斷：
- `main_white` → `product`
- `main_lifestyle` → `lifestyle`
- `story_slide` → 根據位置推斷（hook, problem, solution, features, trust, cta）

## 📦 ZIP 檔案結構

下載的 ZIP 檔案包含：

```
marketing-assets.zip
├── main-white_1x1_01_product.png
├── main-lifestyle_1x1_02_lifestyle.png
├── story-hook_9x16_03_hook.png
├── story-problem_9x16_04_problem.png
├── story-solution_9x16_05_solution.png
├── story-features_9x16_06_features.png
├── story-trust_9x16_07_trust.png
└── story-cta_9x16_08_cta.png
```

## 🛠 技術實作

### 命名規則函數

```typescript
import { generateImageFileName } from './utils/imageNaming';

const fileName = generateImageFileName(item, index);
// 輸出: "main-white_1x1_01_product.png"
```

### 解析檔名

```typescript
import { parseImageFileName } from './utils/imageNaming';

const info = parseImageFileName("main-white_1x1_01_product.png");
// 輸出: { type: "main-white", ratio: "1:1", index: 0, keyword: "product" }
```

## 💡 注意事項

1. **檔名唯一性**: 每個圖片都有唯一的檔名，不會重複
2. **英文關鍵字**: 所有關鍵字使用英文，方便跨平台使用
3. **順序編號**: 使用兩位數編號（01, 02, ...），確保排序正確
4. **比例標示**: 比例使用 `x` 代替 `:`，避免檔案系統問題

