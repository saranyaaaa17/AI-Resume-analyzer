import { create } from 'zustand';

import type { AnalysisPhase, PlatformView, ResumeAnalysisResponse, ResumeFile, ThemeMode } from '@/types/resume';

type PlatformState = {
  theme: ThemeMode;
  activeView: PlatformView;
  analysisPhase: AnalysisPhase;
  analysisError: string | null;
  analysisResult: ResumeAnalysisResponse | null;
  selectedFile: ResumeFile | null;
  selectedUpload: File | null;
  setTheme: (theme: ThemeMode) => void;
  setActiveView: (view: PlatformView) => void;
  setSelectedUpload: (file: File | null, preview: ResumeFile | null) => void;
  setAnalysisPhase: (phase: AnalysisPhase) => void;
  setAnalysisError: (value: string | null) => void;
  setAnalysisResult: (value: ResumeAnalysisResponse | null) => void;
  resetAnalysis: () => void;
};

export const usePlatformStore = create<PlatformState>((set) => ({
  theme: 'light',
  activeView: 'landing',
  analysisPhase: 'idle',
  analysisError: null,
  analysisResult: null,
  selectedFile: null,
  selectedUpload: null,
  setTheme: (theme) => set({ theme }),
  setActiveView: (activeView) => set({ activeView }),
  setSelectedUpload: (selectedUpload, selectedFile) => set({ selectedUpload, selectedFile }),
  setAnalysisPhase: (analysisPhase) => set({ analysisPhase }),
  setAnalysisError: (analysisError) => set({ analysisError }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  resetAnalysis: () =>
    set({
      analysisPhase: 'idle',
      analysisError: null,
      analysisResult: null,
    }),
}));