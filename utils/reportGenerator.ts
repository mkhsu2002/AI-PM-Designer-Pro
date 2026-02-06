import { DirectorOutput, MarketAnalysis, ContentStrategy, MarketingRoute, ProductAnalysis, ContentPlan, ContentItem } from '../types';

/**
 * 生成 Phase 1 報告
 */
export const generatePhase1Report = (
  analysis: DirectorOutput,
  selectedRouteIndex: number
): string => {
  const route = analysis.marketing_routes[selectedRouteIndex];
  const date = new Date().toLocaleDateString('zh-TW');

  let report = `AI Product Marketing Designer PRO v4.0 - Phase 1 視覺策略報告\n`;
  report += `生成日期: ${date}\n`;
  report += `=================================================\n\n`;

  report += `[產品分析]\n`;
  report += `產品名稱: ${analysis.product_analysis.name}\n`;
  report += `視覺描述: ${analysis.product_analysis.visual_description}\n`;
  report += `核心特色: ${analysis.product_analysis.key_features_zh}\n\n`;

  report += `[選定的行銷策略路線: ${route.route_name}]\n`;
  report += `主標題: ${route.headline_zh}\n`;
  report += `副標題: ${route.subhead_zh}\n`;
  report += `視覺風格: ${route.style_brief_zh}\n`;
  if (route.target_audience_zh) {
    report += `目標客群: ${route.target_audience_zh}\n`;
  }
  if (route.visual_elements_zh) {
    report += `視覺元素: ${route.visual_elements_zh}\n`;
  }
  report += `\n`;

  report += `[概念視覺提示詞]\n`;
  route.image_prompts.forEach((p, i) => {
    report += `\n--- 概念圖 ${i + 1} ---\n`;
    report += `摘要: ${p.summary_zh}\n`;
    report += `提示詞:\n${p.prompt_en}\n`;
  });

  return report;
};

/**
 * 生成 Phase 3 報告
 */
export const generatePhase3Report = (
  marketAnalysis: MarketAnalysis,
  productName: string
): string => {
  const date = new Date().toLocaleDateString('zh-TW');

  let report = `AI Product Marketing Designer PRO v4.0 - Phase 3 市場分析報告\n`;
  report += `產品名稱: ${productName}\n`;
  report += `生成日期: ${date}\n`;
  report += `=================================================\n\n`;

  report += `[產品核心價值]\n\n`;
  report += `主要特色:\n`;
  marketAnalysis.productCoreValue.mainFeatures.forEach((feature, idx) => {
    report += `${idx + 1}. ${feature}\n`;
  });
  report += `\n核心優勢:\n`;
  marketAnalysis.productCoreValue.coreAdvantages.forEach((advantage, idx) => {
    report += `${idx + 1}. ${advantage}\n`;
  });
  report += `\n解決的痛點:\n`;
  marketAnalysis.productCoreValue.painPointsSolved.forEach((painPoint, idx) => {
    report += `${idx + 1}. ${painPoint}\n`;
  });
  report += `\n`;

  report += `[目標市場定位]\n\n`;
  report += `文化洞察:\n${marketAnalysis.marketPositioning.culturalInsights}\n\n`;
  report += `消費習慣:\n${marketAnalysis.marketPositioning.consumerHabits}\n\n`;
  report += `語言特性:\n${marketAnalysis.marketPositioning.languageNuances}\n\n`;
  report += `搜尋趨勢:\n`;
  marketAnalysis.marketPositioning.searchTrends.forEach((trend, idx) => {
    report += `${idx + 1}. ${trend}\n`;
  });
  report += `\n`;

  report += `[競爭對手分析]\n\n`;
  marketAnalysis.competitors.forEach((competitor, idx) => {
    report += `--- 競爭對手 ${idx + 1}: ${competitor.brandName} ---\n`;
    report += `行銷策略: ${competitor.marketingStrategy}\n`;
    report += `優勢:\n`;
    competitor.advantages.forEach((adv, i) => {
      report += `  ${i + 1}. ${adv}\n`;
    });
    report += `劣勢:\n`;
    competitor.weaknesses.forEach((weak, i) => {
      report += `  ${i + 1}. ${weak}\n`;
    });
    report += `\n`;
  });

  report += `[潛在客戶描繪]\n\n`;
  marketAnalysis.buyerPersonas.forEach((persona, idx) => {
    report += `--- 買家人物誌 ${idx + 1}: ${persona.name} ---\n`;
    report += `基本資料: ${persona.demographics}\n`;
    report += `興趣: ${persona.interests.join(', ')}\n`;
    report += `痛點:\n`;
    persona.painPoints.forEach((pain, i) => {
      report += `  ${i + 1}. ${pain}\n`;
    });
    report += `搜尋關鍵字: ${persona.searchKeywords.join(', ')}\n`;
    report += `\n`;
  });

  return report;
};

