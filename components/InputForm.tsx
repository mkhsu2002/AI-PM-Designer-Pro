import React from 'react';
import { AppState } from '../types';

interface InputFormProps {
  productName: string;
  brandContext: string;
  selectedFile: File | null;
  imagePreview: string | null;
  inputErrors: { productName?: string; brandContext?: string };
  appState: AppState;
  onProductNameChange: (value: string) => void;
  onBrandContextChange: (value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
}

export const InputForm: React.FC<InputFormProps> = ({
  productName,
  brandContext,
  selectedFile,
  imagePreview,
  inputErrors,
  appState,
  onProductNameChange,
  onBrandContextChange,
  onFileChange,
  onAnalyze,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {/* Left: Image Upload */}
    <div className="order-2 md:order-1">
      <label
        className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedFile ? 'border-purple-500 bg-[#15151a]' : 'border-gray-600 hover:border-gray-400 hover:bg-[#1a1a1f]'
          }`}
      >
        {imagePreview ? (
          <div className="w-full h-full relative group">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-4" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-medium">更換圖片</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="mb-2 text-sm text-gray-400">上傳產品圖片</p>
            <p className="text-xs text-gray-500">支援 JPG, PNG</p>
          </div>
        )}
        <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
      </label>
    </div>

    {/* Right: Text Inputs */}
    <div className="order-1 md:order-2 flex flex-col gap-4">
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">1. 產品名稱 (Product Name)</label>
        <input
          type="text"
          value={productName}
          onChange={(e) => onProductNameChange(e.target.value)}
          placeholder="例如：Sony WH-1000XM5, Aesop 洗手乳..."
          className={`w-full bg-[#15151a] border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors ${inputErrors.productName ? 'border-red-500' : 'border-white/10 focus:border-purple-500'
            }`}
        />
        {inputErrors.productName && (
          <p className="text-red-400 text-xs mt-1">{inputErrors.productName}</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">2. 品牌資訊 / 背景 (Context)</label>
        <textarea
          value={brandContext}
          onChange={(e) => onBrandContextChange(e.target.value)}
          placeholder="可輸入品牌官網網址(AI會分析網址文字) 或直接貼上品牌故事、核心價值..."
          className={`w-full bg-[#15151a] border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-colors h-40 resize-none text-sm leading-relaxed ${inputErrors.brandContext ? 'border-red-500' : 'border-white/10 focus:border-purple-500'
            }`}
        />
        {inputErrors.brandContext && (
          <p className="text-red-400 text-xs mt-1">{inputErrors.brandContext}</p>
        )}
      </div>

      {selectedFile && appState === AppState.IDLE && (
        <button
          onClick={onAnalyze}
          className="mt-auto w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
        >
          <span>開始 AI 分析</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      )}
    </div>
  </div>
);
