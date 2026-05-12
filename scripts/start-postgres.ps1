$ErrorActionPreference = "Stop"

$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$dataDir = "C:\Users\User\postgres-data"
$logFile = "C:\Users\User\postgres-log.txt"

if (!(Test-Path $pgCtl)) {
  Write-Error "Nao encontrei o pg_ctl em '$pgCtl'."
}

if (!(Test-Path $dataDir)) {
  Write-Error "Nao encontrei a pasta de dados do PostgreSQL em '$dataDir'."
}

& $pgCtl status -D $dataDir *> $null

if ($LASTEXITCODE -eq 0) {
  Write-Host "PostgreSQL ja esta em execucao."
  exit 0
}

Write-Host "Iniciando PostgreSQL local..."
& $pgCtl -D $dataDir -l $logFile start

if ($LASTEXITCODE -ne 0) {
  Write-Error "Nao foi possivel iniciar o PostgreSQL."
}

Write-Host "PostgreSQL pronto."