/**
 * 生成 Phase 4 報告
 */
export const generatePhase4Report = (
  contentStrategy: ContentStrategy,
  productName: string
): string => {
  const date = new Date().toLocaleDateString('zh-TW');

  let report = `AI Product Marketing Designer PRO v4.0 - Phase 4 內容策略報告\n`;
  report += `產品名稱: ${productName}\n`;
  report += `生成日期: ${date}\n`;
  report += `=================================================\n\n`;

  report += `[內容主題]\n\n`;
  contentStrategy.contentTopics.forEach((topic, idx) => {
    report += `--- 主題 ${idx + 1}: ${topic.title} ---\n`;
    report += `描述: ${topic.description}\n`;
    report += `主要關鍵字: ${topic.focusKeyword}\n`;
    report += `長尾關鍵字: ${topic.longTailKeywords.join(', ')}\n`;
    report += `\nSEO 指導:\n`;
    report += `  關鍵字密度: ${topic.seoGuidance.keywordDensity}\n`;
    report += `  語意關鍵字: ${topic.seoGuidance.semanticKeywords.join(', ')}\n`;
    report += `  內部連結: ${topic.seoGuidance.internalLinks.join(', ')}\n`;
    report += `  外部連結: ${topic.seoGuidance.externalLinks.join(', ')}\n`;
    report += `\nAI Studio 提示詞:\n${topic.title}\n${contentStrategy.aiStudioPrompts[idx]}\n`;
    report += `\nGamma.app 提示詞:\n${topic.title}\n${contentStrategy.gammaPrompts[idx]}\n`;
    report += `\n`;
  });

  report += `[互動元素建議]\n\n`;
  contentStrategy.interactiveElements.forEach((element, idx) => {
    report += `${idx + 1}. ${element.type}\n`;
    report += `   ${element.description}\n\n`;
  });

  report += `[行動呼籲文案建議]\n\n`;
  contentStrategy.ctaSuggestions.forEach((cta, idx) => {
    report += `${idx + 1}. ${cta}\n`;
  });

  return report;
};

/**
 * 生成完整 PRO 報告 (Phase 1 + 2)
 */
export const generateFullReport = (
  analysis: ProductAnalysis,
  routes: MarketingRoute[],
  selectedRouteIndex: number,
  plan: ContentPlan,
  editedItems: ContentItem[]
): string => {
  const route = routes[selectedRouteIndex];
  const date = new Date().toLocaleDateString('zh-TW');

  let report = `AI Product Marketing Designer PRO v4.0 - 完整策略與內容報告\n`;
  report += `生成日期: ${date}\n`;
  report += `=================================================\n\n`;

  report += `[1. 產品分析]\n`;
  report += `產品名稱: ${analysis.name}\n`;
  report += `視覺描述: ${analysis.visual_description}\n\n`;

  report += `[2. 選定策略: ${route.route_name}]\n`;
  report += `標題: ${route.headline_zh}\n`;
  report += `風格: ${route.style_brief_zh}\n\n`;

  report += `[3. 內容企劃 (8張圖)]\n`;
  editedItems.forEach((item, idx) => {
    report += `\n--- 圖 ${idx + 1}: ${item.title_zh} ---\n`;
    report += `類型: ${item.type}\n`;
    report += `文案: ${item.copy_zh}\n`;
    report += `畫面摘要: ${item.visual_summary_zh}\n`;
    report += `繪圖指令 (EN):\n${item.visual_prompt_en}\n`;
  });

  return report;
};
