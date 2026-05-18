import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Command,
  FileText,
  Layers3,
  LoaderCircle,
  Menu,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { enqueueAnalyze, getTaskStatus, fetchDemoDashboard } from '@/lib/api';
import { vectorQuery, fetchSearchHistory, reindexVectors } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { dashboardMetrics, dashboardPipeline, heroBullets, improvementDrafts, interviewQuestionGroups, platformNavItems, skillGaps } from '@/data/platform';
import { usePlatformStore } from '@/store/usePlatformStore';
import type { DemoDashboardResponse, PlatformView, ThemeMode } from '@/types/resume';

type PlatformShellProps = {
  theme: ThemeMode;
  onThemeToggle: () => void;
};

const shellMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45 },
};

const featureContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const featureItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.2, 0.8, 0.2, 1] } as any },
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SparkBarChart({ points }: { points: DemoDashboardResponse['activity'] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="flex h-36 items-end gap-3">
      {points.map((point) => (
        <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
          <div className="flex h-full w-full items-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(18, (point.value / maxValue) * 100)}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-full rounded-t-2xl bg-gradient-to-t from-foreground via-foreground/80 to-foreground/40 shadow-[0_18px_45px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_45px_rgba(15,23,42,0.35)]"
            />
          </div>
          <div className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{point.label}</div>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ title, value, delta, detail }: { title: string; value: string; delta: string; detail: string }) {
  return (
    <Card className="group overflow-hidden border-border/70 bg-card/90 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</CardTitle>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">{delta}</span>
        </div>
        <div className="text-4xl font-semibold tracking-tight text-foreground">{value}</div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
    </div>
  );
}

function AuthPreview() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Clerk or Firebase Auth slots cleanly into this surface.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace email</div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">recruiting@company.com</div>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Password</div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">••••••••••••</div>
          </div>
          <Button className="w-full">Sign in <ArrowRight className="h-4 w-4" /></Button>
        </CardContent>
      </Card>
      <Card className="overflow-hidden border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Signup</CardTitle>
          <CardDescription>Tailored onboarding for recruiters, students, and individual professionals.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">Full name</div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">Work email</div>
          </div>
          <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">Team size and hiring goals</div>
          <Button variant="secondary" className="w-full">Create account <ChevronRight className="h-4 w-4" /></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function UploadPanel({
  selectedFile,
  isAnalyzing,
  onPickFile,
  onAnalyze,
  error,
  result,
}: {
  selectedFile: File | null;
  isAnalyzing: boolean;
  onPickFile: (file: File | null) => void;
  onAnalyze: (file: File) => Promise<void>;
  error: string | null;
  result: string | null;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const isAllowed = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx');
    if (!isAllowed) {
      onPickFile(null);
      return;
    }

    onPickFile(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className={cn('border-dashed border-border/80 bg-card/90 shadow-soft backdrop-blur-xl transition-all duration-300', isDragging && 'scale-[1.01] border-foreground')}>
        <CardHeader>
          <CardTitle>Resume Upload</CardTitle>
          <CardDescription>Drag and drop PDF or DOCX resumes, then start semantic analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <label
            className={cn(
              'group flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-[28px] border-2 border-dashed px-6 py-10 text-center transition-all duration-300',
              isDragging ? 'border-foreground bg-muted/60' : 'border-border bg-background/60 hover:border-foreground/40'
            )}
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              acceptFile(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              type="file"
              onChange={(event) => acceptFile(event.target.files?.[0])}
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-foreground text-background shadow-[0_20px_45px_rgba(15,23,42,0.18)]">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div className="mt-6 max-w-lg space-y-3">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">{selectedFile ? selectedFile.name : 'Drop your resume here'}</h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {selectedFile ? `${formatBytes(selectedFile.size)} · ${selectedFile.type || 'application/pdf'}` : 'Upload a polished resume to unlock ATS scoring, semantic matching, and rewrite suggestions.'}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button type="button" disabled={!selectedFile || isAnalyzing} onClick={() => selectedFile && void onAnalyze(selectedFile)}>
                {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {isAnalyzing ? 'Processing resume' : 'Analyze resume'}
              </Button>
              <Button type="button" variant="outline">
                View storage policy
              </Button>
            </div>
            <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
              {['PII redaction', 'Virus scan', 'Queue-backed processing'].map((value) => (
                <div key={value} className="rounded-2xl border border-border bg-background/80 px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {value}
                </div>
              ))}
            </div>
          </label>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-6">
        <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>Validation, upload, and analysis states stay visible at every step.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Upload validation', value: 'Passed', tone: 'text-emerald-500' },
              { label: 'Parser queue', value: isAnalyzing ? 'Running' : 'Idle', tone: 'text-foreground' },
              { label: 'AI enrichment', value: result ? 'Complete' : 'Waiting', tone: 'text-foreground' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn('font-semibold', item.tone)}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <AnimatePresence>
          {error ? (
            <motion.div {...shellMotion} className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive shadow-soft">
              {error}
            </motion.div>
          ) : null}
        </AnimatePresence>
        <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Selected File</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <div className="rounded-2xl border border-border bg-background px-4 py-4 text-sm text-foreground">
                {selectedFile.name}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                No file selected yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalysisView({ result }: { result: DemoDashboardResponse | null }) {
  const structuredItems = [
    { label: 'ATS readiness', value: result ? `${result.atsScore}%` : '92%' },
    { label: 'Semantic fit', value: result ? `${Math.round(result.semanticMatch * 100)}%` : '86%' },
    { label: 'Completion', value: result ? `${Math.round(result.completionRate * 100)}%` : '78%' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Scorecard</CardTitle>
          <CardDescription>ATS, semantic, and completeness signals in one place.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            {structuredItems.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-background px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Strengths</div>
            {['Strong measurable impact', 'Clear technical tooling', 'Concise project narratives'].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Missing Skills</CardTitle>
          <CardDescription>Signals ranked by hiring impact and role fit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {skillGaps.map((skill) => (
            <div key={skill.skill} className="rounded-2xl border border-border bg-background px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">{skill.skill}</div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{skill.priority}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{skill.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StudioView() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {improvementDrafts.map((draft) => (
        <Card key={draft.before} className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Rewrite Draft</CardTitle>
            <CardDescription>{draft.impact}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border bg-background px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Before</div>
              <p className="mt-2 text-sm leading-7 text-foreground">{draft.before}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-500">After</div>
              <p className="mt-2 text-sm leading-7 text-foreground">{draft.after}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InterviewView() {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {interviewQuestionGroups.map((group) => (
        <Card key={group.title} className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{group.title}</CardTitle>
            <CardDescription>{group.tone}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.questions.map((question) => (
              <div key={question} className="rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-foreground">
                {question}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SettingsView() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Profile, permissions, and workspace governance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Personal profile', 'Team workspace', 'Security preferences', 'Notification rules'].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4 text-sm">
              <span>{item}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Resume Versions</CardTitle>
          <CardDescription>Track growth across multiple drafts and role targets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {['v12 Product Analyst', 'v9 Backend Engineer', 'v6 Internship Focus'].map((version, index) => (
            <div key={version} className="rounded-2xl border border-border bg-background px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-foreground">{version}</div>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{index === 0 ? 'Active' : 'Archived'}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LandingView({ onJump }: { onJump: (view: PlatformView) => void }) {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-soft backdrop-blur-xl sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.09),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.16),_transparent_32%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-foreground" />
              AI Resume Intelligence Platform
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Resume intelligence for recruiters, hiring teams, and ambitious candidates.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Semantic matching, ATS diagnostics, rewrite suggestions, and interview prep in one premium dashboard built like a real SaaS product.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => onJump('dashboard')}>
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => onJump('upload')}>
                Try upload flow
                <UploadCloud className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {heroBullets.map((bullet) => (
                <div key={bullet} className="rounded-2xl border border-border bg-background/80 px-4 py-4 text-sm leading-6 text-muted-foreground">
                  {bullet}
                </div>
              ))}
            </div>
          </div>
          <Card className="relative overflow-hidden border-border/70 bg-background/90 shadow-soft backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Product snapshot</CardTitle>
              <CardDescription>High-signal analytics, low-noise presentation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-3xl border border-border bg-card px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Match score</span>
                  <span className="font-semibold text-foreground">92%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div className="h-2 w-[92%] rounded-full bg-foreground" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {['Semantic ranking', 'Version tracking', 'Interview prompts', 'AI rewrite studio'].map((item) => (
                  <div key={item} className="rounded-2xl border border-border bg-card px-4 py-4 text-sm text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6">
        <Card className="overflow-hidden border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
          <CardHeader className="border-b border-border/60 bg-gradient-to-r from-background/80 via-background/60 to-transparent">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <CardTitle>Feature Stack</CardTitle>
                <CardDescription>Each stage is shown as a product card, so the pipeline reads like a premium SaaS workspace instead of a checklist.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Parse', tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
                  { label: 'Rank', tone: 'bg-foreground/5 text-foreground' },
                  { label: 'Improve', tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-300' },
                ].map((item) => (
                  <span key={item.label} className={cn('rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', item.tone)}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <motion.div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" variants={featureContainer} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {dashboardPipeline.map((step, index) => {
                const Icon = step.status === 'complete' ? CheckCircle2 : step.status === 'active' ? BrainCircuit : Layers3;
                const toneClass =
                  step.status === 'complete'
                    ? 'border-emerald-500/20 bg-emerald-500/6'
                    : step.status === 'active'
                      ? 'border-foreground/15 bg-foreground/5'
                      : 'border-border bg-background';

                return (
                  <motion.div key={step.title} variants={featureItem} className={cn('group relative overflow-hidden rounded-[1.75rem] border p-5 transition-transform duration-300 hover:-translate-y-1', toneClass)}>
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    <div className="flex items-start justify-between gap-4">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-105', step.status === 'complete' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : step.status === 'active' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Step {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="mt-5 space-y-2">
                      <div className="text-lg font-semibold tracking-tight text-foreground">{step.title}</div>
                      <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
                    </div>
                    <div className="mt-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      <span className={cn('h-2.5 w-2.5 rounded-full', step.status === 'complete' ? 'bg-emerald-500' : step.status === 'active' ? 'bg-foreground' : 'bg-muted-foreground/70')} />
                      {step.status === 'complete' ? 'Completed' : step.status === 'active' ? 'In progress' : 'Queued'}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function PlatformShell({ theme, onThemeToggle }: PlatformShellProps) {
  const { activeView, setActiveView, selectedUpload, setSelectedUpload, setAnalysisError, setAnalysisPhase, setAnalysisResult, analysisPhase, analysisError, analysisResult } = usePlatformStore();
  const authUser = useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const demoQuery = useQuery({
    queryKey: ['demo-dashboard'],
    queryFn: fetchDemoDashboard,
    staleTime: 5 * 60 * 1000,
  });

  const dashboardData = demoQuery.data ?? null;

  const handleAnalyze = async (file: File) => {
    try {
      setAnalysisPhase('loading');
      setAnalysisError(null);

      const { task_id } = await enqueueAnalyze(file);

      // poll task status until complete
      let attempts = 0;
      const maxAttempts = 40; // ~1 minute with 1.5s interval
      while (attempts < maxAttempts) {
        // eslint-disable-next-line no-await-in-loop
        const statusPayload = await getTaskStatus(task_id);
        if (statusPayload.status === 'SUCCESS' || statusPayload.status === 'COMPLETED' || (statusPayload.result && statusPayload.result.status === 'ok')) {
          const res = statusPayload.result ?? statusPayload;
          setAnalysisResult({ filename: res.filename, extracted_text: res.extracted_text ?? '', feedback: res.feedback ?? '' });
          setAnalysisPhase('ready');
          setActiveView('analysis');
          return;
        }

        if (statusPayload.status === 'FAILURE' || (statusPayload.result && statusPayload.result.status === 'error')) {
          setAnalysisResult(null);
          setAnalysisPhase('error');
          setAnalysisError('Background analysis failed.');
          return;
        }

        // backoff
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1500));
        attempts += 1;
      }

      setAnalysisPhase('error');
      setAnalysisError('Analysis timed out. Please try again.');
    } catch (error) {
      setAnalysisResult(null);
      setAnalysisPhase('error');
      setAnalysisError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    }
  };

  const [semanticResults, setSemanticResults] = useState<any[] | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[] | null>(null);

  const activeContent = useMemo(() => {
    switch (activeView) {
      case 'landing':
        return <LandingView onJump={setActiveView} />;
      case 'dashboard':
        return (
          <div className="space-y-6">
                <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Semantic Search</CardTitle>
                    <CardDescription>Find similar resumes by description or role text.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <input placeholder="Search by role or skill..." id="semantic-query" className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm" />
                      <Button onClick={async () => {
                        const el = document.getElementById('semantic-query') as HTMLInputElement | null;
                        if (!el || !el.value) return;
                        try {
                          const res = await vectorQuery(el.value, 5);
                          setSemanticResults(res.results ?? []);
                          // refresh history
                          const hist = await fetchSearchHistory(10);
                          setSearchHistory(hist.history ?? []);
                        } catch (e) {
                          setSemanticResults([]);
                        }
                      }}>Search</Button>
                      {authUser?.role === 'admin' ? (
                        <Button variant="outline" onClick={async () => { try { const r = await reindexVectors(); setSemanticResults([{ info: `Reindexed ${r.reindexed} resumes` }]); } catch { setSemanticResults([{ info: 'Reindex failed' }]); } }}>Reindex</Button>
                      ) : (
                        <div className="rounded-2xl border border-border bg-background px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Admin only</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {semanticResults ? (
                  <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle>Search Results</CardTitle>
                      <CardDescription>Top semantic matches</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {semanticResults.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No results.</div>
                        ) : (
                          semanticResults.map((r: any, i: number) => (
                            <div key={String(r.id ?? i)} className="rounded-2xl border border-border bg-background px-4 py-3">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{r.metadata?.filename ?? r.id ?? 'Unknown'}</div>
                                <div className="text-sm text-muted-foreground">{typeof r.distance === 'number' ? r.distance.toFixed(3) : ''}</div>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">{(r.document ?? '').slice(0, 240)}</div>
                            </div>
                          ))
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <Button variant="outline" onClick={() => setSemanticResults(null)}>Close</Button>
                          <Button variant="ghost" onClick={async () => { const hist = await fetchSearchHistory(20); setSearchHistory(hist.history ?? []); }}>Refresh history</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
                {searchHistory && searchHistory.length > 0 ? (
                  <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle>Recent Searches</CardTitle>
                      <CardDescription>Previously run semantic queries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {searchHistory.map((q) => (
                          <button key={q.id} type="button" className="w-full text-left rounded-2xl border border-border bg-background px-4 py-3" onClick={async () => { const res = await vectorQuery(q.query_text, 5); setSemanticResults(res.results ?? []); }}>
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{q.query_text}</div>
                              <div className="text-xs text-muted-foreground">{q.result_count} results</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()}</div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
            <SectionHeader eyebrow="Dashboard" title="Recruiter-grade analytics at a glance" description="Track ATS score, semantic fit, resume completion, and improvement opportunities with a compact command center." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(dashboardData?.metrics ?? dashboardMetrics).map((metric) => (
                <MetricCard key={metric.title} {...metric} />
              ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Activity Trend</CardTitle>
                  <CardDescription>Shows score improvements over recent analysis cycles.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SparkBarChart points={dashboardData?.activity ?? [{ label: 'Jan', value: 38 }, { label: 'Feb', value: 52 }, { label: 'Mar', value: 67 }, { label: 'Apr', value: 71 }, { label: 'May', value: 86 }]} />
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Pipeline</CardTitle>
                  <CardDescription>Async stages from parse to rewrite.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(dashboardData?.pipeline ?? dashboardPipeline).map((step) => (
                    <div key={step.title} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-foreground">{step.title}</div>
                        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{step.status}</span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'upload':
        return (
          <div className="space-y-6">
            <SectionHeader eyebrow="Upload" title="Premium intake flow" description="Professional upload handling with validation, progress states, and queue-aware processing feedback." />
            <UploadPanel
              selectedFile={selectedUpload}
              isAnalyzing={analysisPhase === 'loading'}
              onPickFile={(file) => {
                setSelectedUpload(file, file ? { name: file.name, size: file.size, type: file.type } : null);
                setAnalysisError(null);
                setAnalysisResult(null);
                setAnalysisPhase('idle');
              }}
              onAnalyze={handleAnalyze}
              error={analysisError}
              result={analysisResult?.feedback ?? null}
            />
          </div>
        );
      case 'analysis':
        return (
          <div className="space-y-6">
            <SectionHeader eyebrow="Analysis" title="ATS score, semantic fit, and AI recommendations" description="Move from raw parsing to structured intelligence with strong signal separation." />
            <AnalysisView result={dashboardData} />
            <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Parsed feedback</CardTitle>
                <CardDescription>Compatible with existing backend feedback output.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-foreground">
                  {analysisResult?.feedback ?? 'Run analysis from the Upload page to surface extracted text and AI feedback here.'}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'studio':
        return (
          <div className="space-y-6">
            <SectionHeader eyebrow="Studio" title="AI improvement workspace" description="Rewrite bullets side-by-side and compare impact before publishing the next version." />
            <div className="grid gap-6 lg:grid-cols-2">
              {improvementDrafts.map((draft) => (
                <Card key={draft.before} className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>Rewrite Draft</CardTitle>
                    <CardDescription>{draft.impact}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Before</div>
                      <p className="mt-2 text-sm leading-7 text-foreground">{draft.before}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-500">After</div>
                      <p className="mt-2 text-sm leading-7 text-foreground">{draft.after}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'interview':
        return (
          <div className="space-y-6">
            <SectionHeader eyebrow="Interview prep" title="Prepared questions from your resume and role fit" description="Generate categorized interview prompts that can be bookmarked, saved, and reused across roles." />
            <div className="grid gap-6 xl:grid-cols-3">
              {interviewQuestionGroups.map((group) => (
                <Card key={group.title} className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle>{group.title}</CardTitle>
                    <CardDescription>{group.tone}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.questions.map((question) => (
                      <div key={question} className="rounded-2xl border border-border bg-background px-4 py-4 text-sm leading-7 text-foreground">
                        {question}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <SectionHeader eyebrow="Profile & settings" title="Workspace management, preferences, and version history" description="A clean admin surface for account management and resume iteration tracking." />
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>Profile, permissions, and workspace governance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Personal profile', 'Team workspace', 'Security preferences', 'Notification rules'].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-4 text-sm">
                      <span>{item}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Resume Versions</CardTitle>
                  <CardDescription>Track growth across multiple drafts and role targets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['v12 Product Analyst', 'v9 Backend Engineer', 'v6 Internship Focus'].map((version, index) => (
                    <div key={version} className="rounded-2xl border border-border bg-background px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-foreground">{version}</div>
                        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{index === 0 ? 'Active' : 'Archived'}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'auth':
        return (
          <div className="space-y-6">
            <SectionHeader eyebrow="Authentication" title="Login and signup experiences that feel product-native" description="This shell is ready for Clerk or Firebase Auth with polished auth screens." />
            <AuthPreview />
          </div>
        );
      default:
        return <LandingView onJump={setActiveView} />;
    }
  }, [activeView, analysisError, analysisPhase, analysisResult, dashboardData, selectedUpload, setActiveView, setAnalysisError, setAnalysisPhase, setAnalysisResult, setSelectedUpload]);

  return (
    <div className={cn('min-h-screen', theme === 'dark' ? 'dark' : '')}>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(148,163,184,0.16),_transparent_34%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(248,250,252,0.06),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(100,116,139,0.12),_transparent_32%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 p-4 sm:p-6 lg:p-8">
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="sticky top-6 space-y-6">
            <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-foreground">Resume Intelligence</div>
                    <div className="text-xs text-muted-foreground">AI-first ATS platform</div>
                  </div>
                </div>
                <div className="mt-6 space-y-1">
                  {platformNavItems.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setActiveView(item.value)}
                      className={cn(
                        'flex w-full items-start justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200 hover:bg-muted/60',
                        activeView === item.value && 'bg-foreground text-background hover:bg-foreground'
                      )}
                    >
                      <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className={cn('text-xs', activeView === item.value ? 'text-background/70' : 'text-muted-foreground')}>{item.description}</div>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/90 shadow-soft backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Environment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                  <span>Theme</span>
                  <Button size="sm" variant="outline" onClick={onThemeToggle}>
                    {theme === 'dark' ? 'Light' : 'Dark'}
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                  <span>Auth</span>
                  <span className="font-medium text-foreground">Clerk-ready</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3">
                  <span>Queue</span>
                  <span className="font-medium text-foreground">Celery-ready</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="sticky top-4 z-20 rounded-[1.75rem] border border-border/70 bg-card/85 px-4 py-3 shadow-soft backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 lg:hidden">
                <Button size="icon" variant="outline" onClick={() => setSidebarOpen((current) => !current)}>
                  <Menu className="h-4 w-4" />
                </Button>
                <div>
                  <div className="text-sm font-semibold text-foreground">Resume Intelligence</div>
                  <div className="text-xs text-muted-foreground">Premium AI SaaS</div>
                </div>
              </div>
              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Resume Intelligence Platform</div>
                  <div className="text-xs text-muted-foreground">Semantic ATS analysis and career growth</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveView('dashboard')}>
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="outline" size="icon" onClick={onThemeToggle} aria-label="Toggle theme">
                  {theme === 'dark' ? <Sparkles className="h-4 w-4" /> : <Command className="h-4 w-4" />}
                </Button>
                <Button size="sm" onClick={() => setActiveView('upload')}>
                  <UploadCloud className="h-4 w-4" />
                  New analysis
                </Button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div key={activeView} {...shellMotion} className="space-y-6">
                {activeContent}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <AnimatePresence>
          {sidebarOpen ? (
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="fixed inset-y-0 right-0 z-40 w-[92vw] max-w-sm border-l border-border bg-background/95 p-4 backdrop-blur-xl lg:hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">Navigation</div>
                  <div className="text-xs text-muted-foreground">Product surfaces</div>
                </div>
                <Button size="icon" variant="outline" onClick={() => setSidebarOpen(false)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-6 space-y-2">
                {platformNavItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setActiveView(item.value);
                      setSidebarOpen(false);
                    }}
                    className={cn('w-full rounded-2xl border border-border px-4 py-4 text-left', activeView === item.value && 'bg-foreground text-background')}
                  >
                    <div className="font-medium">{item.label}</div>
                    <div className={cn('text-xs', activeView === item.value ? 'text-background/70' : 'text-muted-foreground')}>{item.description}</div>
                  </button>
                ))}
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

