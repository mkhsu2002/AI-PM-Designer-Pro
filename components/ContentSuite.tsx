
import React, { useState, useRef, useEffect } from 'react';
import { ContentPlan, ContentItem } from '../types';
import { useImageGeneration } from '../hooks/useImageGeneration';
import { useImageUpload } from '../hooks/useImageUpload';
import { Spinner } from './Spinner';
import { ImageModal } from './ImageModal';
import { downloadAllImages, downloadSingleImage } from '../utils/imageDownloader';
import { generateImageFileName } from '../utils/imageNaming';

interface ContentSuiteProps {
  plan: ContentPlan;
  onPlanUpdate: (updatedItems: ContentItem[]) => void; // Callback to update parent with edited text
  onDownloadReport?: () => void; // Callback for download report button
}

// --- SUB-COMPONENT: Script Editor Row ---
const ScriptEditorRow: React.FC<{ 
  item: ContentItem; 
  onChange: (id: string, field: keyof ContentItem, value: string) => void 
}> = ({ item, onChange }) => {
  return (
    <div className="bg-[#1e1e24] border border-white/5 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${item.ratio === '1:1' ? 'bg-blue-500/20 text-blue-300' : 'bg-pink-500/20 text-pink-300'}`}>
          {item.ratio} | {item.type.replace('_', ' ')}
        </span>
        <span className="text-xs text-gray-500">ID: {item.id}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Text Content */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">標題 (Headline)</label>
            <input 
              type="text" 
              value={item.title_zh}
              onChange={(e) => onChange(item.id, 'title_zh', e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">內文 (Copy)</label>
            <textarea 
              value={item.copy_zh}
              onChange={(e) => onChange(item.id, 'copy_zh', e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none resize-none h-20"
            />
          </div>
        </div>

        {/* Visual Prompt */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">視覺提示詞 (Prompt)</label>
          <textarea 
            value={item.visual_prompt_en}
            onChange={(e) => onChange(item.id, 'visual_prompt_en', e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-xs text-gray-300 focus:border-purple-500 focus:outline-none font-mono resize-none h-36"
          />
          <p className="text-[10px] text-gray-500 mt-1">摘要: {item.visual_summary_zh}</p>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: Production Card ---
const ProductionCard: React.FC<{ 
  item: ContentItem;
  index: number; // 在 items 陣列中的索引
  onImageChange?: (itemId: string, imageData: string | null) => void;
}> = ({ item, index, onImageChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storyAspectRatio, setStoryAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  
  // Determine the actual ratio to use
  const actualRatio = item.type === 'story_slide' ? storyAspectRatio : item.ratio;
  
  // 使用自訂 Hooks
  const { image, loading, error, generateImage, clearImage } = useImageGeneration();
  const { image: refImage, error: refImageError, uploadImage: uploadRefImage, clearImage: clearRefImage } = useImageUpload();

  // 當圖片改變時，通知父組件
  useEffect(() => {
    if (onImageChange) {
      onImageChange(item.id, image);
    }
  }, [image, item.id, onImageChange]);

  const handleGenerate = async () => {
    await generateImage(item.visual_prompt_en, actualRatio, refImage || undefined);
  };

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadRefImage(e.target.files[0]);
    }
  };
  
  const handleClearRefImage = () => {
    clearRefImage();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Styling based on ratio
  const getContainerClass = () => {
    if (actualRatio === '1:1') return "aspect-square w-full";
    if (actualRatio === '9:16') return "aspect-[9/16] w-full";
    if (actualRatio === '16:9') return "aspect-[16/9] w-full";
    return "aspect-[9/16] w-full";
  };
  
  const containerClass = getContainerClass();
  const labelClass = actualRatio === '1:1' ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-pink-500/20 text-pink-300 border-pink-500/30";

  return (
    <div className="flex flex-col gap-3 group relative">
        {/* Image Display Area */}
        <div className={`relative rounded-xl overflow-hidden bg-[#15151a] border border-white/10 shadow-lg ${containerClass}`}>
            {image ? (
                <div className="relative w-full h-full">
                    <img src={image} alt={item.title_zh} className="w-full h-full object-cover" />
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
                               if (image) {
                                 const fileName = generateImageFileName(item, index);
                                 downloadSingleImage(image, fileName);
                               }
                             }}
                             className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" 
                             title="下載單張"
                         >
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                         </button>
                         <button onClick={handleGenerate} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm" title="重繪">
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
                    
                    {loading ? (
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
                {actualRatio}
            </div>
        </div>

        {/* Controls Area */}
        <div className="space-y-2">
            <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-white leading-tight">{item.title_zh}</h4>
                {/* Individual Ref Upload */}
                <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleRefUpload} className="hidden" accept="image/*" />
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
            
            {/* Aspect Ratio Selection for Story Slides */}
            {item.type === 'story_slide' && (
                <div className="bg-[#1e1e24] rounded p-2 border border-white/5">
                    <label className="block text-[10px] text-gray-400 mb-1">圖片比例</label>
                    <div className="flex gap-1">
                        <button
                            onClick={() => {
                                if (storyAspectRatio !== '9:16') {
                                    setStoryAspectRatio('9:16');
                                    // 清除已生成的圖片，因為比例改變了
                                    clearImage();
                                }
                            }}
                            className={`flex-1 py-1 px-2 rounded text-[10px] font-bold transition-colors ${
                                storyAspectRatio === '9:16' 
                                    ? 'bg-pink-600 text-white' 
                                    : 'bg-black/30 text-gray-400 hover:bg-black/50'
                            }`}
                        >
                            9:16
                        </button>
                        <button
                            onClick={() => {
                                if (storyAspectRatio !== '16:9') {
                                    setStoryAspectRatio('16:9');
                                    // 比例改變時需要重新生成，但由使用者手動觸發
                                }
                            }}
                            className={`flex-1 py-1 px-2 rounded text-[10px] font-bold transition-colors ${
                                storyAspectRatio === '16:9' 
                                    ? 'bg-pink-600 text-white' 
                                    : 'bg-black/30 text-gray-400 hover:bg-black/50'
                            }`}
                        >
                            16:9
                        </button>
                    </div>
                </div>
            )}
            
            <p className="text-xs text-gray-400 line-clamp-2" title={item.copy_zh}>{item.copy_zh}</p>
            {(error || refImageError) && <p className="text-[10px] text-red-400">{error || refImageError}</p>}
        </div>

        {/* Image Modal */}
        <ImageModal
            isOpen={isModalOpen}
            imageUrl={image}
            onClose={() => setIsModalOpen(false)}
            title={item.title_zh}
        />
    </div>
  );
};

// --- MAIN COMPONENT ---
export const ContentSuite: React.FC<ContentSuiteProps> = ({ plan, onPlanUpdate, onDownloadReport }) => {
  const [mode, setMode] = useState<'review' | 'production'>('review');
  const [items, setItems] = useState<ContentItem[]>(plan.items);
  // 追蹤所有已生成的圖片：Map<itemId, base64ImageData>
  const [generatedImages, setGeneratedImages] = useState<Map<string, string>>(new Map());
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync with props if plan changes completely
  useEffect(() => {
    setItems(plan.items);
    setMode('review');
    setGeneratedImages(new Map()); // 重置圖片追蹤
  }, [plan]);

  // 處理單個圖片的狀態變化
  const handleImageChange = (itemId: string, imageData: string | null) => {
    setGeneratedImages(prev => {
      const newMap = new Map(prev);
      if (imageData) {
        newMap.set(itemId, imageData);
      } else {
        newMap.delete(itemId);
      }
      return newMap;
    });
  };

  // 批次下載所有圖片
  const handleDownloadAll = async () => {
    if (generatedImages.size === 0) {
      alert('目前沒有已生成的圖片可下載');
      return;
    }

    setIsDownloading(true);
    try {
      // 使用企劃名稱作為 ZIP 檔名（清理特殊字元）
      const zipFileName = plan.plan_name
        .replace(/[^\w\s-]/g, '') // 移除特殊字元
        .replace(/\s+/g, '-') // 空格轉換為連字號
        .toLowerCase() || 'marketing-assets';
      
      await downloadAllImages(generatedImages, items, zipFileName);
    } catch (error) {
      console.error('下載失敗:', error);
      alert(error instanceof Error ? error.message : '下載失敗，請稍候再試');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleItemChange = (id: string, field: keyof ContentItem, value: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setItems(newItems);
    onPlanUpdate(newItems); // Propagate changes up to App for export
  };

  const mainImages = items.filter(i => i.ratio === '1:1');
  const storySlides = items.filter(i => i.ratio === '9:16');

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Header & Mode Switch */}
        <div className="flex flex-col mb-8 gap-4 border-b border-white/10 pb-6">
            <div>
                <h2 className="text-2xl font-bold text-white serif mb-1">
                    {plan.plan_name}
                </h2>
                <p className="text-gray-400 text-sm">Content Suite Plan ({items.length} Assets)</p>
            </div>
            
            {/* 三個按鈕水平對齊排列 */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="bg-[#1a1a1f] p-1 rounded-lg flex items-center border border-white/10">
                    <button 
                        onClick={() => setMode('review')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'review' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        1. 腳本審閱 (Script)
                    </button>
                    <button 
                        onClick={() => setMode('production')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${mode === 'production' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        2. 圖片製作 (Production)
                    </button>
                </div>
                
                {onDownloadReport && (
                    <button 
                        onClick={onDownloadReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        下載全案策略報告 (.txt)
                    </button>
                )}
                
                {/* 一鍵下載所有圖片按鈕（僅在 Production 模式顯示） */}
                {mode === 'production' && (
                    <button 
                        onClick={handleDownloadAll}
                        disabled={isDownloading || generatedImages.size === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all font-bold border ${
                            isDownloading || generatedImages.size === 0
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-600'
                                : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500/30'
                        }`}
                        title={generatedImages.size === 0 ? '請先生成圖片' : `下載 ${generatedImages.size} 張圖片`}
                    >
                        {isDownloading ? (
                            <>
                                <Spinner className="w-4 h-4" />
                                打包中...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                下載所有圖片 {generatedImages.size > 0 && `(${generatedImages.size})`}
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>

        {/* MODE: SCRIPT REVIEW */}
        {mode === 'review' && (
            <div className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <p className="text-blue-200 text-sm font-bold mb-1">腳本審閱模式</p>
                        <p className="text-blue-300/70 text-xs">請在此階段確認並編輯所有圖片的文案與 AI 提示詞。確認無誤後，點擊右上角切換至「圖片製作」模式開始生成。</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white mb-4">A. 主圖規劃 (Square 1:1)</h3>
                    {mainImages.map(item => (
                        <ScriptEditorRow key={item.id} item={item} onChange={handleItemChange} />
                    ))}
                </div>
                
                <div>
                    <h3 className="text-lg font-bold text-white mb-4">B. 內容長圖規劃 (Stories 9:16)</h3>
                    {storySlides.map(item => (
                        <ScriptEditorRow key={item.id} item={item} onChange={handleItemChange} />
                    ))}
                </div>
                
                <div className="flex justify-end pt-4">
                    <button 
                        onClick={() => setMode('production')}
                        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                        確認定稿，進入製作 ▶
                    </button>
                </div>
            </div>
        )}

        {/* MODE: PRODUCTION */}
        {mode === 'production' && (
            <div>
                {/* Section 1: Main Images */}
                <div className="mb-12">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                        方形主圖 (Main Visuals)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {mainImages.map((item, idx) => {
                            const globalIndex = items.findIndex(i => i.id === item.id);
                            return (
                                <ProductionCard 
                                    key={item.id} 
                                    item={item} 
                                    index={globalIndex >= 0 ? globalIndex : idx}
                                    onImageChange={handleImageChange} 
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Section 2: Story Slides */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-pink-500 rounded-full"></span>
                        內容介紹組圖 (Story Suite)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {storySlides.map((item, idx) => {
                            const globalIndex = items.findIndex(i => i.id === item.id);
                            return (
                                <ProductionCard 
                                    key={item.id} 
                                    item={item} 
                                    index={globalIndex >= 0 ? globalIndex : idx}
                                    onImageChange={handleImageChange} 
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
