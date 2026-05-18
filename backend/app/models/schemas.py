from typing import Literal

from pydantic import BaseModel, Field

class UploadResponse(BaseModel):
    filename: str

class MessageResponse(BaseModel):
    message: str


class AnalyzeResponse(BaseModel):
    filename: str
    extracted_text: str
    feedback: str


class FeedbackResponse(BaseModel):
    feedback: str


class DashboardMetric(BaseModel):
    title: str
    value: str
    delta: str
    detail: str


class PipelineStep(BaseModel):
    title: str
    description: str
    status: Literal['complete', 'active', 'queued']


class SkillGap(BaseModel):
    skill: str
    priority: Literal['high', 'medium', 'low']
    note: str


class InterviewQuestionGroup(BaseModel):
    title: str
    tone: str
    questions: list[str]


class ImprovementDraft(BaseModel):
    before: str
    after: str
    impact: str


class ActivityPoint(BaseModel):
    label: str
    value: int = Field(ge=0)


class DemoDashboardResponse(BaseModel):
    portfolioScore: int
    atsScore: int
    semanticMatch: float
    completionRate: float
    metrics: list[DashboardMetric]
    pipeline: list[PipelineStep]
    skillGaps: list[SkillGap]
    interviewGroups: list[InterviewQuestionGroup]
    improvements: list[ImprovementDraft]
    activity: list[ActivityPoint]


class ResumeIntelligenceResponse(BaseModel):
    filename: str
    extracted_text: str
    feedback: str
    ats_score: int
    semantic_match: float
    missing_skills: list[str]
    strengths: list[str]
