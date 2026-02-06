import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, DirectorOutput, ContentPlan, ContentItem, MarketAnalysis, ContentStrategy } from '../types';
import { LanguageMode, getLanguageMode, setLanguageMode as setStoredLanguageMode } from '../utils/languageMode';

interface AppContextType {
    // App State
    appState: AppState;
    setAppState: (state: AppState) => void;

    // User Inputs
    productName: string;
    setProductName: (name: string) => void;
    brandContext: string;
    setBrandContext: (context: string) => void;
    refCopy: string;
    setRefCopy: (copy: string) => void;

    // Image Data
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    imagePreview: string | null;
    setImagePreview: (preview: string | null) => void;

    // Results
    analysisResult: DirectorOutput | null;
    setAnalysisResult: (result: DirectorOutput | null) => void;
    activeRouteIndex: number;
    setActiveRouteIndex: (index: number) => void;

    // Phase 2
    contentPlan: ContentPlan | null;
    setContentPlan: (plan: ContentPlan | null) => void;
    editedPlanItems: ContentItem[];
    setEditedPlanItems: (items: ContentItem[]) => void;
    phase2GeneratedImages: Map<string, string>;
    setPhase2GeneratedImages: (images: Map<string, string>) => void;

    // Phase 3
    marketAnalysis: MarketAnalysis | null;
    setMarketAnalysis: (analysis: MarketAnalysis | null) => void;

    // Phase 4
    contentStrategy: ContentStrategy | null;
    setContentStrategy: (strategy: ContentStrategy | null) => void;

    // Settings
    languageMode: LanguageMode;
    setLanguageMode: (mode: LanguageMode) => void;
    hasKey: boolean;
    setHasKey: (has: boolean) => void;

    // Global Actions
    resetApp: () => void;
    persistCurrentState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State initialization
    const [appState, setAppState] = useState<AppState>(AppState.IDLE);
    const [productName, setProductName] = useState("");
    const [brandContext, setBrandContext] = useState("");
    const [refCopy, setRefCopy] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<DirectorOutput | null>(null);
    const [activeRouteIndex, setActiveRouteIndex] = useState(0);
    const [contentPlan, setContentPlan] = useState<ContentPlan | null>(null);
    const [editedPlanItems, setEditedPlanItems] = useState<ContentItem[]>([]);
    const [phase2GeneratedImages, setPhase2GeneratedImages] = useState<Map<string, string>>(new Map());
    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
    const [contentStrategy, setContentStrategy] = useState<ContentStrategy | null>(null);

    const [languageMode, setLanguageModeState] = useState<LanguageMode>(getLanguageMode());
    const [hasKey, setHasKey] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setHasKey(true);

        // Attempt to recover previous state if needed (Optional feature for v4.1)
        const savedState = localStorage.getItem('app_persistence_v4');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.productName) setProductName(parsed.productName);
                if (parsed.brandContext) setBrandContext(parsed.brandContext);
                // We don't restore massive JSON results to keep it snappier, 
                // but we could if requested.
            } catch (e) {
                console.error("Failed to restore app state", e);
            }
        }
    }, []);

    const setLanguageMode = (mode: LanguageMode) => {
        setStoredLanguageMode(mode);
        setLanguageModeState(mode);
    };

    const resetApp = () => {
        setAppState(AppState.IDLE);
        setAnalysisResult(null);
        setContentPlan(null);
        setEditedPlanItems([]);
        setMarketAnalysis(null);
        setContentStrategy(null);
        setPhase2GeneratedImages(new Map());
        // keep inputs for convenience or reset them too? Let's keep for now.
    };

    const persistCurrentState = () => {
        const stateToSave = {
            productName,
            brandContext,
            refCopy,
            lastUpdate: new Date().toISOString()
        };
        localStorage.setItem('app_persistence_v4', JSON.stringify(stateToSave));
    };

    const value: AppContextType = {
        appState, setAppState,
        productName, setProductName,
        brandContext, setBrandContext,
        refCopy, setRefCopy,
        selectedFile, setSelectedFile,
        imagePreview, setImagePreview,
        analysisResult, setAnalysisResult,
        activeRouteIndex, setActiveRouteIndex,
        contentPlan, setContentPlan,
        editedPlanItems, setEditedPlanItems,
        phase2GeneratedImages, setPhase2GeneratedImages,
        marketAnalysis, setMarketAnalysis,
        contentStrategy, setContentStrategy,
        languageMode, setLanguageMode,
        hasKey, setHasKey,
        resetApp, persistCurrentState
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within an AppProvider');
    return context;
};
