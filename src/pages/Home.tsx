import { useState } from 'react';

import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { UploadBox } from '@/components/UploadBox';
import { ResultCard } from '@/components/ResultCard';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/layouts/MainLayout';
import type { AnalysisPhase, ResumeAnalysisResponse, ResumeFile, ThemeMode } from '@/types/resume';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const emptyResults = [
  { title: 'File', value: 'No file analyzed yet' },
  { title: 'Extracted Text', value: 'Upload a PDF and click Analyze Resume to see parsed text here.' },
  { title: 'AI Feedback', value: 'Feedback will appear after the backend responds.' },
];

type HomeProps = {
  theme: ThemeMode;
  onThemeToggle: () => void;
};

function AnalysisSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
          <div className="mt-6 h-8 w-28 animate-pulse rounded-2xl bg-muted" />
          <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-muted/80" />
        </div>
      ))}
    </div>
  );
}

export function Home({ theme, onThemeToggle }: HomeProps) {
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<ResumeFile | null>(null);
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);

  const handleFileSelected = (file: File | null) => {
    if (!file) {
      setSelectedUpload(null);
      setSelectedFile(null);
      setAnalysisResult(null);
      setAnalysisError(null);
      setAnalysisPhase('idle');
      return;
    }

    setSelectedUpload(file);
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisPhase('idle');
  };

  const handleAnalyzeResume = async () => {
    if (!selectedUpload) {
      setAnalysisError('Choose a PDF resume before analyzing.');
      setAnalysisPhase('error');
      return;
    }

    try {
      setAnalysisPhase('loading');
      setAnalysisError(null);

      const formData = new FormData();
      formData.append('file', selectedUpload);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(errorBody?.detail ?? 'Analysis failed. Please try again.');
      }

      const data = (await response.json()) as ResumeAnalysisResponse;
      setAnalysisResult(data);
      setAnalysisPhase('ready');
    } catch (error) {
      setAnalysisResult(null);
      setAnalysisPhase('error');
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    }
  };

  const analysisResults = analysisResult
    ? [
        { title: 'File', value: analysisResult.filename },
        { title: 'Extracted Text', value: analysisResult.extracted_text.slice(0, 180) || 'No text extracted' },
        { title: 'AI Feedback', value: analysisResult.feedback },
      ]
    : emptyResults;

  return (
    <MainLayout>
      <Navbar onThemeToggle={onThemeToggle} theme={theme} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Hero canAnalyze={Boolean(selectedUpload)} isAnalyzing={analysisPhase === 'loading'} onAnalyzeResume={handleAnalyzeResume} />

        <section id="how-it-works" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-fade-up [animation-delay:120ms]">
            <UploadBox isAnalyzing={analysisPhase === 'loading'} onFileSelected={handleFileSelected} />
          </div>
          <div className="flex flex-col gap-6">
            <div className="animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-soft [animation-delay:180ms]">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Workflow</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Fast frontend prototype, ready for backend integration</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The UI is structured for progressive enhancement: upload a file, visualize analysis output, and later wire real AI responses into the same presentation layer.
              </p>
            </div>
            <div className="animate-fade-up rounded-3xl border border-border bg-card p-6 shadow-soft [animation-delay:240ms]">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Status</p>
              <div className="mt-4 grid gap-3 text-sm text-foreground">
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span>Frontend</span>
                  <span className="font-medium">Complete</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span>Analysis Engine</span>
                  <span className="font-medium">Placeholder</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
                  <span>ATS Suggestions</span>
                  <span className="font-medium">Mock Data</span>
                </div>
              </div>
            </div>
            {selectedFile ? (
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Selected File</p>
                <div className="mt-4 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {selectedFile.name}
                </div>
              </div>
            ) : null}
            {analysisError ? (
              <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive shadow-soft">
                {analysisError}
              </div>
            ) : null}
          </div>
        </section>

        <Separator />

        <section id="results" className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Analysis Results</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Backend-powered ATS insights</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Click Analyze Resume to send the selected PDF to FastAPI and render the returned extracted text plus feedback.
            </p>
          </div>

          {analysisPhase === 'loading' ? (
            <AnalysisSkeleton />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {analysisResults.map((result) => (
                <ResultCard key={result.title} title={result.title} value={result.value} />
              ))}
            </div>
          )}
        </section>
      </main>
    </MainLayout>
  );
}
