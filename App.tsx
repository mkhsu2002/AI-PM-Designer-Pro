import React, { useState, useEffect } from 'react';
import { analyzeProductImage, generateContentPlan, generateMarketAnalysis, generateContentStrategy } from './services/geminiService';
import { DirectorOutput, ContentItem, ContentPlan, MarketAnalysis, AppState, ContentStrategy } from './types';
import { GuideModal } from './components/GuideModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ProductCard } from './components/ProductCard';
import { PromptCard } from './components/PromptCard';
import { ErrorBanner } from './components/ErrorBanner';
import { LoadingOverlay } from './components/LoadingOverlay';
import { InputForm } from './components/InputForm';
import { Phase2Section } from './components/Phase2Section';
import { Phase3Section } from './components/Phase3Section';
import { Phase4Section } from './components/Phase4Section';
import { Phase5Section } from './components/Phase5Section';
import { DebugPromptModal } from './components/DebugPromptModal';
import { AppError, ErrorType } from './utils/errorHandler';
import { validateProductName, validateBrandContext, validateRefCopy } from './utils/validators';
import { LanguageMode, getLanguageMode, setLanguageMode, isChineseMode } from './utils/languageMode';
import { generateImageDescriptionMap } from './utils/imageMapping';
import { generateFileNameMap } from './utils/imageNaming';
import { generatePhase1Report, generatePhase3Report, generatePhase4Report } from './utils/reportGenerator';
import { generateFullReport } from './services/geminiService';
import { downloadTextFile } from './utils/downloadHelper';
import { FILE_LIMITS } from './utils/constants';

