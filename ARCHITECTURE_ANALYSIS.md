# AI-PM-Designer-Pro 架構分析與優化建議

## 🏗️ 程式架構分析

本專案是一個基於 **React + Vite + TypeScript** 的智慧化視覺行銷工具，核心邏輯圍繞在與 Google Gemini 系列模型的深層整合。

### 1. 核心組成模組
*   **Frontend (React)**: 
    *   `App.tsx`: 應用程式主入口，管理全局狀態（AppState, Phase 1-4 數據）。
    *   `components/`: 模組化 UI 組件（例如 `ProductCard`, `PromptCard`, `ContentSuite` 等）。
    *   **註**: 目前狀態似乎直接在 `App.tsx` 中使用 `useState` 管理，未發現獨立的 Context Provider。
*   **Services (`services/geminiService.ts`)**: 
    *   封裝了與 `@google/genai` 的交互細節。
    *   支援 **Multi-Phase Workflow**:
        1.  **Phase 1 (Director)**: 圖片與品牌分析，生成 3 條視覺策略。
        2.  **Phase 2 (Content Planner)**: 基於策略生成 8 張行銷圖腳本（漏斗模型 AIDA）。
        3.  **Phase 3 (Market Analyst)**: 產品價值分析、競品分析與買家人物誌。
        4.  **Phase 4 (Content Strategist)**: SEO 關鍵字策略與 AI 生成提示詞（AI Studio/Gamma）。
*   **Prompts (`prompts.ts`)**: 
    *   核心競爭力所在，包含極其精細的 System Prompt。
    *   強制 JSON 輸出，並定義了嚴格的邏輯框架。
*   **Utilities (`utils/`)**: 
    *   `validators.ts`: 使用 Zod 確保 AI 返回的 JSON 符合預期。
    *   `errorHandler.ts`: 統一的模型錯誤處理。
    *   `imageMapping.ts`, `imageNaming.ts`: 處理複雜的圖片與內容對應關係。

### 2. 資料流向 (Data Flow)
`User Input` -> `Phase 1 (Gemini 2.5 Flash)` -> `User Choice` -> `Phase 2 (Gemini 2.5 Flash + Thinking)` -> `Phase 3 & 4`

---

## 🚀 優化建議

### 1. 程式架構優化
*   **引入全局狀態管理**: 隨著 Phase 3/4 的加入，`App.tsx` 已過於臃腫（超過 800 行）。建議引入 `React Context` 或 `Zustand` 將狀態分片管理。
*   **Service 層解耦**: 目前 `geminiService.ts` 包攬了所有 Phase 的請求邏輯，可考慮拆分為 `directorService`, `plannerService` 等小模組。
*   **自定義 Hook 抽離**: 將 API 請求與狀態更新邏輯抽離到 `usePhase1`, `usePhase2` 等 Hooks 中，增加代碼復用性與測試性。

### 2. 功能與模型優化
*   **快取機制**: 目前每次刷新頁面狀態皆會丟失，建議對 `analysisResult` 和 `contentPlan` 進行 `localStorage` 持久化。
*   **圖片生成並行處理**: Phase 2 的圖片生成目前可能存在等待時間過長的問題，可優化 UI 反饋（顯示各圖生成進度）。
*   **模型路由策略**: 
    *   目前的重試機制 (Exponential Backoff) 非常完善。
    *   可以考慮對關鍵的「Thinking」任務強制使用更高等級的模型，而對簡單的文案修飾使用 Flash 以節省配額。

### 3. AI 提示詞 (Prompts) 優化
*   **動態參數化**: 目前 System Prompt 中嵌入了許多邏輯規則，可以考慮將部分固定規則（如 JSON Schema）抽離，使用更簡潔的指令提高模型的 Token 效率。
*   **增強負向提示詞**: 在圖片生成 Prompts 中加入更多關於「文字渲染」的負向約束，減少 AI 在中文場景下生成亂碼的機率。
