import React, { useEffect } from 'react';
import { generateFullReport, generatePhase1Report, generatePhase3Report, generatePhase4Report } from './utils/reportGenerator';
import { Spinner } from './components/Spinner';
import { ProductCard } from './components/ProductCard';
import { PromptCard } from './components/PromptCard';
import { GuideModal } from './components/GuideModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ContentSuite } from './components/ContentSuite';
import { MarketAnalysis as MarketAnalysisComponent } from './components/MarketAnalysis';
import { ContentStrategy as ContentStrategyComponent } from './components/ContentStrategy';
import { AppState } from './types';
import { ErrorType } from './utils/errorHandler';
import { validateProductName, validateBrandContext, validateRefCopy } from './utils/validators';
import { LanguageMode } from './utils/languageMode';
import { useApp } from './context/AppContext';
import { useWorkflow } from './hooks/useWorkflow';
function App() {
  const {
    appState, setAppState,
    productName, setProductName,
    brandContext, setBrandContext,
    refCopy, setRefCopy,
    selectedFile, setSelectedFile,
    imagePreview, setImagePreview,
    analysisResult, setAnalysisResult,
    activeRouteIndex, setActiveRouteIndex,
    contentPlan, setContentPlan,
    editedPlanItems, setEditedPlanItems,
    marketAnalysis, setMarketAnalysis,
    contentStrategy, setContentStrategy,
    phase2GeneratedImages, setPhase2GeneratedImages,
    languageMode, setLanguageMode,
    hasKey, setHasKey,
    resetApp
  } = useApp();

  const {
    handleAnalyze,
    handleGeneratePlan,
    handleGenerateMarketAnalysis,
    handleGenerateContentStrategy
  } = useWorkflow();

  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const [errorType, setErrorType] = React.useState<ErrorType | null>(null);
  const [inputErrors, setInputErrors] = React.useState<{ productName?: string; brandContext?: string; refCopy?: string }>({});
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = React.useState(false);

  // Check for API Key on mount
  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
      setIsKeyModalOpen(true);
    } else {
      setHasKey(true);
    }
  }, []);

  const handleKeySave = (key: string) => {
    setIsKeyModalOpen(false);
    setHasKey(true);
  };

  // --- Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 檔案大小檢查
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        setErrorMsg(`檔案大小超過限制（最大 10MB），請壓縮圖片後再試。`);
        setErrorType(ErrorType.VALIDATION);
        return;
      }

      // 檔案類型檢查
      const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!acceptedTypes.includes(file.type)) {
        setErrorMsg(`不支援的檔案類型。請上傳 JPG、PNG 或 WebP 格式的圖片。`);
        setErrorType(ErrorType.VALIDATION);
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImagePreview(ev.target.result as string);
        }
      };
      reader.onerror = () => {
        setErrorMsg('圖片讀取失敗，請稍候再試。');
        setErrorType(ErrorType.VALIDATION);
      };
      reader.readAsDataURL(file);

      // Reset results but keep inputs
      setAnalysisResult(null);
      setContentPlan(null);
      setEditedPlanItems([]);
      setAppState(AppState.IDLE);
      setErrorMsg("");
      setErrorType(null);
    }
  };

  const wrappedHandleAnalyze = async () => {
    try {
      await handleAnalyze();
    } catch (e: any) {
      setErrorMsg(e.userMessage || e.message);
      setErrorType(e.type || ErrorType.UNKNOWN);
    }
  };

  const handleDownloadPhase1 = () => {
    if (!analysisResult) return;
    const report = generatePhase1Report(analysisResult, activeRouteIndex);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Phase1_Report_${productName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPhase3 = () => {
    if (!marketAnalysis) return;
    const report = generatePhase3Report(marketAnalysis, productName);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Phase3_Report_${productName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPhase4 = () => {
    if (!contentStrategy) return;
    const report = generatePhase4Report(contentStrategy, productName);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Phase4_Report_${productName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    if (!analysisResult || !contentPlan) return;
    const report = generateFullReport(
      analysisResult.product_analysis,
      analysisResult.marketing_routes,
      activeRouteIndex,
      contentPlan,
      editedPlanItems
    );
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Full_Report_${productName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLanguageModeChange = (mode: LanguageMode) => {
    setLanguageMode(mode);
  };

  const handlePhase2ImagesGenerated = (images: Map<string, string>) => {
    setPhase2GeneratedImages(images);
  };

  // --- Render Helpers ---

  const renderInputs = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left: Image Upload */}
      <div className="order-2 md:order-1">
        <label
          className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedFile ? 'border-purple-500 bg-[#15151a]' : 'border-gray-600 hover:border-gray-400 hover:bg-[#1a1a1f]'
            }`}
        >
          {imagePreview ? (
            <div className="w-full h-full relative group">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-medium">更換圖片</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="mb-2 text-sm text-gray-400">上傳產品圖片</p>
              <p className="text-xs text-gray-500">支援 JPG, PNG</p>
            </div>
          )}
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </label>
      </div>

      {/* Right: Text Inputs */}
      <div className="order-1 md:order-2 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">1. 產品名稱 (Product Name)</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              if (inputErrors.productName) {
                setInputErrors({ ...inputErrors, productName: undefined });
              }
            }}
            placeholder="例如：Sony WH-1000XM5, Aesop 洗手乳..."
            className={`w-full bg-[#15151a] border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${inputErrors.productName ? 'border-red-500' : 'border-white/10 focus:border-purple-500'
              }`}
          />
          {inputErrors.productName && (
            <p className="text-red-400 text-xs mt-1">{inputErrors.productName}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">2. 品牌資訊 / 背景 (Context)</label>
          <textarea
            value={brandContext}
            onChange={(e) => {
              setBrandContext(e.target.value);
              if (inputErrors.brandContext) {
                setInputErrors({ ...inputErrors, brandContext: undefined });
              }
            }}
            placeholder="可輸入品牌官網網址(AI會分析網址文字) 或直接貼上品牌故事、核心價值..."
            className={`w-full bg-[#15151a] border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors h-40 resize-none text-sm leading-relaxed ${inputErrors.brandContext ? 'border-red-500' : 'border-white/10 focus:border-purple-500'
              }`}
          />
          {inputErrors.brandContext && (
            <p className="text-red-400 text-xs mt-1">{inputErrors.brandContext}</p>
          )}
        </div>

        {selectedFile && appState === AppState.IDLE && (
          <button
            onClick={wrappedHandleAnalyze}
            className="mt-auto w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
          >
            <span>開始 AI 分析</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        )}
      </div>
    </div>
  );

  const renderPhase1Results = () => {
    if (!analysisResult || !imagePreview) return null;
    const activeRoute = analysisResult.marketing_routes[activeRouteIndex];

    return (
      <div className="w-full max-w-6xl mx-auto px-4 pb-20">
        <ProductCard analysis={analysisResult.product_analysis} imageSrc={imagePreview} />

        {/* Route Selection */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <h3 className="text-xl font-bold text-white serif">Phase 1: 視覺策略選擇</h3>
            <button
              onClick={handleDownloadPhase1}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              下載策略報告
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisResult.marketing_routes.map((route, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveRouteIndex(idx);
                  setContentPlan(null); // Reset Phase 2 if route changes
                  setEditedPlanItems([]);
                  if (appState === AppState.SUITE_READY) setAppState(AppState.RESULTS);
                }}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${activeRouteIndex === idx
                  ? 'bg-white text-black border-white scale-[1.02]'
                  : 'bg-[#15151a] text-gray-400 border-white/5 hover:bg-[#1a1a1f]'
                  }`}
              >
                <div className="text-xs font-bold uppercase opacity-70">Route {String.fromCharCode(65 + idx)}</div>
                <div className="font-bold text-lg">{route.route_name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompts for Phase 1 (The 3 Concept Posters) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {activeRoute.image_prompts.map((promptItem, idx) => (
            <PromptCard key={`p1-${activeRouteIndex}-${idx}`} data={promptItem} index={idx} />
          ))}
        </div>

        {/* Phase 2 Trigger Area */}
        <div className="border-t border-white/10 pt-12" id="phase2-section">
          <div className="bg-[#1e1e24] rounded-2xl p-8 border border-purple-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-white serif">Phase 2: 全套內容生成</h3>
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold uppercase rounded">PRO</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  AI 將根據 <strong>"{activeRoute.route_name}"</strong> 策略，規劃一套包含 2 張主圖與 6 張社群長圖 (Stories) 的完整銷售漏斗素材。
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">參考文案 / 競品參考 (Optional)</label>
                  <textarea
                    value={refCopy}
                    onChange={(e) => {
                      setRefCopy(e.target.value);
                      if (inputErrors.refCopy) {
                        setInputErrors({ ...inputErrors, refCopy: undefined });
                      }
                    }}
                    placeholder="請貼上同類型商品的熱銷文案，或競品官網內容。AI 將拆解其「說服邏輯」與「結構」，並應用於您的產品內容規劃中..."
                    className={`w-full bg-black/30 border rounded-lg p-3 text-sm text-gray-300 focus:outline-none h-32 resize-none ${inputErrors.refCopy ? 'border-red-500' : 'border-white/10 focus:border-purple-500'
                      }`}
                  />
                  {inputErrors.refCopy && (
                    <p className="text-red-400 text-xs">{inputErrors.refCopy}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-end md:w-64 shrink-0">
                {appState === AppState.PLANNING ? (
                  <div className="h-12 flex items-center justify-center gap-2 text-purple-400">
                    <Spinner className="w-5 h-5" />
                    <span className="text-sm font-bold animate-pulse">正在規劃腳本...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleGeneratePlan}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-900/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    生成 8 張圖腳本
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2 Results */}
        {(appState === AppState.SUITE_READY || contentPlan) && contentPlan && (
          <div className="mt-12">
            <ContentSuite
              plan={contentPlan}
              onPlanUpdate={(newItems) => setEditedPlanItems(newItems)}
              onDownloadReport={handleDownloadReport}
              onImagesGenerated={handlePhase2ImagesGenerated}
            />
          </div>
        )}

        {/* Phase 3 Trigger */}
        {(appState === AppState.SUITE_READY || appState === AppState.ANALYZING_MARKET || appState === AppState.MARKET_READY || appState === AppState.ANALYZING_CONTENT || appState === AppState.CONTENT_READY) && contentPlan && (
          <div className="mt-12 border-t border-white/10 pt-12">
            <div className="bg-[#1e1e24] rounded-2xl p-8 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">3</div>
                  <h3 className="text-xl font-bold text-white">Phase 3: 產品市場分析</h3>
                </div>
                <p className="text-gray-400 mb-6">根據第一及第二階段產生的產品相關資訊，生成完整的市場分析報告</p>

                {appState === AppState.ANALYZING_MARKET ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Spinner className="w-12 h-12 text-blue-600" />
                    <p className="text-blue-400 font-medium">正在分析市場數據...</p>
                  </div>
                ) : !marketAnalysis ? (
                  <button
                    onClick={handleGenerateMarketAnalysis}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                  >
                    開始市場分析
                  </button>
                ) : (
                  <div className="mt-6">
                    <MarketAnalysisComponent
                      analysis={marketAnalysis}
                      productName={productName}
                      onDownload={handleDownloadPhase3}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phase 4 Trigger */}
        {(appState === AppState.MARKET_READY || appState === AppState.ANALYZING_CONTENT || appState === AppState.CONTENT_READY) && marketAnalysis && (
          <div className="mt-12 border-t border-white/10 pt-12">
            <div className="bg-[#1e1e24] rounded-2xl p-8 border border-green-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-green-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">4</div>
                  <h3 className="text-xl font-bold text-white">Phase 4: 內容與 SEO 策略</h3>
                </div>
                <p className="text-gray-400 mb-6">基於第三階段的分析結果，生成專業的內容策略與 SEO 優化方案</p>

                {appState === AppState.ANALYZING_CONTENT ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Spinner className="w-12 h-12 text-green-600" />
                    <p className="text-green-400 font-medium">正在生成內容策略...</p>
                  </div>
                ) : !contentStrategy ? (
                  <button
                    onClick={handleGenerateContentStrategy}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                  >
                    開始生成內容策略
                  </button>
                ) : (
                  <div className="mt-6">
                    <ContentStrategyComponent
                      strategy={contentStrategy}
                      productName={productName}
                      onDownload={handleDownloadPhase4}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-slate-200 selection:bg-purple-500 selection:text-white font-sans flex flex-col">
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <ApiKeyModal isOpen={isKeyModalOpen} onSave={handleKeySave} />

      {/* Header */}
      <header className="w-full py-6 border-b border-white/5 bg-[#0f0f12]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetApp}>
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/50">
              <span className="text-white font-bold">PM</span>
            </div>
            <h1 className="text-lg font-bold text-white hidden md:block">
              AI Product Marketing Designer <span className="text-purple-500 text-xs align-top ml-1">PRO</span>
            </h1>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => setIsGuideOpen(true)} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">功能導覽 v4.0</button>

            {/* Language Mode Switcher */}
            <div className="flex items-center gap-2 bg-[#1a1a1f] rounded-lg p-1 border border-white/10">
              <button
                onClick={() => handleLanguageModeChange(LanguageMode.ZH_TW)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${languageMode === LanguageMode.ZH_TW
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                繁體中文
              </button>
              <button
                onClick={() => handleLanguageModeChange(LanguageMode.EN)}
                disabled
                className={`px-3 py-1 rounded text-xs font-bold transition-colors relative ${languageMode === LanguageMode.EN
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 cursor-not-allowed opacity-50'
                  }`}
                title="英文模式開發中"
              >
                英文
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-[8px] text-black font-bold px-1 rounded">開發中</span>
              </button>
            </div>

            <button onClick={() => setIsKeyModalOpen(true)} className="text-purple-400 hover:text-purple-300 text-sm font-bold">
              {hasKey ? '更換 API Key' : '設定 API Key'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Global Error */}
        {errorMsg && (
          <div className="w-full max-w-5xl mx-auto mb-8 p-6 bg-red-900/20 border border-red-500/50 rounded-xl text-left shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-red-500/30 pb-2">
              <h3 className="text-red-400 font-bold flex items-center gap-2 text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {errorType === ErrorType.AUTH ? '認證錯誤' :
                  errorType === ErrorType.NETWORK ? '網路錯誤' :
                    errorType === ErrorType.RATE_LIMIT ? '請求限制' :
                      errorType === ErrorType.VALIDATION ? '驗證錯誤' :
                        '發生錯誤'}
              </h3>
              <button onClick={() => {
                setAppState(AppState.IDLE);
                setErrorMsg("");
                setErrorType(null);
              }} className="text-sm text-red-300 hover:text-white underline">重置並返回首頁</button>
            </div>
            <p className="text-red-200 text-sm leading-relaxed">
              {errorMsg}
            </p>
            {errorType === ErrorType.RATE_LIMIT && (
              <p className="text-red-300/70 text-xs mt-3">
                💡 提示：API 請求次數已達上限，請稍候 1-2 分鐘後再試，或檢查您的 API 配額設定。
              </p>
            )}
          </div>
        )}

        {/* Loading States */}
        {(appState === AppState.ANALYZING) && (
          <div className="flex flex-col items-center justify-center mt-20 space-y-6 text-center animate-in fade-in zoom-in duration-500">
            <Spinner className="w-20 h-20 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">AI 總監正在分析產品</h2>
              <p className="text-gray-400">正在解讀品牌語意與視覺特徵...</p>
            </div>
          </div>
        )}

        {(appState === AppState.ANALYZING_MARKET) && (
          <div className="flex flex-col items-center justify-center mt-20 space-y-6 text-center animate-in fade-in zoom-in duration-500">
            <Spinner className="w-20 h-20 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Phase 3: 市場分析中</h2>
              <p className="text-gray-400">正在分析產品核心價值、市場定位、競爭對手與潛在客戶...</p>
            </div>
          </div>
        )}

        {(appState === AppState.ANALYZING_CONTENT) && (
          <div className="flex flex-col items-center justify-center mt-20 space-y-6 text-center animate-in fade-in zoom-in duration-500">
            <Spinner className="w-20 h-20 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Phase 4: 內容策略生成中</h2>
              <p className="text-gray-400">正在生成內容主題、SEO 策略與 AI Studio 提示詞...</p>
            </div>
          </div>
        )}

        {(appState === AppState.PLANNING) && (
          <div className="flex flex-col items-center justify-center mt-20 space-y-6 text-center animate-in fade-in zoom-in duration-500">
            <Spinner className="w-20 h-20 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Phase 2: 正在規劃腳本</h2>
              <p className="text-gray-400">正在生成 8 張圖行銷素材包...</p>
            </div>
          </div>
        )}

        {/* Main Views */}
        {appState === AppState.IDLE && (
          <div className="flex-1 flex flex-col items-center mt-8 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest mb-6">
              New Version 4.1
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white serif mb-4 leading-tight">
              打造完整的<br />品牌視覺資產
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-8 text-lg">
              結合產品識別、品牌故事與競品策略。<br />
              一鍵生成廣告海報與 <span className="text-purple-400 font-bold">8 張完整的社群行銷套圖</span>。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-8">
              <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:bg-[#1a1a1f] relative overflow-hidden">
                {imagePreview ? <img src={imagePreview} className="w-full h-full object-contain p-4" /> : <p className="text-sm text-gray-400">上傳產品圖片</p>}
                <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
              <div className="flex flex-col gap-4">
                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="產品名稱" className="w-full bg-[#15151a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none" />
                <textarea value={brandContext} onChange={(e) => setBrandContext(e.target.value)} placeholder="品牌資訊 / 背景" className="w-full bg-[#15151a] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none h-40 resize-none text-sm" />
                {productName && <button onClick={wrappedHandleAnalyze} className="mt-auto w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity">開始 AI 分析</button>}
              </div>
            </div>
          </div>
        )}

        {(appState === AppState.RESULTS || appState === AppState.SUITE_READY ||
          appState === AppState.MARKET_READY || appState === AppState.CONTENT_READY) && renderPhase1Results()}

      </main>

      <footer className="w-full py-6 text-center border-t border-white/5 text-xs text-gray-600">
        Open sourced by <a href="https://flypigai.icareu.tw/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors font-bold">FlyPig AI</a>
      </footer>
    </div>
  );
}

export default App;