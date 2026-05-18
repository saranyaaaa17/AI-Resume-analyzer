from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass

from ..models.schemas import DemoDashboardResponse

ROLE_KEYWORDS = {
    'python',
    'fastapi',
    'react',
    'typescript',
    'postgresql',
    'docker',
    'kubernetes',
    'gcp',
    'aws',
    'vector',
    'embedding',
    'semantic',
    'sql',
    'redis',
    'celery',
}


@dataclass(slots=True)
class ResumeIntelligence:
    filename: str
    extracted_text: str
    feedback: str
    ats_score: int
    semantic_match: float
    missing_skills: list[str]
    strengths: list[str]


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z0-9#+.-]+", text.lower())


def _score_text(text: str) -> tuple[int, float, list[str], list[str]]:
    tokens = _tokenize(text)
    token_counts = Counter(tokens)

    present_keywords = sorted({keyword for keyword in ROLE_KEYWORDS if keyword in text.lower()})
    missing_keywords = sorted(ROLE_KEYWORDS - set(present_keywords))

    measurable_impact = bool(re.search(r"\b\d+%|\b\d{2,}\b|\$\d+", text))
    section_signals = sum(1 for marker in ('experience', 'skills', 'projects', 'education', 'summary') if marker in text.lower())
    ats_score = min(100, 50 + len(present_keywords) * 4 + int(measurable_impact) * 12 + section_signals * 4)
    semantic_match = min(0.98, 0.45 + len(present_keywords) * 0.03 + (0.08 if measurable_impact else 0.0) + min(len(set(tokens)) / 200, 0.12))

    strengths = []
    if measurable_impact:
      strengths.append('Quantified impact is present')
    if present_keywords:
      strengths.append(f"Strong technical alignment across {len(present_keywords)} core keywords")
    if any(token_counts.get(token, 0) > 3 for token in ('built', 'led', 'improved', 'designed')):
      strengths.append('Action-oriented language is visible')

    return ats_score, round(semantic_match, 2), missing_keywords[:6], strengths[:3] or ['Well-structured content and a usable baseline for improvement']


def build_resume_intelligence(filename: str, extracted_text: str, feedback: str) -> ResumeIntelligence:
    ats_score, semantic_match, missing_skills, strengths = _score_text(extracted_text)
    return ResumeIntelligence(
        filename=filename,
        extracted_text=extracted_text,
        feedback=feedback,
        ats_score=ats_score,
        semantic_match=semantic_match,
        missing_skills=missing_skills,
        strengths=strengths,
    )


def build_demo_dashboard() -> DemoDashboardResponse:
    return DemoDashboardResponse(
        portfolioScore=91,
        atsScore=92,
        semanticMatch=0.86,
        completionRate=0.78,
        metrics=[
            {"title": "ATS Score", "value": "92%", "delta": "+14%", "detail": "Keyword coverage, formatting, and section completeness."},
            {"title": "Semantic Match", "value": "0.86", "delta": "+0.11", "detail": "Embedding similarity to the current role description."},
            {"title": "Resume Versions", "value": "12", "delta": "+3", "detail": "Tracked drafts across different roles and seniority levels."},
            {"title": "Interview Coverage", "value": "18", "delta": "+6", "detail": "HR, behavioral, technical, and project-based questions."},
        ],
        pipeline=[
            {"title": "Parse & Normalize", "description": "Extract sections, contact info, skills, and work history.", "status": "complete"},
            {"title": "Semantic Rank", "description": "Compare resume embeddings against the job description.", "status": "active"},
            {"title": "Gap Analysis", "description": "Identify missing technologies, impact signals, and role fit.", "status": "queued"},
            {"title": "Rewrite Studio", "description": "Generate stronger bullets and tailored accomplishments.", "status": "queued"},
        ],
        skillGaps=[
            {"skill": "Cloud deployment experience", "priority": "high", "note": "Add one project with AWS, GCP, or Azure delivery details."},
            {"skill": "System design examples", "priority": "high", "note": "Show architecture tradeoffs, scaling decisions, and latency wins."},
            {"skill": "Experimentation / A-B testing", "priority": "medium", "note": "Include product or growth metrics where relevant."},
            {"skill": "Observability tooling", "priority": "low", "note": "Reference logging, tracing, or metrics in operational work."},
        ],
        interviewGroups=[
            {
                "title": "Behavioral",
                "tone": "Signal judgment, ownership, and collaboration.",
                "questions": [
                    "Tell me about a time you improved a process end-to-end.",
                    "Describe a conflict with stakeholders and how you resolved it.",
                ],
            },
            {
                "title": "Technical",
                "tone": "Validate architecture and implementation depth.",
                "questions": [
                    "How would you design an async resume ingestion pipeline?",
                    "What tradeoffs would you make between vector search and keyword search?",
                ],
            },
            {
                "title": "Project Based",
                "tone": "Connect the resume to shipped outcomes.",
                "questions": ["Walk through the most impactful product you built.", "Which metric moved because of your work?"],
            },
        ],
        improvements=[
            {
                "before": "Built a resume parser and improved the UI.",
                "after": "Architected a production-ready resume intelligence platform, reducing review time by 62% through automated parsing, ATS scoring, and semantic role matching.",
                "impact": "Sharper leadership, measurable impact, and stronger product framing.",
            },
            {
                "before": "Worked on backend APIs for upload and analysis.",
                "after": "Designed async FastAPI services with structured contracts, background processing, and AI-powered feedback workflows for scalable resume analysis.",
                "impact": "Communicates scale, reliability, and backend engineering maturity.",
            },
        ],
        activity=[
            {"label": "Jan", "value": 38},
            {"label": "Feb", "value": 52},
            {"label": "Mar", "value": 67},
            {"label": "Apr", "value": 71},
            {"label": "May", "value": 86},
        ],
    )