# Sirve ReDTF completo (API + frontend compilado) en un solo proceso: http://localhost:8000
$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if (-not (Test-Path "frontend/dist/index.html")) {
  Write-Host "==> No hay build: compilando primero..."
  & (Join-Path $PSScriptRoot "compilar.ps1")
  Set-Location $raiz
}

$venv = Join-Path $raiz "venv\Scripts\Activate.ps1"
if (Test-Path $venv) { . $venv }

Write-Host ""
Write-Host ">> ReDTF en produccion: http://localhost:8000"
Write-Host "   API + docs:          http://localhost:8000/docs"
Write-Host "   Ctrl+C para detener"
Write-Host ""
uvicorn main:app --host 0.0.0.0 --port 8000