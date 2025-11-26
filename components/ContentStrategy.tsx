import React, { useState } from 'react';
import { ContentStrategy as ContentStrategyType } from '../types';

interface ContentStrategyProps {
  strategy: ContentStrategyType;
}

export const ContentStrategy: React.FC<ContentStrategyProps> = ({ strategy }) => {
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(index);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-20">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white serif">Phase 4: 內容與 SEO 策略</h3>
        </div>
      </div>

      {/* 內容主題 */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-white mb-4">內容主題</h4>
        <div className="space-y-4">
          {strategy.contentTopics.map((topic, idx) => (
            <div key={idx} className="bg-[#15151a] rounded-xl p-6 border border-white/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h5 className="text-base font-bold text-white mb-2">{topic.title}</h5>
                  <p className="text-sm text-gray-300 mb-3">{topic.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-500/20 rounded-full text-sm text-blue-300 font-semibold">
                      主要關鍵字: {topic.focusKeyword}
                    </span>
                    {topic.longTailKeywords.slice(0, 3).map((keyword, i) => (
                      <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                        {keyword}
                      </span>
                    ))}
                    {topic.longTailKeywords.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400">
                        +{topic.longTailKeywords.length - 3} 更多
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setExpandedTopic(expandedTopic === idx ? null : idx)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                >
                  {expandedTopic === idx ? '收起' : '展開 SEO 詳情'}
                </button>
              </div>
              
              {expandedTopic === idx && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-xs font-semibold text-gray-400 mb-1">關鍵字密度</h6>
                      <p className="text-sm text-gray-300">{topic.seoGuidance.keywordDensity}</p>
                    </div>
                    
                    <div>
                      <h6 className="text-xs font-semibold text-gray-400 mb-1">語意關鍵字</h6>
                      <div className="flex flex-wrap gap-1">
                        {topic.seoGuidance.semanticKeywords.map((keyword, i) => (
                          <span key={i} className="px-2 py-0.5 bg-purple-500/20 rounded text-xs text-purple-300">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="text-xs font-semibold text-gray-400 mb-1">內部連結</h6>
                      <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                        {topic.seoGuidance.internalLinks.map((link, i) => (
                          <li key={i}>{link}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h6 className="text-xs font-semibold text-gray-400 mb-1">外部連結</h6>
                      <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                        {topic.seoGuidance.externalLinks.map((link, i) => (
                          <li key={i}>{link}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* AI Studio 提示詞 */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-xs font-semibold text-gray-400">AI Studio 生成提示詞</h6>
                      <button
                        onClick={() => copyToClipboard(strategy.aiStudioPrompts[idx], idx)}
                        className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs text-green-300 transition-colors"
                      >
                        {copiedPrompt === idx ? '已複製！' : '複製提示詞'}
                      </button>
                    </div>
                    <div className="bg-[#0a0a0d] rounded-lg p-4 border border-white/5">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                        {strategy.aiStudioPrompts[idx]}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 互動元素建議 */}
      <div className="mb-8 bg-[#15151a] rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-bold text-white mb-4">互動元素建議</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategy.interactiveElements.map((element, idx) => (
            <div key={idx} className="bg-[#1a1a1f] rounded-lg p-4 border border-white/5">
              <h5 className="text-sm font-bold text-white mb-2">{element.type}</h5>
              <p className="text-xs text-gray-300">{element.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA 建議 */}
      <div className="mb-8 bg-[#15151a] rounded-xl p-6 border border-white/5">
        <h4 className="text-lg font-bold text-white mb-4">行動呼籲文案建議</h4>
        <div className="flex flex-wrap gap-3">
          {strategy.ctaSuggestions.map((cta, idx) => (
            <div key={idx} className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
              <p className="text-sm font-semibold text-white">{cta}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

