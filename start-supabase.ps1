param(
  [string]$DatabaseUrl = "",
  [string]$JwtSecret = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$backendEnv = Join-Path $backendDir ".env"
$frontendEnv = Join-Path $frontendDir ".env"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing command: $name. Please install it first."
  }
}

function New-RandomSecret([int]$length = 48) {
  return -join ((48..57) + (65..90) + (97..122) | Get-Random -Count $length | ForEach-Object { [char]$_ })
}

Write-Host "==> Checking dependencies"
Require-Command "npm"

if (-not (Test-Path $backendEnv)) {
  Write-Host "==> Creating backend\.env"
  if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    $DatabaseUrl = Read-Host "Enter Supabase DATABASE_URL"
  }
  if ([string]::IsNullOrWhiteSpace($JwtSecret)) {
    $JwtSecret = New-RandomSecret
  }
  @"
PORT=4000
DATABASE_URL=$DatabaseUrl
DATABASE_SSL=true
JWT_SECRET=$JwtSecret
"@ | Set-Content -Encoding UTF8 $backendEnv
} else {
  Write-Host "==> backend\.env exists, keeping current values"
}

if (-not (Test-Path $frontendEnv)) {
  Write-Host "==> Creating frontend\.env"
  @"
VITE_API_BASE_URL=http://localhost:4000/api
"@ | Set-Content -Encoding UTF8 $frontendEnv
} else {
  Write-Host "==> frontend\.env exists, keeping current values"
}

Write-Host "==> Installing backend dependencies"
Push-Location $backendDir
npm install | Out-Null
Pop-Location

Write-Host "==> Installing frontend dependencies"
Push-Location $frontendDir
npm install | Out-Null
Pop-Location

Write-Host "==> Starting backend and frontend in new windows"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$backendDir`"; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$frontendDir`"; npm run dev"

Write-Host ""
Write-Host "Done:"
Write-Host "- Frontend: http://localhost:5173"
Write-Host "- Backend: http://localhost:4000"
Write-Host "- Database: Supabase"
