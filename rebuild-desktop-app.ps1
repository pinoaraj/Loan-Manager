# Script para reconstruir la aplicación desktop con los fixes
# Este script debe ejecutarse después de cerrar la aplicación desktop

Write-Host "`n🔧 Reconstruyendo Loan Manager Desktop`n" -ForegroundColor Cyan

# Paso 1: Verificar si la app está corriendo
Write-Host "Paso 1: Verificando si la aplicación está en ejecución..." -ForegroundColor Yellow
$loanProcess = Get-Process | Where-Object { $_.ProcessName -like "*electron*" -and $_.MainWindowTitle -like "*Loan*" }
if ($loanProcess) {
    Write-Host "⚠️  La aplicación desktop está corriendo" -ForegroundColor Red
    Write-Host "   Por favor cierra la aplicación y ejecuta este script nuevamente." -ForegroundColor Red
    exit 1
}
Write-Host "✅ No hay instancias corriendo`n" -ForegroundColor Green

# Paso 2: Construir la aplicación web
Write-Host "Paso 2: Construyendo la aplicación web..." -ForegroundColor Yellow
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al construir la aplicación web" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build web completado`n" -ForegroundColor Green

# Paso 3: Copiar archivos del servidor actualizados
Write-Host "Paso 3: Actualizando archivos del servidor en la app desktop..." -ForegroundColor Yellow
$serverFiles = @(
    "middleware\validation.js",
    "routes\clients.js"
)

foreach ($file in $serverFiles) {
    $source = "server\$file"
    $dest = "release\win-unpacked\resources\server\$file"
    
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $dest -Force
        Write-Host "  ✓ Actualizado: $file" -ForegroundColor Gray
    }
}
Write-Host "✅ Archivos del servidor actualizados`n" -ForegroundColor Green

# Paso 4: Usar asar para actualizar el frontend (si asar está instalado)
Write-Host "Paso 4: Intentando actualizar el frontend empaquetado..." -ForegroundColor Yellow
$asarInstalled = Get-Command asar -ErrorAction SilentlyContinue
if ($asarInstalled) {
    Write-Host "  Extrayendo app.asar..." -ForegroundColor Gray
    asar extract "release\win-unpacked\resources\app.asar" "temp_asar_extract" 2>&1 | Out-Null
    
    Write-Host "  Copiando archivos actualizados..." -ForegroundColor Gray
    Copy-Item -Path "dist\*" -Destination "temp_asar_extract\" -Recurse -Force
    
    Write-Host "  Reempaquetando app.asar..." -ForegroundColor Gray
    asar pack "temp_asar_extract" "release\win-unpacked\resources\app.asar" 2>&1 | Out-Null
    
    Write-Host "  Limpiando archivos temporales..." -ForegroundColor Gray
    Remove-Item -Path "temp_asar_extract" -Recurse -Force
    
    Write-Host "✅ Frontend actualizado correctamente`n" -ForegroundColor Green
}
else {
    Write-Host "⚠️  'asar' no está instalado globalmente" -ForegroundColor Yellow
    Write-Host "   Instalando asar..." -ForegroundColor Gray
    npm install -g asar 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Reintentando actualización del frontend..." -ForegroundColor Gray
        asar extract "release\win-unpacked\resources\app.asar" "temp_asar_extract" 2>&1 | Out-Null
        Copy-Item -Path "dist\*" -Destination "temp_asar_extract\" -Recurse -Force
        asar pack "temp_asar_extract" "release\win-unpacked\resources\app.asar" 2>&1 | Out-Null
        Remove-Item -Path "temp_asar_extract" -Recurse -Force
        Write-Host "✅ Frontend actualizado correctamente`n" -ForegroundColor Green
    }
    else {
        Write-Host "❌ No se pudo instalar asar" -ForegroundColor Red
        Write-Host "   El backend está actualizado pero el frontend necesita reconstrucción completa" -ForegroundColor Yellow
    }
}

Write-Host "🎉 Actualización completada!`n" -ForegroundColor Green
Write-Host "Ahora puedes abrir la aplicación desktop desde:" -ForegroundColor Cyan
Write-Host "release\win-unpacked\Loan Manager.exe`n" -ForegroundColor White
