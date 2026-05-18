import type { DashboardMetric, ImprovementDraft, InterviewQuestionGroup, NavItem, ProgressStep, SkillGap } from '@/types/resume';

export const platformNavItems: NavItem[] = [
  { label: 'Landing', value: 'landing', description: 'Premium product story' },
  { label: 'Dashboard', value: 'dashboard', description: 'Metrics and analytics' },
  { label: 'Upload', value: 'upload', description: 'Resume intake flow' },
  { label: 'Analysis', value: 'analysis', description: 'ATS and semantic insight' },
  { label: 'Studio', value: 'studio', description: 'Bullet rewriting' },
  { label: 'Interview', value: 'interview', description: 'Question generation' },
  { label: 'Settings', value: 'settings', description: 'Preferences and versions' },
  { label: 'Auth', value: 'auth', description: 'Login and signup surfaces' },
];

export const heroBullets = [
  'Semantic matching powered by embeddings and structured resume intelligence.',
  'Premium SaaS dashboard with ATS scoring, resume versions, and interview prep.',
  'FastAPI backend designed for async processing, workers, and secure API contracts.',
];

export const dashboardMetrics: DashboardMetric[] = [
  { title: 'ATS Score', value: '92%', delta: '+14%', detail: 'Keyword coverage, formatting, and section completeness.' },
  { title: 'Semantic Match', value: '0.86', delta: '+0.11', detail: 'Embedding similarity to the current role description.' },
  { title: 'Resume Versions', value: '12', delta: '+3', detail: 'Tracked drafts across different roles and seniority levels.' },
  { title: 'Interview Coverage', value: '18', delta: '+6', detail: 'HR, behavioral, technical, and project-based questions.' },
];

export const dashboardPipeline: ProgressStep[] = [
  { title: 'Parse & Normalize', description: 'Extract sections, contact info, skills, and work history.', status: 'complete' },
  { title: 'Semantic Rank', description: 'Compare resume embeddings against the job description.', status: 'active' },
  { title: 'Gap Analysis', description: 'Identify missing technologies, impact signals, and role fit.', status: 'queued' },
  { title: 'Rewrite Studio', description: 'Generate stronger bullets and tailored accomplishments.', status: 'queued' },
];

export const skillGaps: SkillGap[] = [
  { skill: 'Cloud deployment experience', priority: 'high', note: 'Add one project with AWS, GCP, or Azure delivery details.' },
  { skill: 'System design examples', priority: 'high', note: 'Show architecture tradeoffs, scaling decisions, and latency wins.' },
  { skill: 'Experimentation / A-B testing', priority: 'medium', note: 'Include product or growth metrics where relevant.' },
  { skill: 'Observability tooling', priority: 'low', note: 'Reference logging, tracing, or metrics in operational work.' },
];

export const interviewQuestionGroups: InterviewQuestionGroup[] = [
  {
    title: 'Behavioral',
    tone: 'Signal judgment, ownership, and collaboration.',
    questions: ['Tell me about a time you improved a process end-to-end.', 'Describe a conflict with stakeholders and how you resolved it.'],
  },
  {
    title: 'Technical',
    tone: 'Validate architecture and implementation depth.',
    questions: ['How would you design an async resume ingestion pipeline?', 'What tradeoffs would you make between vector search and keyword search?'],
  },
  {
    title: 'Project Based',
    tone: 'Connect the resume to shipped outcomes.',
    questions: ['Walk through the most impactful product you built.', 'Which metric moved because of your work?'],
  },
];

export const improvementDrafts: ImprovementDraft[] = [
  {
    before: 'Built a resume parser and improved the UI.',
    after: 'Architected a production-ready resume intelligence platform, reducing review time by 62% through automated parsing, ATS scoring, and semantic role matching.',
    impact: 'Sharper leadership, measurable impact, and stronger product framing.',
  },
  {
    before: 'Worked on backend APIs for upload and analysis.',
    after: 'Designed async FastAPI services with structured contracts, background processing, and AI-powered feedback workflows for scalable resume analysis.',
    impact: 'Communicates scale, reliability, and backend engineering maturity.',
  },
];