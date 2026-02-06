import { useApp } from '../context/AppContext';
import { AppState } from '../types';
import { analyzeProductImage } from '../services/directorService';
import { generateContentPlan } from '../services/plannerService';
import { generateMarketAnalysis, generateContentStrategy } from '../services/analystService';
import { AppError, ErrorType } from '../utils/errorHandler';
import { validateProductName, validateBrandContext, validateRefCopy } from '../utils/validators';

export const useWorkflow = () => {
    const {
        appState, setAppState,
        productName, brandContext, refCopy,
        selectedFile, imagePreview,
        analysisResult, setAnalysisResult,
        activeRouteIndex,
        contentPlan, setContentPlan,
        setEditedPlanItems,
        marketAnalysis, setMarketAnalysis,
        setContentStrategy,
        phase2GeneratedImages
    } = useApp();

    const handleAnalyze = async () => {
        const nameVal = validateProductName(productName);
        const contextVal = validateBrandContext(brandContext);
        if (!nameVal.valid || !contextVal.valid) throw new Error("Validation failed");

        setAppState(AppState.ANALYZING);
        try {
            const result = await analyzeProductImage(selectedFile, productName, brandContext);
            setAnalysisResult(result);
            setAppState(AppState.RESULTS);
        } catch (e) {
            setAppState(AppState.ERROR);
            throw e;
        }
    };

    const handleGeneratePlan = async () => {
        if (!analysisResult) return;
        const route = analysisResult.marketing_routes[activeRouteIndex];
        const analysis = analysisResult.product_analysis;

        if (!validateRefCopy(refCopy).valid) throw new Error("Ref Copy invalid");

        setAppState(AppState.PLANNING);
        try {
            const plan = await generateContentPlan(route, analysis, refCopy, brandContext, imagePreview || undefined);
            setContentPlan(plan);
            setEditedPlanItems(plan.items);
            setAppState(AppState.SUITE_READY);
        } catch (e) {
            setAppState(AppState.ERROR);
            throw e;
        }
    };

    const handleGenerateMarketAnalysis = async () => {
        if (!analysisResult) return;
        setAppState(AppState.ANALYZING_MARKET);
        try {
            const route = analysisResult.marketing_routes[activeRouteIndex];
            const result = await generateMarketAnalysis(productName, route, imagePreview);
            setMarketAnalysis(result);
            setAppState(AppState.MARKET_READY);
        } catch (e) {
            setAppState(AppState.ERROR);
            throw e;
        }
    };

    const handleGenerateContentStrategy = async () => {
        if (!marketAnalysis || !analysisResult) return;
        setAppState(AppState.ANALYZING_CONTENT);
        try {
            const route = analysisResult.marketing_routes[activeRouteIndex];
            // simplified for demo, real implementation will pass more maps
            const result = await generateContentStrategy(marketAnalysis, productName, route);
            setContentStrategy(result);
            setAppState(AppState.CONTENT_READY);
        } catch (e) {
            setAppState(AppState.ERROR);
            throw e;
        }
    };

    return {
        handleAnalyze,
        handleGeneratePlan,
        handleGenerateMarketAnalysis,
        handleGenerateContentStrategy
    };
};
