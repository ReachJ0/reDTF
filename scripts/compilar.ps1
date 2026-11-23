# Compila el frontend de ReDTF a frontend/dist (produccion)
$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $raiz "frontend")

Write-Host "==> Instalando dependencias del frontend..."
if (-not (Test-Path "node_modules")) { npm install }
npm install -D "@tailwindcss/vite" | Out-Null

# Si quedo una config PostCSS de Tailwind v3, se aparta para que no compita con el plugin v4
Get-ChildItem -Filter "postcss.config.*" -ErrorAction SilentlyContinue | ForEach-Object {
  $contenido = Get-Content $_.FullName -Raw
  if ($contenido -match "tailwind") {
    Rename-Item -Path $_.FullName -NewName ($_.Name + ".bak") -Force
    Write-Host ("==> PostCSS legacy apartado: " + $_.Name + ".bak")
  }
}

Write-Host "==> Compilando (vite build)..."
npm run build
if (-not (Test-Path "dist/index.html")) { throw "El build no produjo dist/index.html" }

$peso = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ("[OK] Frontend compilado en frontend/dist ({0:N2} MB)" -f $peso)
Write-Host "==> Ejecuta scripts/ejecutar_produccion.ps1 para servir todo en http://localhost:8000"