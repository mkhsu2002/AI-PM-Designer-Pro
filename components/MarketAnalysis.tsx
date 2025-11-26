import React from 'react';
import { MarketAnalysis as MarketAnalysisType } from '../types';

interface MarketAnalysisProps {
  analysis: MarketAnalysisType;
  productName: string;
}

export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ analysis, productName }) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white serif">Phase 3: 產品市場分析</h3>
        </div>
      </div>

      {/* 產品核心價值 */}
      <div className="mb-8 bg-[#15151a] rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-bold text-white mb-4">產品核心價值</h4>
        
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-gray-400 mb-2">主要特色</h5>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            {analysis.productCoreValue.mainFeatures.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
        
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-gray-400 mb-2">核心優勢</h5>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            {analysis.productCoreValue.coreAdvantages.map((advantage, idx) => (
              <li key={idx}>{advantage}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h5 className="text-sm font-semibold text-gray-400 mb-2">解決的痛點</h5>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            {analysis.productCoreValue.painPointsSolved.map((painPoint, idx) => (
              <li key={idx}>{painPoint}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 目標市場定位 */}
      <div className="mb-8 bg-[#15151a] rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-bold text-white mb-4">目標市場定位</h4>
        
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-2">文化洞察</h5>
            <p className="text-gray-300">{analysis.marketPositioning.culturalInsights}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-2">消費習慣</h5>
            <p className="text-gray-300">{analysis.marketPositioning.consumerHabits}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-2">語言特性</h5>
            <p className="text-gray-300">{analysis.marketPositioning.languageNuances}</p>
          </div>
          
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-2">搜尋趨勢</h5>
            <div className="flex flex-wrap gap-2">
              {analysis.marketPositioning.searchTrends.map((trend, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
                  {trend}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 競爭對手分析 */}
      <div className="mb-8 bg-[#15151a] rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-bold text-white mb-4">競爭對手分析</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.competitors.map((competitor, idx) => (
            <div key={idx} className="bg-[#1a1a1f] rounded-lg p-4 border border-white/5">
              <h5 className="text-base font-bold text-white mb-2">{competitor.brandName}</h5>
              <p className="text-sm text-gray-400 mb-3">{competitor.marketingStrategy}</p>
              
              <div className="mb-3">
                <h6 className="text-xs font-semibold text-green-400 mb-1">優勢</h6>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                  {competitor.advantages.map((adv, i) => (
                    <li key={i}>{adv}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h6 className="text-xs font-semibold text-red-400 mb-1">劣勢</h6>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                  {competitor.weaknesses.map((weak, i) => (
                    <li key={i}>{weak}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 潛在客戶描繪 */}
      <div className="mb-8 bg-[#15151a] rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-bold text-white mb-4">潛在客戶描繪</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.buyerPersonas.map((persona, idx) => (
            <div key={idx} className="bg-[#1a1a1f] rounded-lg p-4 border border-white/5">
              <h5 className="text-base font-bold text-white mb-2">{persona.name}</h5>
              <p className="text-sm text-gray-300 mb-3">{persona.demographics}</p>
              
              <div className="mb-3">
                <h6 className="text-xs font-semibold text-gray-400 mb-1">興趣</h6>
                <div className="flex flex-wrap gap-1">
                  {persona.interests.map((interest, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-3">
                <h6 className="text-xs font-semibold text-gray-400 mb-1">痛點</h6>
                <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                  {persona.painPoints.map((pain, i) => (
                    <li key={i}>{pain}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h6 className="text-xs font-semibold text-gray-400 mb-1">搜尋關鍵字</h6>
                <div className="flex flex-wrap gap-1">
                  {persona.searchKeywords.map((keyword, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-300">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

