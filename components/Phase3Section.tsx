import React from 'react';
import { Spinner } from './Spinner';
import { AppState, MarketAnalysis } from '../types';
import { MarketAnalysis as MarketAnalysisComponent } from './MarketAnalysis';

interface Phase3SectionProps {
  appState: AppState;
  marketAnalysis: MarketAnalysis | null;
  productName: string;
  onGenerateMarketAnalysis: () => void;
  onDownloadPhase3Report: () => void;
}

export const Phase3Section: React.FC<Phase3SectionProps> = ({
  appState,
  marketAnalysis,
  productName,
  onGenerateMarketAnalysis,
  onDownloadPhase3Report,
}) => {
  return (
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
              onClick={onGenerateMarketAnalysis}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              開始市場分析
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
