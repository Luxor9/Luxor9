<#
 Luxor9 DAN Bootstrap (PowerShell)
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)][string]$RepoUrl,
    [string]$Branch = "main",
    [switch]$AutoContinue,
    [switch]$Update,
    [string]$WorkDir = (Get-Location).Path,
    [int]$HealthTimeoutSec = 120
)
Write-Host "`n=== Luxor9 DAN Local Bootstrap (PowerShell) ===" -ForegroundColor Green
Write-Host "RepoUrl: $RepoUrl" -ForegroundColor Cyan
Write-Host "Branch : $Branch" -ForegroundColor Cyan
Write-Host "WorkDir: $WorkDir" -ForegroundColor Cyan

$repoName = (Split-Path -Path $RepoUrl -Leaf).Replace(".git","")
if (-not $repoName) { Write-Host "ERROR: bad RepoUrl" -ForegroundColor Red; exit 1 }
$targetPath = Join-Path $WorkDir $repoName

if (Test-Path $targetPath) {
  if ($Update) {
    Write-Host "Repo exists → pulling latest..." -ForegroundColor Cyan
    Push-Location $targetPath
    git fetch origin || { Write-Host "git fetch failed" -ForegroundColor Red; exit 1 }
    git checkout $Branch || { Write-Host "checkout failed" -ForegroundColor Red; exit 1 }
    git pull origin $Branch || { Write-Host "pull failed" -ForegroundColor Red; exit 1 }
    Pop-Location
  } else {
    Write-Host "Repo exists (skip clone)" -ForegroundColor Yellow
  }
} else {
  Write-Host "Cloning $RepoUrl ..." -ForegroundColor Cyan
  git clone -b $Branch $RepoUrl $targetPath || { Write-Host "Clone failed" -ForegroundColor Red; exit 1 }
}

$dockerPath = Join-Path $targetPath "infra/docker"
if (-not (Test-Path $dockerPath)) { Write-Host "ERROR: $dockerPath missing" -ForegroundColor Red; exit 1 }
Push-Location $dockerPath

if (-not (Test-Path ".env") -and (Test-Path "env.template")) { Copy-Item env.template .env -Force }
if (-not (Test-Path "secrets.env") -and (Test-Path "secrets.template")) { Copy-Item secrets.template secrets.env -Force }

function Set-RandSecret {
  param([string]$Key)
  $content = Get-Content secrets.env
  $found = $false
  for ($i=0; $i -lt $content.Length; $i++) {
    if ($content[$i] -match "^$Key=") {
      $found = $true
      if ($content[$i] -eq "$Key=") {
        $val = [Convert]::ToBase64String((New-Guid).ToByteArray()).Substring(0,24)
        $content[$i] = "$Key=$val"
      }
    }
  }
  if (-not $found) {
    $val = [Convert]::ToBase64String((New-Guid).ToByteArray()).Substring(0,24)
    Add-Content secrets.env "$Key=$val"
  } else {
    $content | Set-Content secrets.env
  }
}
Set-RandSecret JWT_SECRET
Set-RandSecret DB_PASSWORD
Set-RandSecret POSTGRES_PASSWORD

if (-not $AutoContinue) {
  Write-Host "Edit .env/secrets.env then keypress..." -ForegroundColor Yellow
  $null = [Console]::ReadKey($true)
}

$core = "docker-compose.core.yml"
$streams = "docker-compose.streams.yml"

Write-Host "Starting CORE services..." -ForegroundColor Cyan
docker compose -f $core up -d || { Write-Host "Core failed" -ForegroundColor Red; exit 1 }

Write-Host "Starting STREAM services..." -ForegroundColor Cyan
docker compose -f $core -f $streams up -d || { Write-Host "Streams failed" -ForegroundColor Red; exit 1 }

Write-Host "Waiting for containers healthy..." -ForegroundColor Cyan
$deadline = (Get-Date).AddSeconds($HealthTimeoutSec)
do {
  $containers = docker ps --format "{{.Names}} {{.Status}}"
  if ($containers -and ($containers -notmatch "unhealthy") -and ($containers -match "Up")) { break }
  Start-Sleep 3
} while ((Get-Date) -lt $deadline)

docker ps
Write-Host "Bootstrap complete." -ForegroundColor Green
Pop-Location
