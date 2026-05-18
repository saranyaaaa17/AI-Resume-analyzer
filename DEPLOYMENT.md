# Deployment Guide

This project is ready to deploy as a full-stack app with:
- Frontend on Vercel
- Backend on Google Cloud Run
- Database on Supabase PostgreSQL
- AI keys stored in environment variables only

## 1) Push the repo to GitHub

If the repository is not already on GitHub, initialize and push it:

```bash
git status
git add .
git commit -m "Prepare deployment guide and env templates"
git branch -M main
git remote add origin https://github.com/saranyaaaa17/AI-Resume-analyzer.git
git push -u origin main
```

If `origin` already exists, skip the `remote add` line and just push.

## 2) Prepare environment variables

Never commit secrets to GitHub.

### Frontend `.env`

```env
VITE_API_URL=
VITE_GEMINI_API_KEY=
```

### Backend `.env`

```env
DATABASE_URL=
JWT_SECRET=
GEMINI_API_KEY=
CHROMA_DB_PATH=
AUTO_CREATE_TABLES=true
```

Optional compatibility variable:

```env
OPENAI_API_KEY=
```

## 3) Set up PostgreSQL on Supabase

1. Create a new Supabase project.
2. Open the SQL editor and create the database/tables through the app's migrations or auto-create flow.
3. Copy the connection string from Supabase.
4. Set `DATABASE_URL` in the backend environment.

The backend models already cover these tables:
- `users`
- `resumes`
- `resume_versions`
- `job_descriptions`
- `analysis_results`
- `interview_questions`
- `analytics`
- `ai_feedback`
- `refresh_tokens`
- `refresh_token_audit`

## 4) Deploy backend first on Google Cloud Run

### A. Dockerize backend

The backend Dockerfile is already set for Cloud Run.

From the backend folder:

```bash
cd backend
docker build -t ai-resume-backend .
```

### B. Push image to Google Artifact Registry

Use Google Cloud CLI to authenticate, create a registry, tag the image, and push it.

Example flow:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker REGION-docker.pkg.dev
docker tag ai-resume-backend REGION-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPO/ai-resume-backend:latest
docker push REGION-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPO/ai-resume-backend:latest
```

### C. Deploy to Cloud Run

```bash
gcloud run deploy ai-resume-backend \
  --image REGION-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPO/ai-resume-backend:latest \
  --platform managed \
  --region REGION \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="YOUR_SUPABASE_CONNECTION_STRING",JWT_SECRET="YOUR_SECRET",GEMINI_API_KEY="YOUR_GEMINI_KEY",CHROMA_DB_PATH="/tmp/chroma_db",AUTO_CREATE_TABLES="true"
```

You will get a public backend URL.

## 5) Deploy frontend on Vercel

1. Import the GitHub repo into Vercel.
2. Add environment variables:
   - `VITE_API_URL=https://your-cloud-run-url`
   - `VITE_GEMINI_API_KEY=your_key` if you want the frontend to read it
3. Deploy.

You will get a live URL like:

```text
https://your-project.vercel.app
```

## 6) Connect frontend and backend

After backend deployment, update the frontend environment variable:

```env
VITE_API_URL=https://your-cloud-run-url
```

Then redeploy the frontend.

## 7) Production testing checklist

Test these flows after deployment:
- signup/login/logout
- valid PDF upload
- invalid file rejection
- ATS scoring
- JD matching
- AI feedback generation
- dashboard charts and analytics
- responsive layout on desktop/mobile

## 8) Branding checklist

Add:
- logo
- favicon
- polished typography
- custom colors
- loading animations

Make it feel like a startup, not a classroom assignment.

## 9) Proof screenshots for submission

Capture screenshots of:
- GitHub repository page showing commits and README
- Cloud Run service page showing the deployed backend
- Vercel deployment page and live site
- Dashboard
- Upload flow
- ATS analysis output
- AI suggestions
- Semantic matching
- Interview questions

## 10) Demo video

Record a short walkthrough using Loom or OBS Studio.

Recommended demo order:
1. Sign in
2. Upload a resume
3. Show ATS / AI feedback
4. Show dashboard and analytics
5. Show token/admin flow if needed
6. Open the live deployment URLs
