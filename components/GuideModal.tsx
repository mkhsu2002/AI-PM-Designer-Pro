
import React from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-[#1a1a1f] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-900/20 animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
             <span className="px-2 py-0.5 bg-purple-600 rounded text-xs font-bold text-white">PRO</span>
             <h2 className="text-3xl font-bold serif text-white">功能導覽 v1.02</h2>
          </div>
          <p className="text-gray-400 text-sm mb-8">從單圖分析到全套社群行銷素材的完整生產線。</p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-600/30">1</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">強化輸入 (Enhanced Input)</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  除了上傳圖片，現在支援輸入 **產品名稱** 與 **品牌背景/網址**。AI 會自動讀取網址內的品牌故事，並排除無關的促銷雜訊，確保產出的文案符合品牌調性。
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-600/30">2</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Phase 1: 策略制定</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  AI 總監會提供三條視覺路線。此階段您可預覽 3 張概念海報，並決定要採用哪一種策略風格進入下一階段。
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-600/20 text-pink-400 flex items-center justify-center font-bold text-lg border border-pink-600/30">3</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Phase 2: 全套內容企劃 (Content Suite)</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-2">
                  提供 **參考文案/競品資訊** 後，AI 會規劃一套 8 張圖的素材包：
                </p>
                <ul className="list-disc list-inside text-xs text-gray-500 space-y-1 ml-1">
                    <li><strong>2 張方形主圖</strong> (白底去背 + 情境主視覺)</li>
                    <li><strong>6 張長圖 Stories</strong> (封面、痛點、解法、細節、背書、CTA)</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-600/20 text-yellow-400 flex items-center justify-center font-bold text-lg border border-yellow-600/30">4</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">審閱與製作 (Review & Production)</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  <strong className="text-white">腳本審閱模式：</strong> 先確認 AI 寫好的 8 張圖文案與 Prompt，可自由編輯。<br/>
                  <strong className="text-white">圖片製作模式：</strong> 逐一生成圖片。支援為每一張圖 **單獨上傳參考圖片** (例如：特定 Logo 放在最後一張 CTA)。<br/>
                  <strong className="text-white">一鍵下載：</strong> 批次下載所有生成的圖片，自動 ZIP 打包，採用英文關鍵字命名規則。
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-600/30">5</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Phase 3: 產品市場分析</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  基於 Phase 1 選定的視覺策略，生成完整的市場分析報告：產品核心價值、目標市場定位、競爭對手分析（3 個）、買家人物誌（3 個）。完成後可下載市場分析報告。
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center font-bold text-lg border border-green-600/30">6</div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Phase 4: 內容與 SEO 策略</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-2">
                  基於 Phase 3 的分析結果，生成專業的內容策略：
                </p>
                <ul className="list-disc list-inside text-xs text-gray-500 space-y-1 ml-1">
                    <li><strong>內容主題</strong> (3 個)：標題、描述、關鍵字、SEO 指導</li>
                    <li><strong>互動元素建議</strong> (2-3 個)</li>
                    <li><strong>CTA 文案建議</strong> (3 個)</li>
                    <li><strong>網頁生成提示詞</strong>：AI Studio 版本（React + Tailwind CSS）與 Gamma.app 版本（簡報/網頁）</li>
                    <li><strong>自動引用 Phase 2 圖片</strong>：如果已生成圖片，提示詞會自動引用對應檔名</li>
                    <li><strong>一鍵複製與開啟</strong>：複製提示詞後自動開啟對應的生成平台</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              開始體驗 v1.02
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
