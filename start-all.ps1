param(
  [string]$DbContainerName = "reading-notes-db",
  [string]$DbUser = "postgres",
  [string]$DbPassword = "postgres",
  [string]$DbName = "reading_notes",
  [int]$DbPort = 5432
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"
$frontendDir = Join-Path $projectRoot "frontend"
$schemaFile = Join-Path $backendDir "db\schema.sql"
$backendEnv = Join-Path $backendDir ".env"
$frontendEnv = Join-Path $frontendDir ".env"

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing command: $name. Please install it first."
  }
}

Write-Host "==> Checking dependencies"
Require-Command "docker"
Require-Command "npm"

Write-Host "==> Checking database container"
$containerExists = docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch $DbContainerName

if (-not $containerExists) {
  Write-Host "==> Creating PostgreSQL container: $DbContainerName"
  docker run --name $DbContainerName `
    -e "POSTGRES_USER=$DbUser" `
    -e "POSTGRES_PASSWORD=$DbPassword" `
    -e "POSTGRES_DB=$DbName" `
    -p "${DbPort}:5432" `
    -d postgres:16 | Out-Null
} else {
  $isRunning = docker ps --format "{{.Names}}" | Select-String -SimpleMatch $DbContainerName
  if (-not $isRunning) {
    Write-Host "==> Starting existing container: $DbContainerName"
    docker start $DbContainerName | Out-Null
  } else {
    Write-Host "==> Database container is already running"
  }
}

Write-Host "==> Waiting for database readiness"
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  $health = docker exec $DbContainerName pg_isready -U $DbUser -d $DbName 2>$null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 1
}
if (-not $ready) {
  throw "Database startup timed out. Run: docker logs $DbContainerName"
}

Write-Host "==> Importing schema"
Get-Content -Raw $schemaFile | docker exec -i $DbContainerName psql -U $DbUser -d $DbName | Out-Null

if (-not (Test-Path $backendEnv)) {
  Write-Host "==> Creating backend\\.env"
  $jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
  @"
PORT=4000
DATABASE_URL=postgres://$DbUser`:$DbPassword@localhost:$DbPort/$DbName
JWT_SECRET=$jwt
"@ | Set-Content -Encoding UTF8 $backendEnv
}

if (-not (Test-Path $frontendEnv)) {
  Write-Host "==> Creating frontend\\.env"
  @"
VITE_API_BASE_URL=http://localhost:4000/api
"@ | Set-Content -Encoding UTF8 $frontendEnv
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
Write-Host "- DB Container: $DbContainerName"
