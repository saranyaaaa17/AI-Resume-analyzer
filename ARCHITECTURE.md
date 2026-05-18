# AI Resume Intelligence Platform Architecture

## Product Shape
A premium SaaS-style resume intelligence platform for recruiters, hiring teams, students, and professionals.

Primary surfaces:
- Landing and marketing site
- Auth entry points
- Recruiter dashboard
- Resume upload and processing flow
- Structured resume analysis and ATS scoring
- AI rewrite studio
- Interview question generator
- Settings and resume version tracking

## Frontend Architecture
- React + TypeScript + Tailwind CSS
- Zustand for UI/session state
- TanStack Query for server state and async loading
- Framer Motion for entrance, transitions, and interaction polish
- Reusable design system with cards, buttons, metrics, and shell layout

Recommended folder shape:
- src/components for shared UI and shell pieces
- src/pages for page-level views
- src/store for global UI state
- src/lib for API helpers and utilities
- src/data for mock/demo content
- src/types for domain contracts

## Backend Architecture
- FastAPI router-based API
- Service layer for parsing, AI feedback, and demo intelligence
- Compatibility preserved for existing /upload, /analyze, and /feedback endpoints
- Structured endpoint for richer dashboard data at /insights/demo
- New full analysis path at /analysis/full for advanced UI workflows

Recommended service boundaries:
- parse.py for file text extraction
- openai_service.py for LLM or heuristic feedback
- intelligence.py for ATS and semantic scoring helpers
- routes/ for thin request handlers only

## Data Model
Core entities:
- users
- resumes
- resume_versions
- job_descriptions
- analytics
- interview_questions
- ai_feedback
- upload_jobs

Suggested database relationships:
- One user owns many resumes
- One resume has many versions and many analyses
- One job description can be matched against many resumes
- Each analysis can generate feedback, questions, and version deltas

## AI Pipeline
Recommended pipeline:
1. Upload validation and secure storage
2. Text extraction from PDF or DOCX
3. Resume normalization and section parsing
4. Embedding generation for semantic search
5. JD matching and ATS scoring
6. Gap analysis and rewrite suggestions
7. Interview question generation
8. Version tracking and analytics aggregation

Recommended AI stack:
- Gemini or OpenAI for generation
- Vector store such as ChromaDB for semantic matching
- Redis or task queue for async jobs
- LangGraph or LangChain for multi-step orchestration

## Deployment Model
- Docker for local and production packaging
- Docker Compose for full-stack local development
- Google Cloud Run for stateless API and frontend services
- PostgreSQL managed outside the app container
- Optional Redis and worker service for background analysis jobs

## Production Notes
- Keep APIs versioned and additive
- Separate upload, analysis, and generation workloads
- Store files outside the app container
- Use signed URLs or object storage for production uploads
- Add auth, rate limiting, request validation, and audit logs before launch
- Cache dashboard summaries and expensive AI calls where possible
