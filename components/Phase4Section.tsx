import React from 'react';
import { Spinner } from './Spinner';
import { AppState, ContentStrategy } from '../types';
import { ContentStrategy as ContentStrategyComponent } from './ContentStrategy';

interface Phase4SectionProps {
  appState: AppState;
  contentStrategy: ContentStrategy | null;
  productName: string;
  onGenerateContentStrategy: () => void;
  onDownloadPhase4Report: () => void;
}

export const Phase4Section: React.FC<Phase4SectionProps> = ({
  appState,
  contentStrategy,
  productName,
  onGenerateContentStrategy,
  onDownloadPhase4Report,
}) => {
  return (
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
              onClick={onGenerateContentStrategy}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
            >
              開始生成內容策略
            </button>
          ) : (
            <div className="mt-6">
              <ContentStrategyComponent
                strategy={contentStrategy}
                productName={productName}
                onDownload={onDownloadPhase4Report}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
