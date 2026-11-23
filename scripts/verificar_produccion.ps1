# Smoke-test del despliegue compilado de ReDTF (http://localhost:8000)
# Uso:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verificar_produccion.ps1
#   ... -Correo admin@redtf.com -Password admin123 [-OperadorCorreo service@redtf.com -OperadorPassword service123]
param(
  [string]$BaseUrl = "http://localhost:8000",
  [string]$Correo = "admin@redtf.com",
  [string]$Password = "admin123",
  [string]$OperadorCorreo = "",
  [string]$OperadorPassword = ""
)
$ErrorActionPreference = "Stop"
$resultados = @()

function Registrar($nombre, $ok, $detalle) {
  $script:resultados += [pscustomobject]@{ Prueba = $nombre; Estado = $(if ($ok) { "PASS" } else { "FAIL" }); Detalle = $detalle }
}

function Login($c, $p) {
  $body = "username=$([uri]::EscapeDataString($c))&password=$([uri]::EscapeDataString($p))"
  $r = Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/usuarios/login" -Body $body -ContentType "application/x-www-form-urlencoded"
  return $r.access_token
}

# 1) SPA compilada servida en el mismo origen
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing
  Registrar "SPA / (index.html compilado)" ($r.StatusCode -eq 200 -and $r.Content -match 'id="root"') ("status " + $r.StatusCode)
} catch { Registrar "SPA / (index.html compilado)" $false $_.Exception.Message }

# 2) Swagger disponible
try {
  $r = Invoke-WebRequest -Uri "$BaseUrl/docs" -UseBasicParsing
  Registrar "GET /docs" ($r.StatusCode -eq 200) ("status " + $r.StatusCode)
} catch { Registrar "GET /docs" $false $_.Exception.Message }

# 3) Login admin + token
$token = $null
try {
  $token = Login $Correo $Password
  Registrar "POST /api/usuarios/login (admin)" ([bool]$token) "token recibido"
} catch { Registrar "POST /api/usuarios/login (admin)" $false $_.Exception.Message }

if ($token) {
  $h = @{ Authorization = "Bearer $token" }

  # 4) Perfil con rol
  try {
    $p = Invoke-RestMethod -Uri "$BaseUrl/api/usuarios/perfil" -Headers $h
    Registrar "GET /api/usuarios/perfil" ($p.rol -eq "admin") ("rol=" + $p.rol)
  } catch { Registrar "GET /api/usuarios/perfil" $false $_.Exception.Message }

  # 5) Ordenes vigentes
  try {
    $o = Invoke-RestMethod -Uri "$BaseUrl/api/ordenes/" -Headers $h
    Registrar "GET /api/ordenes/" ($null -ne $o) ("ordenes=" + @($o).Count)
  } catch { Registrar "GET /api/ordenes/" $false $_.Exception.Message }

  # 6) Clientes y tarifas
  try {
    $c = Invoke-RestMethod -Uri "$BaseUrl/api/clientes/" -Headers $h
    $t = Invoke-RestMethod -Uri "$BaseUrl/api/tarifas/" -Headers $h
    Registrar "GET /api/clientes/ + /api/tarifas/" ($null -ne $c -and $null -ne $t) ("clientes=" + @($c).Count + " tarifas=" + @($t).Count)
  } catch { Registrar "GET /api/clientes/ + /api/tarifas/" $false $_.Exception.Message }

  # 7) Auditoria con total
  try {
    $a = Invoke-RestMethod -Uri "$BaseUrl/api/auditoria/?limit=1" -Headers $h
    Registrar "GET /api/auditoria/" ($null -ne $a.total) ("registros=" + $a.total)
  } catch { Registrar "GET /api/auditoria/" $false $_.Exception.Message }

  # 8) Reporte Excel (bytes reales)
  try {
    $x = Invoke-WebRequest -Uri "$BaseUrl/api/reportes/excel?tipo=ordenes" -Headers $h -UseBasicParsing
    $tipo = $x.Headers["Content-Type"]
    Registrar "GET /api/reportes/excel" ($x.StatusCode -eq 200 -and $x.RawContentLength -gt 1000 -and $tipo -match "spreadsheet") ("bytes=" + $x.RawContentLength)
  } catch { Registrar "GET /api/reportes/excel" $false $_.Exception.Message }

  # 9) Reporte PDF (bytes reales)
  try {
    $pdf = Invoke-WebRequest -Uri "$BaseUrl/api/reportes/pdf" -Headers $h -UseBasicParsing
    Registrar "GET /api/reportes/pdf" ($pdf.StatusCode -eq 200 -and $pdf.RawContentLength -gt 1000 -and $pdf.Headers["Content-Type"] -match "pdf") ("bytes=" + $pdf.RawContentLength)
  } catch { Registrar "GET /api/reportes/pdf" $false $_.Exception.Message }

  # 10) Regla de negocio: eliminar orden pagada debe dar 409
  try {
    $ordenes = Invoke-RestMethod -Uri "$BaseUrl/api/ordenes/" -Headers $h
    $pagada = @($ordenes) | Where-Object { $_.nom_estado_pago -eq "Pagada" } | Select-Object -First 1
    if ($pagada) {
      try {
        Invoke-RestMethod -Method Delete -Uri "$BaseUrl/api/ordenes/$($pagada.id_order)" -Headers $h | Out-Null
        Registrar "DELETE orden pagada -> 409" $false "borro la orden (regla no aplicada)"
      } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Registrar "DELETE orden pagada -> 409" ($code -eq 409) ("status " + $code)
      }
    } else {
      Registrar "DELETE orden pagada -> 409" $true "omitida: no hay orden pagada en los datos"
    }
  } catch { Registrar "DELETE orden pagada -> 409" $false $_.Exception.Message }
}

# 11) Rol operador: endpoint privilegiado debe dar 403
if ($OperadorCorreo -and $OperadorPassword) {
  try {
    $tokOp = Login $OperadorCorreo $OperadorPassword
    $hOp = @{ Authorization = "Bearer $tokOp" }
    try {
      Invoke-RestMethod -Uri "$BaseUrl/api/usuarios/" -Headers $hOp | Out-Null
      Registrar "Operador GET /api/usuarios/ -> 403" $false "acceso permitido (regla no aplicada)"
    } catch {
      $code = $_.Exception.Response.StatusCode.value__
      Registrar "Operador GET /api/usuarios/ -> 403" ($code -eq 403) ("status " + $code)
    }
  } catch { Registrar "Operador GET /api/usuarios/ -> 403" $false $_.Exception.Message }
}

Write-Host ""
$resultados | Format-Table -AutoSize | Out-String | Write-Host
$fallos = @($resultados | Where-Object { $_.Estado -eq "FAIL" }).Count
if ($fallos -gt 0) {
  Write-Host ("[FAIL] " + $fallos + " prueba(s) fallaron. Revisa el detalle arriba.")
  exit 1
}
Write-Host "[OK] Despliegue compilado verificado: SPA + API + reportes + reglas de negocio."
exit 0