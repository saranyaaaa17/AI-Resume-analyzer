export type ThemeMode = 'light' | 'dark';

export type AuthUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

export type PlatformView =
  | 'landing'
  | 'dashboard'
  | 'upload'
  | 'analysis'
  | 'studio'
  | 'interview'
  | 'settings'
  | 'auth';

export type NavItem = {
  label: string;
  value: PlatformView;
  description: string;
};

export type ResumeFile = {
  name: string;
  size: number;
  type: string;
};

export type AnalysisPhase = 'idle' | 'loading' | 'ready' | 'error';

export type ResumeAnalysisResponse = {
  filename: string;
  extracted_text: string;
  feedback: string;
};

export type DashboardMetric = {
  title: string;
  value: string;
  delta: string;
  detail: string;
};

export type ProgressStep = {
  title: string;
  description: string;
  status: 'complete' | 'active' | 'queued';
};

export type SkillGap = {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  note: string;
};

export type InterviewQuestionGroup = {
  title: string;
  tone: string;
  questions: string[];
};

export type ImprovementDraft = {
  before: string;
  after: string;
  impact: string;
};

export type DemoDashboardResponse = {
  portfolioScore: number;
  atsScore: number;
  semanticMatch: number;
  completionRate: number;
  metrics: DashboardMetric[];
  pipeline: ProgressStep[];
  skillGaps: SkillGap[];
  interviewGroups: InterviewQuestionGroup[];
  improvements: ImprovementDraft[];
  activity: Array<{ label: string; value: number }>;
};

export type ResultCardProps = {
  title: string;
  value: string;
};
