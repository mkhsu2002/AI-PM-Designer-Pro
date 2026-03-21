import React from 'react';
import { Spinner } from './Spinner';
import { ContentItem, ContentPlan, AppState, MarketingRoute } from '../types';
import { ContentSuite } from './ContentSuite';

interface Phase2SectionProps {
  activeRoute: MarketingRoute;
  refCopy: string;
  inputErrors: { refCopy?: string };
  appState: AppState;
  contentPlan: ContentPlan | null;
  onRefCopyChange: (value: string) => void;
  onGeneratePlan: () => void;
  onPlanUpdate: (items: ContentItem[]) => void;
  onDownloadReport: () => void;
  onImagesGenerated: (images: Map<string, string>) => void;
}

export const Phase2Section: React.FC<Phase2SectionProps> = ({
  activeRoute,
  refCopy,
  inputErrors,
  appState,
  contentPlan,
  onRefCopyChange,
  onGeneratePlan,
  onPlanUpdate,
  onDownloadReport,
  onImagesGenerated,
}) => {
  return (
    <>
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
                  onChange={(e) => onRefCopyChange(e.target.value)}
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
                  onClick={onGeneratePlan}
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
            onPlanUpdate={onPlanUpdate}
            onDownloadReport={onDownloadReport}
            onImagesGenerated={onImagesGenerated}
          />
        </div>
      )}
    </>
  );
};
