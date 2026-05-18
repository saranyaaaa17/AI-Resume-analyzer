param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [Parameter(Mandatory = $true)]
  [string]$Region,

  [Parameter(Mandatory = $true)]
  [string]$Repository,

  [Parameter(Mandatory = $true)]
  [string]$ServiceName,

  [Parameter(Mandatory = $true)]
  [string]$DatabaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$JwtSecret,

  [Parameter(Mandatory = $true)]
  [string]$GeminiApiKey,

  [string]$ChromaDbPath = "/tmp/chroma_db"
)

$ErrorActionPreference = 'Stop'

Write-Host 'Logging into gcloud and configuring project...'
gcloud auth login
gcloud config set project $ProjectId

Write-Host 'Configuring Docker auth for Artifact Registry...'
gcloud auth configure-docker "$Region-docker.pkg.dev"

$image = "$Region-docker.pkg.dev/$ProjectId/$Repository/ai-resume-backend:latest"

Write-Host 'Building backend image...'
docker build -t $image .

Write-Host 'Pushing backend image...'
docker push $image

Write-Host 'Deploying to Cloud Run...'
gcloud run deploy $ServiceName `
  --image $image `
  --platform managed `
  --region $Region `
  --allow-unauthenticated `
  --set-env-vars "DATABASE_URL=$DatabaseUrl,JWT_SECRET=$JwtSecret,GEMINI_API_KEY=$GeminiApiKey,CHROMA_DB_PATH=$ChromaDbPath,AUTO_CREATE_TABLES=true"

Write-Host 'Deployment complete.'
