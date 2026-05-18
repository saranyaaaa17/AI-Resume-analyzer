param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl,

  [string]$GeminiApiKey = ''
)

$ErrorActionPreference = 'Stop'

Write-Host 'Build the frontend with the production API URL set in Vercel or locally.'
Write-Host "API URL: $ApiUrl"
if ($GeminiApiKey) {
  Write-Host 'Gemini API key provided for local builds only.'
}

Write-Host 'Recommended Vercel env vars:'
Write-Host "VITE_API_URL=$ApiUrl"
Write-Host "VITE_GEMINI_API_KEY=$GeminiApiKey"
