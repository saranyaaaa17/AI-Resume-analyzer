export type ResultCardProps = {
  title: string;
  value: string;
};

export type ResumeFile = {
  name: string;
  size: number;
  type: string;
};

export type AnalysisMetric = {
  title: string;
  value: string;
};

export type ThemeMode = 'light' | 'dark';

export type AnalysisPhase = 'idle' | 'loading' | 'ready';
