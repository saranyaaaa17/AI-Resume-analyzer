import { useEffect, useState } from 'react';

import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { UploadBox } from '@/components/UploadBox';
import { ResultCard } from '@/components/ResultCard';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/layouts/MainLayout';
import type { AnalysisPhase, ResumeFile, ThemeMode } from '@/types/resume';

const analysisResults = [
  { title: 'ATS Score', value: '85%' },
  { title: 'Missing Skills', value: 'Docker, React Testing Library, CI/CD' },
  { title: 'Extracted Keywords', value: 'TypeScript, React, API Integration, Agile' },
  { title: 'Suggestions', value: 'Quantify outcomes, align keywords, sharpen summary' },
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
  const [selectedFile, setSelectedFile] = useState<ResumeFile | null>(null);

  useEffect(() => {
    if (analysisPhase !== 'loading') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAnalysisPhase('ready');
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [analysisPhase]);

  const handleFileSelected = (file: ResumeFile | null) => {
    setSelectedFile(file);

    if (file) {
      setAnalysisPhase('loading');
      return;
    }

    setAnalysisPhase('idle');
  };

  return (
    <MainLayout>
      <Navbar onThemeToggle={onThemeToggle} theme={theme} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Hero />

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
          </div>
        </section>

        <Separator />

        <section id="results" className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Analysis Results</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Mock ATS insights</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              These values are intentionally placeholder content. The layout is ready to receive real resume scoring data later.
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
