$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$nextCmd = Join-Path $projectRoot "node_modules\.bin\next.cmd"
$startDbScript = Join-Path $PSScriptRoot "start-postgres.ps1"

Set-Location $projectRoot

& powershell -ExecutionPolicy Bypass -File $startDbScript

if (!(Test-Path $nextCmd)) {
  Write-Error "Nao encontrei o Next.js em '$nextCmd'. Rode 'npm install' primeiro."
}

Write-Host "Iniciando Vynce..."
& $nextCmd dev
