# Script to patch desktop app (Correct paths)
$ErrorActionPreference = "Stop"

Write-Host "Starting Patch Process..." -ForegroundColor Cyan

# Paths
$resourcesPath = "release\win-unpacked\resources"
$asarPath = "$resourcesPath\app.asar"
$tempExtractPath = "temp_asar_extract"
$distPath = "dist"

# Check dist
if (-not (Test-Path $distPath)) {
    Write-Host "Action: Building Frontend..." -ForegroundColor Yellow
    cmd /c "npm run build"
}

# Check asar
if (-not (Test-Path $asarPath)) {
    Write-Host "Error: app.asar not found at $asarPath" -ForegroundColor Red
    exit 1
}

# Cleanup temp
if (Test-Path $tempExtractPath) { Remove-Item -Path $tempExtractPath -Recurse -Force }

# Extract
Write-Host "Extracting app.asar..." -ForegroundColor Yellow
cmd /c "asar extract ""$asarPath"" ""$tempExtractPath"""

# Update Frontend (Inside ASAR)
Write-Host "Updating Frontend in ASAR..." -ForegroundColor Yellow
# Using logic from previous script: content of dist -> root of asar
Copy-Item -Path "$distPath\*" -Destination $tempExtractPath -Recurse -Force

# Pack ASAR
Write-Host "Repacking app.asar..." -ForegroundColor Yellow
cmd /c "asar pack ""$tempExtractPath"" ""$asarPath"""

# Update Server Files (External)
Write-Host "Updating Server Files (External)..." -ForegroundColor Yellow
$serverFiles = @(
    "server\middleware\validation.js",
    "server\routes\clients.js",
    "server\index.js"
)

foreach ($file in $serverFiles) {
    if (Test-Path $file) {
        $dest = Join-Path $resourcesPath $file
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item -Path $file -Destination $dest -Force
        Write-Host "  Updated $file -> $dest" -ForegroundColor Gray
    }
    else {
        Write-Host "  Warning: Source file $file not found" -ForegroundColor Red
    }
}

# Cleanup
Remove-Item -Path $tempExtractPath -Recurse -Force

Write-Host "Patch Complete!" -ForegroundColor Green
