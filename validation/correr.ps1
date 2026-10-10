# PollinationPro — rehace la validación contra R de principio a fin.
#   1. corre cada guion de referencia (ref_*.R) con Rscript, que deja su ref_*.js junto a él;
#   2. abre validation/index.html en un navegador sin ventana y guarda el informe en reporte.txt.
# Uso (desde la carpeta de la app):
#   powershell -ExecutionPolicy Bypass -File validation\correr.ps1 [-Rscript "C:\Program Files\R\R-4.4.2\bin\Rscript.exe"] [-SoloComparar]
# Paquetes de R que hacen falta: jsonlite, ks, cooccur, vegan, geosphere, sf, circular, CircStats, dismo, spaa,
# ecospat, terra, glmnet, pROC, bipartite y SpadeR.
param([string]$Rscript = '', [switch]$SoloComparar)
$ErrorActionPreference = 'Stop'
$aqui = $PSScriptRoot
if (-not $SoloComparar) {
  if (-not $Rscript) {
    $cmd = Get-Command Rscript -ErrorAction SilentlyContinue
    if ($cmd) { $Rscript = $cmd.Source }
    else {
      # de las versiones instaladas, la más reciente que tenga los paquetes
      $Rscript = Get-ChildItem "$env:ProgramFiles\R\R-*\bin\Rscript.exe" -ErrorAction SilentlyContinue | Sort-Object FullName -Descending |
        Where-Object { cmd /c "`"$($_.FullName)`" -e library(jsonlite);library(bipartite) >nul 2>nul"; $LASTEXITCODE -eq 0 } | Select-Object -First 1 -ExpandProperty FullName
    }
  }
  if (-not $Rscript) { throw 'No se encontró Rscript; indíquelo con -Rscript.' }
  Get-ChildItem $aqui -Recurse -Filter 'ref_*.R' | Sort-Object FullName | ForEach-Object {
    Write-Host ('R: ' + $_.Name)
    Push-Location $_.DirectoryName
    try { cmd /c "`"$Rscript`" $($_.Name) 2>nul" | Where-Object { $_ -match '^ref_' } | ForEach-Object { Write-Host ('   ' + $_) } } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw ('Falló ' + $_.Name) }
  }
}
$evaluar = Join-Path (Split-Path $aqui -Parent) 'manual\herramientas\evaluar.ps1'
$out = Join-Path $aqui 'reporte.txt'
& powershell -ExecutionPolicy Bypass -File $evaluar -ScriptFile (Join-Path $aqui 'esperar.js') -Page 'validation/index.html' -Wait 2000 -Out $out
Get-Content $out -Encoding UTF8 | Select-String -CaseSensitive -Pattern 'TOTAL' | ForEach-Object { Write-Host $_.Line.Trim() }
Write-Host ('Informe: ' + $out)
