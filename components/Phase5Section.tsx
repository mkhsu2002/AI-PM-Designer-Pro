import React, { useState, useRef, useEffect } from 'react';
import { Spinner } from './Spinner';
import { AppState, LandingPageImagePrompt } from '../types';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageModal } from './ImageModal';
import { downloadSingleImage } from '../utils/imageDownloader';

interface LandingPageImageCardProps {
  prompt: LandingPageImagePrompt;
  index: number;
  defaultRefImage?: string;
  onPromptChange: (index: number, newPrompt: string) => void;
}

const LandingPageImageCard: React.FC<LandingPageImageCardProps> = ({
  prompt,
  index,
  defaultRefImage,
  onPromptChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(prompt.prompt_en);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '16:9'>(
    prompt.suggestedRatio as '1:1' | '3:4' | '4:3' | '16:9'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { image: generatedImage, loading: isLoading, error, generateImage, clearImage } = useImageGeneration();
  const { image: refImage, error: refImageError, uploadImage: uploadRefImage, clearImage: clearRefImage } = useImageUpload();

  // Reset when prompt data changes
  useEffect(() => {
    setEditText(prompt.prompt_en);
    clearImage();
    clearRefImage();
    setIsEditing(false);
    setAspectRatio(prompt.suggestedRatio as '1:1' | '3:4' | '4:3' | '16:9');
  }, [prompt, clearImage, clearRefImage]);

  const effectiveRefImage = refImage || defaultRefImage;

  const handleGenerate = async () => {
    await generateImage(editText, aspectRatio, effectiveRefImage || undefined);
  };

  const handleRefImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadRefImage(e.target.files[0]);
    }
  };

  const handleClearRefImage = () => {
    clearRefImage();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveEdit = () => {
    onPromptChange(index, editText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(prompt.prompt_en);
    setIsEditing(false);
  };

  // 用途對應的簡稱 & 主題色
  const purposeColors: Record<string, string> = {
    'lp_img_1_hero': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'lp_img_2_feature': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'lp_img_3_lifestyle': 'bg-green-500/20 text-green-300 border-green-500/30',
    'lp_img_4_detail': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'lp_img_5_trust': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'lp_img_6_cta': 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const getContainerClass = () => {
    if (aspectRatio === '1:1') return "aspect-square w-full";
    if (aspectRatio === '3:4') return "aspect-[3/4] w-full";
    if (aspectRatio === '4:3') return "aspect-[4/3] w-full";
    if (aspectRatio === '16:9') return "aspect-[16/9] w-full";
    return "aspect-[16/9] w-full";
  };

  const labelClass = purposeColors[prompt.id] || 'bg-orange-500/20 text-orange-300 border-orange-500/30';

  return (
    <div className="flex flex-col gap-3 group relative">
      {/* Image Display Area */}
      <div className={`relative rounded-xl overflow-hidden bg-[#15151a] border border-white/10 shadow-lg ${getContainerClass()}`}>
        {generatedImage ? (
          <div className="relative w-full h-full">
            <img src={generatedImage} alt={prompt.purpose} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                title="放大檢視"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (generatedImage) {
                    const fileName = `landing-page-${prompt.id}-${aspectRatio.replace(':', 'x')}.png`;
                    downloadSingleImage(generatedImage, fileName);
                  }
                }}
                className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                title="下載"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <button
                onClick={handleGenerate}
                className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                title="重新生成"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative">
            {refImage && (
              <div className="absolute inset-0 opacity-20">
                <img src={refImage} className="w-full h-full object-cover blur-sm" alt="ref-bg" />
              </div>
            )}
            {isLoading ? (
              <Spinner className="w-8 h-8 text-orange-500 relative z-10" />
            ) : (
              <button
                onClick={handleGenerate}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all text-gray-500 border border-white/10 relative z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            )}
          </div>
        )}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm z-20 ${labelClass}`}>
          {prompt.purpose}
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold bg-black/40 text-gray-300 border border-white/10 backdrop-blur-sm z-20">
          {aspectRatio}
        </div>
      </div>

      {/* Controls Area */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{prompt.summary_zh}</h4>
          {/* Reference Image Button */}
          <div className="relative flex-shrink-0">
            <input type="file" ref={fileInputRef} onChange={handleRefImageUpload} className="hidden" accept="image/*" />
            <button
              onClick={() => refImage ? handleClearRefImage() : fileInputRef.current?.click()}
              className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors ${refImage ? 'border-red-500/50 text-red-400 hover:bg-red-900/20' : defaultRefImage ? 'border-green-500/50 text-green-400' : 'border-gray-600 text-gray-500 hover:text-white hover:border-gray-400'}`}
              title={refImage ? "移除參考圖" : defaultRefImage ? "已自動使用產品原圖，點擊可替換" : "上傳參考圖"}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {refImage ? '已參考' : defaultRefImage ? '產品圖' : '參考圖'}
            </button>
          </div>
        </div>

        {/* Prompt Display / Edit */}
        <div className="bg-[#1e1e24] rounded-lg p-2 border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-semibold text-gray-400">生成提示詞</label>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors"
              >
                編輯
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={handleSaveEdit} className="text-[10px] text-green-400 hover:text-green-300">儲存</button>
                <button onClick={handleCancelEdit} className="text-[10px] text-gray-400 hover:text-gray-300">取消</button>
              </div>
            )}
          </div>
          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full h-24 bg-[#0a0a0d] border border-orange-500/30 rounded p-2 text-[10px] text-gray-300 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          ) : (
            <div className="max-h-24 overflow-y-auto rounded bg-[#0a0a0d] border border-white/5 p-2">
              <pre className="text-[10px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {editText}
              </pre>
            </div>
          )}
        </div>

        {/* Aspect Ratio Selection */}
        <div className="bg-[#1e1e24] rounded p-2 border border-white/5">
          <label className="block text-[10px] text-gray-400 mb-1">圖片比例</label>
          <div className="grid grid-cols-4 gap-1">
            {(['16:9', '4:3', '1:1', '3:4'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => {
                  if (aspectRatio !== ratio) {
                    setAspectRatio(ratio);
                    clearImage();
                  }
                }}
                className={`py-1 px-2 rounded text-[10px] font-bold transition-colors ${
                  aspectRatio === ratio
                    ? 'bg-orange-600 text-white'
                    : 'bg-black/30 text-gray-400 hover:bg-black/50'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner className="w-4 h-4" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              {generatedImage ? '重新生成' : '生成圖片'}
            </>
          )}
        </button>

        {/* Error Display */}
        {(error || refImageError) && (
          <p className="text-red-400 text-xs text-center">{error || refImageError}</p>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        imageUrl={generatedImage}
        onClose={() => setIsModalOpen(false)}
        title={prompt.purpose}
      />
    </div>
  );
};

// --- Phase 5 Section ---

interface Phase5SectionProps {
  appState: AppState;
  landingPageImagePrompts: LandingPageImagePrompt[];
  productName: string;
  defaultRefImage?: string;
  onGenerateLPImagePrompts: () => void;
  onPromptsUpdate: (prompts: LandingPageImagePrompt[]) => void;
  onDownloadPhase5Report: () => void;
}

export const Phase5Section: React.FC<Phase5SectionProps> = ({
  appState,
  landingPageImagePrompts,
  productName,
  defaultRefImage,
  onGenerateLPImagePrompts,
  onPromptsUpdate,
  onDownloadPhase5Report,
}) => {
  const isGenerating = appState === AppState.GENERATING_LP_IMAGES;
  const hasPrompts = landingPageImagePrompts.length > 0;

  const handlePromptChange = (index: number, newPrompt: string) => {
    const updated = [...landingPageImagePrompts];
    updated[index] = { ...updated[index], prompt_en: newPrompt };
    onPromptsUpdate(updated);
  };

  return (
    <div className="mt-12 border-t border-white/10 pt-12">
      <div className="bg-[#1e1e24] rounded-2xl p-8 border border-orange-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-orange-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">5</div>
              <div>
                <h3 className="text-xl font-bold text-white">Phase 5: Landing Page 配圖</h3>
                <p className="text-gray-400 text-sm mt-1">根據 SEO Landing Page 提示詞內容，生成 6 張 Landing Page 配圖</p>
              </div>
            </div>
            {hasPrompts && (
              <button
                onClick={onDownloadPhase5Report}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下載圖片提示詞報告
              </button>
            )}
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Spinner className="w-12 h-12 text-orange-600" />
              <p className="text-orange-400 font-medium animate-pulse">正在為 Landing Page 規劃配圖提示詞...</p>
            </div>
          ) : !hasPrompts ? (
            <button
              onClick={onGenerateLPImagePrompts}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-orange-900/50 flex items-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              生成 Landing Page 配圖提示詞
            </button>
          ) : (
            <div className="mt-6">
              {/* Instruction Banner */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-200">
                  <strong>📷 操作指引：</strong>檢閱下方 6 張圖片的提示詞，可自由編輯。每張圖支援上傳參考圖，確認後手動按下「生成圖片」按鈕。
                </p>
              </div>

              {/* Image Prompt Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {landingPageImagePrompts.map((prompt, idx) => (
                  <LandingPageImageCard
                    key={`lp-${prompt.id}-${idx}`}
                    prompt={prompt}
                    index={idx}
                    defaultRefImage={defaultRefImage}
                    onPromptChange={handlePromptChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
