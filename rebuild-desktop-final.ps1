# Script Definitivo para Reconstruir Loan Manager Desktop
# Version: 2.0 - Con validaciones robustas

$ErrorActionPreference = "Stop"

Write-Host "`n===============================================================" -ForegroundColor Cyan
Write-Host "  LOAN MANAGER - DESKTOP REBUILD AUTOMATICO v2.0             " -ForegroundColor Cyan  
Write-Host "===============================================================`n" -ForegroundColor Cyan

# FASE 1: PRE-VERIFICACIONES
Write-Host "[1/7] Verificando estado del sistema..." -ForegroundColor Yellow

# Verificar que no hay instancia de Electron corriendo
$electronProcesses = Get-Process | Where-Object {
    $_.ProcessName -like "*electron*" -or 
    $_.MainWindowTitle -like "*Loan Manager*"
}

if ($electronProcesses) {
    Write-Host "`n[ERROR] La aplicacion Loan Manager esta corriendo" -ForegroundColor Red
    Write-Host "   Procesos detectados:" -ForegroundColor Red
    $electronProcesses | ForEach-Object {
        Write-Host "   - PID $($_.Id): $($_.ProcessName)" -ForegroundColor Red
    }
    Write-Host "`n   Por favor cierra la aplicacion y ejecuta este script nuevamente.`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "   [OK] No hay instancias de la app corriendo" -ForegroundColor Green

# Verificar que existe el directorio de release
if (-not (Test-Path "release\win-unpacked")) {
    Write-Host "`n[ERROR] No se encontro el directorio 'release\win-unpacked'" -ForegroundColor Red
    Write-Host "   Ejecuta primero: npm run rebuild-desktop`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "   [OK] Directorio de release encontrado" -ForegroundColor Green

# FASE 2: INSTALACION DE DEPENDENCIAS
Write-Host "`n[2/7] Verificando herramienta 'asar'..." -ForegroundColor Yellow

$asarCommand = Get-Command asar -ErrorAction SilentlyContinue
if (-not $asarCommand) {
    Write-Host "   'asar' no esta instalado. Instalando globalmente..." -ForegroundColor Gray
    cmd /c "npm install -g asar --silent" 2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n[ERROR] No se pudo instalar asar" -ForegroundColor Red
        Write-Host "   Intenta manualmente: npm install -g asar`n" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "   [OK] asar instalado exitosamente" -ForegroundColor Green
}
else {
    Write-Host "   [OK] asar ya esta instalado" -ForegroundColor Green
}

# FASE 3: BUILD DEL FRONTEND
Write-Host "`n[3/7] Construyendo frontend de la aplicacion..." -ForegroundColor Yellow

# Limpiar dist anterior
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
}

cmd /c "npm run build" 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Fallo el build del frontend" -ForegroundColor Red
    Write-Host "   Revisa los errores ejecutando: npm run build`n" -ForegroundColor Yellow
    exit 1
}

$distFiles = Get-ChildItem -Path "dist" -Recurse -File | Measure-Object
Write-Host "   [OK] Build completado - $($distFiles.Count) archivos generados" -ForegroundColor Green

# FASE 4: EXTRACCION DE APP.ASAR
Write-Host "`n[4/7] Extrayendo app.asar..." -ForegroundColor Yellow

$asarPath = "release\win-unpacked\resources\app.asar"
$tempExtractPath = "temp_asar_extract"

# Limpiar extraccion anterior si existe
if (Test-Path $tempExtractPath) {
    Remove-Item -Path $tempExtractPath -Recurse -Force
}

# Hacer backup del asar original
$backupPath = "release\win-unpacked\resources\app.asar.backup"
if (-not (Test-Path $backupPath)) {
    Copy-Item -Path $asarPath -Destination $backupPath
    Write-Host "   [OK] Backup creado: app.asar.backup" -ForegroundColor Green
}

# Extraer
asar extract $asarPath $tempExtractPath 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] No se pudo extraer app.asar" -ForegroundColor Red
    exit 1
}