const App: React.FC = () => {
  // --- Core State ---
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- PRO Inputs ---
  const [productName, setProductName] = useState("");
  const [brandContext, setBrandContext] = useState("");
  const [refCopy, setRefCopy] = useState("");

  // --- Phase 1 Results ---
  const [analysisResult, setAnalysisResult] = useState<DirectorOutput | null>(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);

  // --- Phase 2 Data ---
  const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);
  const [editedPlanItems, setEditedPlanItems] = useState<ContentItem[]>([]);
  const [phase2GeneratedImages, setPhase2GeneratedImages] = useState<Map<string, string>>(new Map());

  // --- Phase 3 & 4 Data ---
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [marketRegion, setMarketRegion] = useState<string>("台灣");
  const [contentStrategy, setContentStrategy] = useState<ContentStrategy | null>(null);

  // --- UI State ---
  const [debugModalPhase, setDebugModalPhase] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [inputErrors, setInputErrors] = useState<{ productName?: string; brandContext?: string; refCopy?: string }>({});
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [languageMode, setLanguageModeState] = useState<LanguageMode>(getLanguageMode());

  // --- Check for API Key on mount ---
  useEffect(() => {
    const key = localStorage.getItem('gemini_api_key');
    if (!key) {
      setIsKeyModalOpen(true);
    } else {
      setHasKey(true);
    }
  }, []);

  // --- Error & Reset Helpers ---
  const handleError = (e: unknown, fallbackMsg: string, fallbackState?: AppState) => {
    console.error(e);
    if (e instanceof AppError) {
      setErrorMsg(e.userMessage);
      setErrorType(e.type);
      if (e.type === ErrorType.AUTH) setIsKeyModalOpen(true);
    } else {
      setErrorMsg(fallbackMsg);
      setErrorType(ErrorType.UNKNOWN);
    }
    if (fallbackState !== undefined) setAppState(fallbackState);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setErrorMsg("");
    setErrorType(null);
  };

  // --- File Handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > FILE_LIMITS.MAX_IMAGE_SIZE) {
        setErrorMsg(`檔案大小超過限制（最大 ${FILE_LIMITS.MAX_IMAGE_SIZE_MB}MB），請壓縮圖片後再試。`);
        setErrorType(ErrorType.VALIDATION);
        return;
      }

      if (!(FILE_LIMITS.ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
        setErrorMsg(`不支援的檔案類型。請上傳 JPG、PNG 或 WebP 格式的圖片。`);
        setErrorType(ErrorType.VALIDATION);
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImagePreview(ev.target.result as string);
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

  // --- Phase 1: Analyze ---
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    if (!hasKey) { setIsKeyModalOpen(true); return; }

    const nameValidation = validateProductName(productName);
    const contextValidation = validateBrandContext(brandContext);
    if (!nameValidation.valid || !contextValidation.valid) {
      setInputErrors({ productName: nameValidation.error, brandContext: contextValidation.error });
      return;
    }

    setInputErrors({});
    setErrorMsg("");
    setErrorType(null);
    setAppState(AppState.ANALYZING);

    try {
      const result = await analyzeProductImage(selectedFile, productName, brandContext);
      setAnalysisResult(result);
      setAppState(AppState.RESULTS);
    } catch (e) {
      handleError(e, "分析過程中發生了意外錯誤，請稍候再試。", AppState.ERROR);
    }
  };

  // --- Phase 2: Generate Plan ---
  const handleGeneratePlan = async () => {
    if (!analysisResult) return;
    const route = analysisResult.marketing_routes[activeRouteIndex];
    const analysis = analysisResult.product_analysis;

    const refCopyValidation = validateRefCopy(refCopy);
    if (!refCopyValidation.valid) {
      setInputErrors({ refCopy: refCopyValidation.error });
      return;
    }

    setInputErrors({});
    setErrorMsg("");
    setErrorType(null);
    setAppState(AppState.PLANNING);

    try {
      const plan = await generateContentPlan(route, analysis, refCopy, brandContext);
      setContentPlan(plan);
      setEditedPlanItems(plan.items);
      setAppState(AppState.SUITE_READY);
    } catch (e) {
      handleError(e, "內容規劃失敗，請稍候再試。", AppState.RESULTS);
    }
  };

  // --- Phase 3: Market Analysis ---
  const handleGenerateMarketAnalysis = async () => {
    if (!analysisResult || !imagePreview) return;

    setErrorMsg("");
    setErrorType(null);
    setAppState(AppState.ANALYZING_MARKET);

    try {
      const selectedRoute = analysisResult.marketing_routes[activeRouteIndex];
      const analysis = await generateMarketAnalysis(productName, selectedRoute, imagePreview, marketRegion);
      setMarketAnalysis(analysis);
      setAppState(AppState.MARKET_READY);
    } catch (e) {
      handleError(e, "市場分析失敗，請稍候再試。", AppState.SUITE_READY);
    }
  };

  // --- Phase 4: Content Strategy ---
  const handleGenerateContentStrategy = async () => {
    if (!marketAnalysis) return;

    setErrorMsg("");
    setErrorType(null);
    setAppState(AppState.ANALYZING_CONTENT);

    try {
      const selectedRoute = analysisResult!.marketing_routes[activeRouteIndex];

      let imageFileNames: Map<string, string> | undefined;
      let imageDescriptions: Map<string, string> | undefined;

      if (phase2GeneratedImages.size > 0 && editedPlanItems.length > 0) {
        const generatedImageIds = new Set(phase2GeneratedImages.keys());
        imageFileNames = generateFileNameMap(editedPlanItems);
        imageDescriptions = generateImageDescriptionMap(editedPlanItems, generatedImageIds);

        const filteredFileNames = new Map<string, string>();
        imageFileNames.forEach((filename, itemId) => {
          if (generatedImageIds.has(itemId)) filteredFileNames.set(itemId, filename);
        });
        imageFileNames = filteredFileNames;
      }

      const strategy = await generateContentStrategy(
        marketAnalysis, productName, selectedRoute, imageFileNames, imageDescriptions
      );
      setContentStrategy(strategy);
      setAppState(AppState.CONTENT_READY);
    } catch (e) {
      handleError(e, "內容策略生成失敗，請稍候再試。", AppState.MARKET_READY);
    }
  };

  // --- Language ---
  const handleLanguageModeChange = (mode: LanguageMode) => {
    if (mode === LanguageMode.EN) return; // English mode is WIP
    setLanguageMode(mode);
    setLanguageModeState(mode);
  };

  // --- Download Handlers (using shared utility) ---
  const handleDownloadReport = () => {
    if (!analysisResult || !contentPlan) return;
    const textReport = generateFullReport(
      analysisResult.product_analysis, analysisResult.marketing_routes,
      activeRouteIndex, contentPlan, editedPlanItems
    );
    downloadTextFile(textReport, `PRO_Strategy_Report_${analysisResult.product_analysis.name.replace(/\s+/g, '_')}.txt`);
  };

  const handleDownloadPhase1Report = () => {
    if (!analysisResult) return;
    const textReport = generatePhase1Report(analysisResult, activeRouteIndex);
    downloadTextFile(textReport, `Phase1_視覺策略報告_${analysisResult.product_analysis.name.replace(/\s+/g, '_')}.txt`);
  };

  const handleDownloadPhase3Report = () => {
    if (!marketAnalysis) return;
    const textReport = generatePhase3Report(marketAnalysis, productName);
    downloadTextFile(textReport, `Phase3_市場分析報告_${productName.replace(/\s+/g, '_')}.txt`);
  };

  const handleDownloadPhase4Report = () => {
    if (!contentStrategy) return;
    const textReport = generatePhase4Report(contentStrategy, productName);
    downloadTextFile(textReport, `Phase4_內容策略報告_${productName.replace(/\s+/g, '_')}.txt`);
  };

  // --- Route Selection ---
  const handleRouteChange = (idx: number) => {
    setActiveRouteIndex(idx);
    setContentPlan(null);
    setEditedPlanItems([]);
    setMarketAnalysis(null);
    setContentStrategy(null);
    if (appState === AppState.SUITE_READY) setAppState(AppState.RESULTS);
  };

  // --- Phase visibility checks ---
  const isPhaseResultsVisible = appState === AppState.RESULTS || appState === AppState.PLANNING ||
    appState === AppState.SUITE_READY || appState === AppState.ANALYZING_MARKET ||
    appState === AppState.MARKET_READY || appState === AppState.ANALYZING_CONTENT ||
    appState === AppState.CONTENT_READY;

  const isPhase3Visible = (appState === AppState.SUITE_READY || appState === AppState.ANALYZING_MARKET ||
    appState === AppState.MARKET_READY || appState === AppState.ANALYZING_CONTENT ||
    appState === AppState.CONTENT_READY) && contentPlan;

  const isPhase4Visible = (appState === AppState.MARKET_READY || appState === AppState.ANALYZING_CONTENT ||
    appState === AppState.CONTENT_READY) && marketAnalysis;

  const isPhase5Visible = appState === AppState.CONTENT_READY && contentStrategy;

  // --- Render Phase 1 Results ---
  const renderPhase1Results = () => {
    if (!analysisResult || !imagePreview) return null;
    const activeRoute = analysisResult.marketing_routes[activeRouteIndex];

    return (
      <div className="w-full max-w-6xl mx-auto px-4 pb-20">
        <ProductCard analysis={analysisResult.product_analysis} imageSrc={imagePreview} />

        {/* Route Selection */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 flex-1">
                  Phase 1: 視覺策略選擇 / Select Concept
                </h2>
                {analysisResult?._debugPrompt && (
                  <button
                    onClick={() => setDebugModalPhase(1)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-1 border border-white/5"
                  >
                    📝 檢視提示詞
                  </button>
                )}
              </div>
            <button
              onClick={handleDownloadPhase1Report}
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
                onClick={() => handleRouteChange(idx)}
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

        {/* Phase 1 Concept Posters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {activeRoute.image_prompts.map((promptItem, idx) => (
            <PromptCard 
              key={`p1-${activeRouteIndex}-${idx}`} 
              data={promptItem} 
              index={idx} 
              defaultRefImage={imagePreview || undefined}
            />
          ))}
        </div>

        {/* Phase 2 */}
        <Phase2Section
          activeRoute={activeRoute}
          refCopy={refCopy}
          inputErrors={inputErrors}
          appState={appState}
          contentPlan={contentPlan}
          productImageBase64={imagePreview || undefined}
          onRefCopyChange={(val) => {
            setRefCopy(val);
            if (inputErrors.refCopy) setInputErrors({ ...inputErrors, refCopy: undefined });
          }}
          onGeneratePlan={handleGeneratePlan}
          onPlanUpdate={(newItems) => setEditedPlanItems(newItems)}
          onDownloadReport={handleDownloadReport}
          onImagesGenerated={(images) => setPhase2GeneratedImages(images)}
          onOpenDebug={() => setDebugModalPhase(2)}
          debugPromptAvailable={!!contentPlan?._debugPrompt}
        />

        {/* Phase 3 */}
        {isPhase3Visible && (
          <Phase3Section
          appState={appState}
          marketAnalysis={marketAnalysis}
          onGenerateMarketAnalysis={handleGenerateMarketAnalysis}
          onOpenDebug={() => setDebugModalPhase(3)}
          debugPromptAvailable={!!marketAnalysis?._debugPrompt}
          productName={productName}
          region={marketRegion}
          onRegionChange={setMarketRegion}
          onDownloadPhase3Report={handleDownloadPhase3Report}
          />
        )}

        {/* Phase 4 */}
        {isPhase4Visible && (
          <Phase4Section
          appState={appState}
          contentStrategy={contentStrategy}
          onGenerateContentStrategy={handleGenerateContentStrategy}
          onOpenDebug={() => setDebugModalPhase(4)}
          debugPromptAvailable={!!contentStrategy?._debugPrompt}
          productName={productName}
          onDownloadPhase4Report={handleDownloadPhase4Report}
          />
        )}

        {/* Phase 5 */}
        {isPhase5Visible && (
          <Phase5Section
          productName={productName}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-slate-200 selection:bg-purple-500 selection:text-white font-sans flex flex-col">
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <ApiKeyModal isOpen={isKeyModalOpen} onSave={(key: string) => { setIsKeyModalOpen(false); setHasKey(true); }} />

      {/* Header */}
      <header className="w-full py-6 border-b border-white/5 bg-[#0f0f12]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAppState(AppState.IDLE)}>
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/50">
              <span className="text-white font-bold">PM</span>
            </div>
            <h1 className="text-lg font-bold text-white hidden md:block">
              AI Product Marketing Designer <span className="text-purple-500 text-xs align-top ml-1">PRO</span>
            </h1>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => setIsGuideOpen(true)} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">功能導覽 v0.8</button>

            {/* Language Mode Switcher */}
            <div className="flex items-center gap-2 bg-[#1a1a1f] rounded-lg p-1 border border-white/10">
              <button
                onClick={() => handleLanguageModeChange(LanguageMode.ZH_TW)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${languageMode === LanguageMode.ZH_TW ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                繁體中文
              </button>
              <button
                onClick={() => handleLanguageModeChange(LanguageMode.EN)}
                disabled
                className={`px-3 py-1 rounded text-xs font-bold transition-colors relative ${languageMode === LanguageMode.EN ? 'bg-purple-600 text-white' : 'text-gray-500 cursor-not-allowed opacity-50'}`}
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
        <ErrorBanner errorMsg={errorMsg} errorType={errorType} onReset={handleReset} />

        {/* Loading States */}
        {appState === AppState.ANALYZING && (
          <LoadingOverlay title="AI 總監正在分析產品" description="正在解讀品牌語意與視覺特徵..." colorClass="purple" />
        )}
        {appState === AppState.ANALYZING_MARKET && (
          <LoadingOverlay title="Phase 3: 市場分析中" description="正在分析產品核心價值、市場定位、競爭對手與潛在客戶..." colorClass="blue" />
        )}
        {appState === AppState.ANALYZING_CONTENT && (
          <LoadingOverlay title="Phase 4: 內容策略生成中" description="正在生成內容主題、SEO 策略與 AI Studio 提示詞..." colorClass="green" />
        )}

        {/* Idle View */}
        {appState === AppState.IDLE && (
          <div className="flex-1 flex flex-col items-center mt-8 text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest mb-6">
              v0.8
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white serif mb-4 leading-tight">
              打造完整的<br />品牌視覺資產
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-8 text-lg">
              結合產品識別、品牌故事與競品策略。<br />
              一鍵生成廣告海報與 <span className="text-purple-400 font-bold">8 張完整的社群行銷套圖</span>。
            </p>
            <InputForm
              productName={productName}
              brandContext={brandContext}
              selectedFile={selectedFile}
              imagePreview={imagePreview}
              inputErrors={inputErrors}
              appState={appState}
              onProductNameChange={(val) => {
                setProductName(val);
                if (inputErrors.productName) setInputErrors({ ...inputErrors, productName: undefined });
              }}
              onBrandContextChange={(val) => {
                setBrandContext(val);
                if (inputErrors.brandContext) setInputErrors({ ...inputErrors, brandContext: undefined });
              }}
              onFileChange={handleFileChange}
              onAnalyze={handleAnalyze}
            />
          </div>
        )}

        {isPhaseResultsVisible && renderPhase1Results()}
      </main>

      <footer className="w-full py-6 text-center border-t border-white/5 text-xs text-gray-600">
        © 2026 <a href="https://flypigai.icareu.tw/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors font-bold">FlyPig AI - 艾可開發股份有限公司</a>. All rights reserved.
      </footer>

      <DebugPromptModal 
        isOpen={debugModalPhase !== null}
        promptContent={
          debugModalPhase === 1 ? analysisResult?._debugPrompt || null :
          debugModalPhase === 2 ? contentPlan?._debugPrompt || null :
          debugModalPhase === 3 ? marketAnalysis?._debugPrompt || null :
          debugModalPhase === 4 ? contentStrategy?._debugPrompt || null :
          null
        }
        phaseName={`Phase ${debugModalPhase}`}
        onClose={() => setDebugModalPhase(null)}
      />
    </div>
  );
};

export default App;
