import React from 'react';
import { Spinner } from './Spinner';
import { AppState, MarketAnalysis } from '../types';
import { MarketAnalysis as MarketAnalysisComponent } from './MarketAnalysis';

interface Phase3SectionProps {
  appState: AppState;
  marketAnalysis: MarketAnalysis | null;
  productName: string;
  region: string;
  onRegionChange: (region: string) => void;
  onGenerateMarketAnalysis: () => void;
  onDownloadPhase3Report: () => void;
  onOpenDebug?: () => void;
  debugPromptAvailable?: boolean;
}

export const Phase3Section: React.FC<Phase3SectionProps> = ({
  appState,
  marketAnalysis,
  productName,
  region,
  onRegionChange,
  onGenerateMarketAnalysis,
  onDownloadPhase3Report,
  onOpenDebug,
  debugPromptAvailable,
}) => {
  const regions = ["台灣", "亞洲", "北美", "全球"];
  const isCustomRegion = !regions.includes(region) && region !== "";
  const isAnalyzing = appState === AppState.ANALYZING_MARKET;
  const canEdit = !marketAnalysis && !isAnalyzing;
  return (
    <div className="mt-12 border-t border-white/10 pt-12">
      <div className="bg-[#1e1e24] rounded-2xl p-8 border border-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">3</div>
            <h3 className="text-xl font-bold text-white flex-1">Phase 3: 產品市場分析</h3>
            {debugPromptAvailable && (
              <button
                onClick={onOpenDebug}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-1 border border-white/5"
              >
                📝 檢視提示詞
              </button>
            )}
          </div>
          <p className="text-gray-400 mb-2">根據第一及第二階段產生的產品相關資訊，生成完整的市場分析報告</p>
          
          {/* Region Selection */}
          <div className="mb-6 space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">目標分析區域</label>
            <div className="flex flex-wrap gap-2">
              {regions.map((r) => (
                <button
                  key={r}
                  disabled={!canEdit}
                  onClick={() => onRegionChange(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                    region === r
                      ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/50"
                      : "bg-black/30 text-gray-400 border-white/5 hover:bg-black/50"
                  } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {r}
                </button>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  disabled={!canEdit}
                  placeholder="其他區域..."
                  value={isCustomRegion ? region : ""}
                  onChange={(e) => onRegionChange(e.target.value)}
                  className={`bg-black/30 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-all ${
                    isCustomRegion ? 'border-blue-500 ring-1 ring-blue-500' : 'border-white/10 hover:border-white/20'
                  } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Spinner className="w-12 h-12 text-blue-600" />
              <p className="text-blue-400 font-medium font-mono animate-pulse">正在透過 Google Search 檢索最新市場數據...</p>
            </div>
          ) : !marketAnalysis ? (
            <button
              onClick={onGenerateMarketAnalysis}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              執行市場分析 (含 Google Search)
            </button>
          ) : (
            <div className="mt-6">
              <MarketAnalysisComponent
                analysis={marketAnalysis}
                productName={productName}
                onDownload={onDownloadPhase3Report}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
