import React, { useState, useEffect, useRef } from 'react';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { useImageUpload } from '../hooks/useImageUpload';
import { Spinner } from './Spinner';
import { PromptData } from '../types';
import { ImageModal } from './ImageModal';
import { downloadSingleImage } from '../utils/imageDownloader';

interface PromptCardProps {
  data: PromptData;
  index: number;
}

export const PromptCard: React.FC<PromptCardProps> = ({ data, index }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [promptText, setPromptText] = useState(data.prompt_en);
  const [aspectRatio, setAspectRatio] = useState<'3:4' | '4:3' | '9:16' | '16:9'>('3:4');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 使用自訂 Hooks
  const { image: generatedImage, loading: isLoading, error, generateImage, clearImage } = useImageGeneration();
  const { image: refImage, error: refImageError, uploadImage: uploadRefImage, clearImage: clearRefImage } = useImageUpload();

  // Reset state when data prop changes (new route selected)
  useEffect(() => {
    setPromptText(data.prompt_en);
    clearImage();
    clearRefImage();
    setIsEditing(false);
    setAspectRatio('3:4');
  }, [data, clearImage, clearRefImage]);

  const handleGenerate = async () => {
    await generateImage(promptText, aspectRatio, refImage || undefined);
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

  // 根據比例獲取容器類別
  const getContainerClass = () => {
    if (aspectRatio === '1:1') return "aspect-square w-full";
    if (aspectRatio === '3:4') return "aspect-[3/4] w-full";
    if (aspectRatio === '4:3') return "aspect-[4/3] w-full";
    if (aspectRatio === '9:16') return "aspect-[9/16] w-full";
    if (aspectRatio === '16:9') return "aspect-[16/9] w-full";
    return "aspect-[3/4] w-full";
  };

  const containerClass = getContainerClass();
  const labelClass = aspectRatio === '9:16' || aspectRatio === '16:9' 
    ? "bg-pink-500/20 text-pink-300 border-pink-500/30" 
    : "bg-purple-500/20 text-purple-300 border-purple-500/30";

  return (
    <div className="flex flex-col gap-3 group relative">
      {/* Image Display Area */}
      <div className={`relative rounded-xl overflow-hidden bg-[#15151a] border border-white/10 shadow-lg ${containerClass}`}>
        {generatedImage ? (
          <div className="relative w-full h-full">
            <img src={generatedImage} alt={`概念圖 ${index + 1}`} className="w-full h-full object-cover" />
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
                    const fileName = `concept-poster-${index + 1}-${aspectRatio.replace(':', 'x')}.png`;
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
            {/* Ref Image Background (Blurred) */}
            {refImage && (
              <div className="absolute inset-0 opacity-20">
                <img src={refImage} className="w-full h-full object-cover blur-sm" alt="ref-bg" />
              </div>
            )}
            
            {isLoading ? (
              <Spinner className="w-8 h-8 text-purple-500 relative z-10" />
            ) : (
              <button 
                onClick={handleGenerate}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all text-gray-500 border border-white/10 relative z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            )}
          </div>
        )}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm z-20 ${labelClass}`}>
          {aspectRatio}
        </div>
      </div>

      {/* Controls Area */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{data.summary_zh || `概念圖 ${index + 1}`}</h4>
          {/* Reference Image Button */}
          <div className="relative flex-shrink-0">
            <input type="file" ref={fileInputRef} onChange={handleRefImageUpload} className="hidden" accept="image/*" />
            <button 
              onClick={() => refImage ? handleClearRefImage() : fileInputRef.current?.click()}
              className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors ${refImage ? 'border-red-500/50 text-red-400 hover:bg-red-900/20' : 'border-gray-600 text-gray-500 hover:text-white hover:border-gray-400'}`}
              title={refImage ? "移除參考圖" : "上傳參考圖 (Logo/風格)"}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {refImage ? '已參考' : '參考圖'}
            </button>
          </div>
        </div>

        {/* 生成提示詞檢視（執行前可檢視） */}
        <div className="bg-[#1e1e24] rounded-lg p-2 border border-white/5">
          <label className="block text-[10px] font-semibold text-gray-400 mb-1">生成提示詞</label>
          <div className="max-h-24 overflow-y-auto rounded bg-[#0a0a0d] border border-white/5 p-2">
            <pre className="text-[10px] text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {promptText}
            </pre>
          </div>
        </div>

        {/* Aspect Ratio Selection */}
        <div className="bg-[#1e1e24] rounded p-2 border border-white/5">
          <label className="block text-[10px] text-gray-400 mb-1">圖片比例</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => {
                if (aspectRatio !== '3:4') {
                  setAspectRatio('3:4');
                  clearImage();
                }
              }}
              className={`py-1 px-2 rounded text-[10px] font-bold transition-colors ${
                aspectRatio === '3:4' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-black/30 text-gray-400 hover:bg-black/50'
              }`}
            >
              3:4
            </button>
            <button
              onClick={() => {
                if (aspectRatio !== '4:3') {
                  setAspectRatio('4:3');
                  clearImage();
                }
              }}
              className={`py-1 px-2 rounded text-[10px] font-bold transition-colors ${
                aspectRatio === '4:3' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-black/30 text-gray-400 hover:bg-black/50'
              }`}
            >
              4:3
            </button>
            <button
              onClick={() => {
                if (aspectRatio !== '9:16') {
                  setAspectRatio('9:16');
                  clearImage();
                }
              }}
              className={`py-1 px-2 rounded text-[10px] font-bold transition-colors ${
                aspectRatio === '9:16' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-black/30 text-gray-400 hover:bg-black/50'
              }`}
            >
              9:16
            </button>
            <button
              onClick={() => {
                if (aspectRatio !== '16:9') {
                  setAspectRatio('16:9');
                  clearImage();
                }
              }}
              className={`py-1 px-2 rounded text-[10px] font-bold transition-colors ${
                aspectRatio === '16:9' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-black/30 text-gray-400 hover:bg-black/50'
              }`}
            >
              16:9
            </button>
          </div>
        </div>

        {/* Generate Button（提示詞已在上方顯示，執行前可檢視） */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner className="w-4 h-4" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              {generatedImage ? '重新生成' : '生成視覺圖'}
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
        title={`概念圖 ${index + 1}`}
      />
    </div>
  );
};
