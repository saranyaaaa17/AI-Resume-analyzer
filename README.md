# AI Resume Analyzer

![AI Resume Analyzer](https://via.placeholder.com/800x400?text=AI+Resume+Analyzer)

## Project Overview
AI Resume Analyzer is a comprehensive platform designed to evaluate resumes against Job Descriptions (JDs), providing an ATS score, skill gaps, and interview preparation questions. The platform leverages advanced Generative AI and a robust backend to offer detailed insights to job seekers.

## Features
- **Authentication**: Secure signup, login, and logout.
- **Resume Upload**: Upload PDF resumes safely with validation.
- **AI Analysis**: 
  - ATS Score Calculation
  - Job Description Matching
  - AI Suggestions for Improvement
  - Custom Interview Questions
- **Responsive Dashboard**: Data-rich insights on both desktop and mobile devices.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS
- **Backend**: FastAPI, Python, SQLAlchemy
- **Database**: PostgreSQL (Supabase)
- **AI/LLM**: Gemini API
- **Deployment**: Google Cloud Run (Backend), Vercel (Frontend)

## Architecture Diagram
*(Add your Excalidraw or Draw.io architecture diagram here)*

## Setup Guide

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/saranyaaaa17/AI-Resume-analyzer.git
cd AI-Resume-analyzer
```

2. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

3. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Deployment Guide
Detailed deployment steps can be found in [DEPLOYMENT.md](DEPLOYMENT.md).

## Screenshots
*(Add your screenshots here)*

## Live Demo
- **Frontend**: [https://your-project.vercel.app](https://your-project.vercel.app)
- **Backend**: [https://backend.run.app](https://backend.run.app)
