# AI Product Marketing Designer PRO v2.0

**AI Product Marketing Designer PRO** 是一個專為行銷人員與產品經理打造的智慧化視覺生產力工具。

基於 Google 最新一代的 **Gemini 2.5 Flash** (推理與視覺) 與 **Gemini 3 Pro Image** (圖像生成) 模型，它能扮演您的「AI 創意總監」與「社群內容規劃師」，從單張產品圖出發，自動拆解品牌 DNA，並生成包含廣告主圖與社群 Stories 的完整銷售漏斗素材包。

## 🚀 PRO v2.0 核心功能

### 1. 深度感知輸入 (Context-Aware Input)
*   **產品視覺分析**: 自動識別產品材質、光影與設計語言。
*   **品牌背景識別**: 支援輸入品牌官網或品牌故事，AI 會自動過濾雜訊，提取核心品牌精神與 Tone & Manner。
*   **競品/文案參考**: 可貼上參考文案或競品資訊，AI 將拆解其「說服邏輯」與「敘事結構」並應用於您的企劃中。

### 2. Phase 1: 視覺策略制定 (Strategy Director)
*   **三路並進**: AI 總監會根據產品屬性，構思三條截然不同的視覺行銷路線 (Routes)。
*   **概念預覽**: 為每條路線生成 3 張高質感的廣告海報概念圖，協助您定調視覺風格。
*   **中英雙語摘要**: 提供繁體中文的風格解說與畫面構成摘要。

### 3. Phase 2: 全套內容企劃 (Content Suite Planning)
一旦選定策略，AI 將自動規劃一套 **8 張圖的完整社群行銷素材包**：
*   **A. 方形主視覺 (Square 1:1)**:
    *   包含標準電商白底圖 (Main White) 與情境廣告圖 (Main Lifestyle)。
*   **B. 社群長圖漏斗 (Stories 9:16)**:
    *   自動規劃 6 張連貫的銷售故事：**封面 (Hook) → 痛點 (Problem) → 解法 (Solution) → 細節 (Features) → 信任 (Trust) → 行動 (CTA)**。

### 4. 專業工作流：審閱與製作 (Review & Production Workflow)
v2.0 引入了專業的廣告製作流程：
*   **腳本審閱模式 (Script Review)**: 在生成圖片前，您可以完全掌控並編輯每一張圖的文案 (Copy) 與 AI 繪圖提示詞 (Prompt)。
*   **精細化控圖 (Reference Control)**: 支援為企劃中的**每一張圖**單獨上傳參考圖片 (例如：最後一張 CTA 圖需要放上特定的 Logo，或第一張圖需要參考特定配色)。
*   **一鍵量產**: 確認無誤後，切換至製作模式即可快速生成高品質素材。

---

## 🛠 技術棧 (Tech Stack)

*   **Frontend**: React 19, TypeScript, Tailwind CSS
*   **AI Models**:
    *   **Gemini 2.5 Flash**: 負責多模態視覺分析、品牌語意理解、行銷策略規劃 (Thinking Budget Enabled)。
    *   **Gemini 3 Pro Image Preview**: 負責執行高解析度的廣告圖像生成 (支援 1:1 與 9:16 構圖)。
*   **State Management**: React Hooks
*   **Build Tool**: Create React App / Vite

---

## 🚀 部署指南 (Deployment)

本專案為純前端架構 (SPA)，無需後端伺服器，推薦部署於 **Cloudflare Pages**, **Vercel** 或 **GitHub Pages**。

### 快速部署 (Cloudflare Pages)

1.  Fork 或上傳本專案至您的 GitHub。
2.  登入 Cloudflare Dashboard > **Workers & Pages** > **Create Application** > **Connect to Git**。
3.  選擇本專案 Repository。
4.  **Build Settings**:
    *   Framework preset: `Create React App`
    *   Build command: `npm run build`
    *   Output directory: `build`
5.  點擊 **Deploy** 即可完成。

### 🔑 API Key 設定
本應用程式採用 **BYOK (Bring Your Own Key)** 模式。
使用者在瀏覽器端開啟應用時，會透過 Google AI Studio 的 `window.aistudio.openSelectKey()` 安全地請求授權，金鑰不會儲存在伺服器端，確保安全性。

---

## © License

**MIT License**

Open sourced by [FlyPig AI](https://flypigai.icareu.tw/)

Copyright (c) 2025 AI Product Marketing Designer PRO

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
