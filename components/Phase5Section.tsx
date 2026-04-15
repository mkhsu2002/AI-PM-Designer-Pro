import React from 'react';

interface Phase5SectionProps {
  productName: string;
}

export const Phase5Section: React.FC<Phase5SectionProps> = ({ productName }) => {
  return (
    <div className="mt-12 border-t border-white/10 pt-12">
      <div className="bg-[#1e1e24] rounded-2xl p-8 border border-orange-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-orange-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">5</div>
            <div>
              <h3 className="text-xl font-bold text-white">Phase 5: Ultra 版本限定</h3>
              <p className="text-gray-400 text-sm mt-1">
                {productName ? `「${productName}」的進階 Landing Page 配圖功能已移轉至 Ultra 版本。` : '進階 Landing Page 配圖功能已移轉至 Ultra 版本。'}
              </p>
            </div>
          </div>

          <div className="bg-[#15151a] rounded-xl border border-white/10 p-6">
            <p className="text-gray-300 leading-relaxed mb-5">請至 Ultra 版本體驗使用。</p>
            <a
              href="https://ultra.icareu.tw/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-900/40"
            >
              <span>請至 Ultra 版本體驗使用</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h4m0 0v4m0-4L10 14m-3 6h10a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
