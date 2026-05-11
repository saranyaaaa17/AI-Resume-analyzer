import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type HeroProps = {
  canAnalyze: boolean;
  isAnalyzing: boolean;
  onAnalyzeResume: () => void;
};

export function Hero({ canAnalyze, isAnalyzing, onAnalyzeResume }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 shadow-soft sm:px-10 sm:py-16 lg:px-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.2),_transparent_35%)]" />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-5 inline-flex items-center rounded-full border border-border bg-background/70 px-4 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          AI-powered resume screening
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          AI Resume Analyzer
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Optimize your resume for ATS and recruiter screening using AI-powered analysis.
        </p>
        <div className="mt-8 flex justify-center">
          <Button
            disabled={!canAnalyze || isAnalyzing}
            onClick={onAnalyzeResume}
            size="lg"
            className="gap-2"
            type="button"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