$extractedFiles = Get-ChildItem -Path $tempExtractPath -Recurse -File | Measure-Object
Write-Host "   [OK] Extraidos $($extractedFiles.Count) archivos" -ForegroundColor Green

# FASE 5: ACTUALIZACION DE ARCHIVOS
Write-Host "`n[5/7] Actualizando archivos modificados..." -ForegroundColor Yellow

# Actualizar frontend (dist -> asar)
Write-Host "   -> Copiando archivos de frontend..." -ForegroundColor Gray
Copy-Item -Path "dist\*" -Destination $tempExtractPath -Recurse -Force

# Actualizar archivos del servidor
Write-Host "   -> Actualizando archivos del servidor..." -ForegroundColor Gray

$serverFiles = @(
    @{ Source = "server\middleware\validation.js"; Dest = "release\win-unpacked\resources\server\middleware\validation.js" },
    @{ Source = "server\routes\clients.js"; Dest = "release\win-unpacked\resources\server\routes\clients.js" },
    @{ Source = "server\index.js"; Dest = "release\win-unpacked\resources\server\index.js" }
)

$updatedCount = 0
foreach ($file in $serverFiles) {
    if (Test-Path $file.Source) {
        $destDir = Split-Path $file.Dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path $file.Source -Destination $file.Dest -Force
        $fileName = Split-Path $file.Source -Leaf
        Write-Host "      [OK] $fileName" -ForegroundColor Gray
        $updatedCount++
    }
}

Write-Host "   [OK] Actualizados $updatedCount archivos del servidor" -ForegroundColor Green

# FASE 6: REEMPAQUETADO DE APP.ASAR
Write-Host "`n[6/7] Reempaquetando app.asar..." -ForegroundColor Yellow

# Eliminar asar antiguo
Remove-Item -Path $asarPath -Force

# Crear nuevo asar
asar pack $tempExtractPath $asarPath 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] No se pudo reempaquetar app.asar" -ForegroundColor Red
    Write-Host "   Restaurando backup..." -ForegroundColor Yellow
    Copy-Item -Path $backupPath -Destination $asarPath -Force
    exit 1
}

# Validar tamano
$newSize = (Get-Item $asarPath).Length
$newSizeMB = [math]::Round($newSize / 1MB, 2)

Write-Host "   [OK] app.asar reempaquetado - Tamano: $newSizeMB MB" -ForegroundColor Green

# FASE 7: LIMPIEZA
Write-Host "`n[7/7] Limpiando archivos temporales..." -ForegroundColor Yellow

Remove-Item -Path $tempExtractPath -Recurse -Force
Write-Host "   [OK] Archivos temporales eliminados" -ForegroundColor Green

# RESUMEN FINAL
Write-Host "`n===============================================================" -ForegroundColor Green
Write-Host "            REBUILD COMPLETADO EXITOSAMENTE                    " -ForegroundColor Green
Write-Host "===============================================================`n" -ForegroundColor Green

Write-Host "Ubicacion de la aplicacion:" -ForegroundColor Cyan
Write-Host "   $PWD\release\win-unpacked\Loan Manager.exe`n" -ForegroundColor White

Write-Host "Archivos actualizados:" -ForegroundColor Cyan
Write-Host "   [OK] Frontend completo (dist)" -ForegroundColor Gray
Write-Host "   [OK] validation.js (servidor)" -ForegroundColor Gray
Write-Host "   [OK] clients.js (rutas)" -ForegroundColor Gray
Write-Host "`n" -ForegroundColor White

Write-Host "Siguiente paso:" -ForegroundColor Cyan
Write-Host "   Ejecuta la aplicacion y prueba crear un cliente nuevo.`n" -ForegroundColor White

Write-Host "Backup disponible en:" -ForegroundColor Yellow
Write-Host "   release\win-unpacked\resources\app.asar.backup`n" -ForegroundColor Gray
