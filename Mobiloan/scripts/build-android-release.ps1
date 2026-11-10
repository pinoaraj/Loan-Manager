[CmdletBinding()]
param(
    [string]$ApiUrl = '',
    [switch]$Clean,
    [switch]$SkipPrebuild
)

$ErrorActionPreference = 'Stop'

$jdkPath = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'
$sdkRoot = 'C:\Users\JP\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$shortRoot = 'C:\mob'
$shortProjectRoot = Join-Path $shortRoot 'Mobiloan'
$gradleTask = if ($Clean) { 'clean' } else { 'assembleRelease' }

if (-not (Test-Path $jdkPath)) {
    throw "JDK not found at $jdkPath"
}

if (-not (Test-Path $sdkRoot)) {
    throw "Android SDK root not found at $sdkRoot"
}

$env:NODE_ENV = 'production'
$env:JAVA_HOME = $jdkPath
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$jdkPath\bin;$sdkRoot\platform-tools;$env:Path"

if ($ApiUrl) {
    # Expo only inlines EXPO_PUBLIC_* values present at bundle time. Passing one
    # explicitly here lets us build a LAN-aware APK without editing .env.
    $env:EXPO_PUBLIC_API_URL = $ApiUrl.Trim().TrimEnd('/')
    Write-Host "Baking EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_URL"
}

# `android/` is generated and not tracked by git, so the manifest permissions for
# calendar and notifications only exist after a prebuild sync of `app.json`.
if (-not $SkipPrebuild) {
    Write-Host 'Syncing the native project from app.json (expo prebuild)...'
    Push-Location $projectRoot
    try {
        npx expo prebuild --platform android --no-install
        if ($LASTEXITCODE -ne 0) {
            throw "expo prebuild failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }
}

$manifestPath = Join-Path $projectRoot 'android\app\src\main\AndroidManifest.xml'
if (-not (Test-Path $manifestPath)) {
    throw "AndroidManifest.xml not found at $manifestPath. Run npm run android:prebuild first."
}

$manifest = Get-Content $manifestPath -Raw
foreach ($permission in @('android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR', 'android.permission.POST_NOTIFICATIONS')) {
    if ($manifest -notmatch [regex]::Escape($permission)) {
        throw "AndroidManifest.xml is missing $permission. The device build would fail at runtime; run npm run android:prebuild and check app.json."
    }
}

$createdShortRoot = $false
$createdJunction = $false
$workedInPlace = $false

# Windows native builds (CMake/codegen) fail on very long paths. Build through a
# short junction when the drive allows it, and fall back to the real path.
try {
    if (-not (Test-Path $shortRoot)) {
        New-Item -ItemType Directory -Path $shortRoot | Out-Null
        $createdShortRoot = $true
    }

    if (Test-Path $shortProjectRoot) {
        $existingItem = Get-Item $shortProjectRoot -Force
        if ($existingItem.LinkType -ne 'Junction') {
            throw "Short build path $shortProjectRoot already exists and is not a junction."
        }
    } else {
        New-Item -ItemType Junction -Path $shortProjectRoot -Target $projectRoot | Out-Null
        $createdJunction = $true
    }
} catch {
    Write-Warning "Could not prepare the short build path ($shortProjectRoot): $($_.Exception.Message)"
    Write-Warning 'Falling back to building in place; long-path errors may appear.'
    $shortProjectRoot = $projectRoot
    $workedInPlace = $true
}

Push-Location (Join-Path $shortProjectRoot 'android')
try {
    .\gradlew.bat $gradleTask

    if ($Clean) {
        .\gradlew.bat assembleRelease
    }
} finally {
    Pop-Location

    if ($createdJunction -and (Test-Path $shortProjectRoot)) {
        cmd /c rmdir $shortProjectRoot | Out-Null
    }

    if (-not $workedInPlace -and $createdShortRoot -and (Test-Path $shortRoot) -and -not (Get-ChildItem -LiteralPath $shortRoot -Force | Select-Object -First 1)) {
        Remove-Item -LiteralPath $shortRoot -Force
    }
}

$apkPath = Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path $apkPath)) {
    throw "Release build finished but no APK was found at $apkPath"
}

$apk = Get-Item $apkPath
$hash = (Get-FileHash $apkPath -Algorithm SHA256).Hash

$versionName = 'unknown'
$appJsonPath = Join-Path $projectRoot 'app.json'
$packageJsonPath = Join-Path $projectRoot 'package.json'

# app.json is the source of truth for the mobile app version (it also drives
# versionName in the native project), so prefer it over package.json.
if (Test-Path $appJsonPath) {
    $appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
    if ($appJson.expo.version) {
        $versionName = $appJson.expo.version
    }
}

if ($versionName -eq 'unknown' -and (Test-Path $packageJsonPath)) {
    $versionName = (Get-Content $packageJsonPath -Raw | ConvertFrom-Json).version
}

$distDir = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $distDir -Force | Out-Null
$deliveryPath = Join-Path $distDir "mobiloan-beta-$versionName.apk"
Copy-Item -LiteralPath $apkPath -Destination $deliveryPath -Force

Write-Host ''
Write-Host 'Release APK ready'
Write-Host "  Build output : $apkPath"
Write-Host "  Delivery copy: $deliveryPath"
Write-Host "  Size         : $([math]::Round($apk.Length / 1MB, 2)) MB"
Write-Host "  SHA256       : $hash"
if ($env:EXPO_PUBLIC_API_URL) {
    Write-Host "  Baked API URL: $env:EXPO_PUBLIC_API_URL"
} else {
    Write-Host '  Baked API URL: none (the APK resolves the backend at runtime)'
}
