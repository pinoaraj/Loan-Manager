[CmdletBinding()]
param(
    [string]$ApkPath,
    [switch]$AllowDebug
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$adbPath = 'C:\Users\JP\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe'
$releaseApk = Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'
$debugApk = Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
$packageName = 'com.mobiloan.app'

if (-not (Test-Path $adbPath)) {
    throw "adb not found at $adbPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem

$hasEmbeddedBundle = {
    param($path)

    $zip = [System.IO.Compression.ZipFile]::OpenRead($path)
    try {
        return [bool]($zip.Entries | Where-Object { $_.FullName -eq 'assets/index.android.bundle' })
    } finally {
        $zip.Dispose()
    }
}

if ($ApkPath) {
    if (-not (Test-Path $ApkPath)) {
        throw "APK not found at $ApkPath"
    }
    $resolvedApk = (Resolve-Path $ApkPath).Path
} elseif (Test-Path $releaseApk) {
    # Release is the only variant that works standalone on the phone (no Metro needed).
    $resolvedApk = $releaseApk
} elseif (Test-Path $debugApk) {
    $resolvedApk = $debugApk
} else {
    throw 'No APK found. Build one first with npm run android:release (standalone) or npm run android:debug.'
}

$standalone = & $hasEmbeddedBundle $resolvedApk

if (-not $standalone) {
    if (-not $AllowDebug) {
        throw @"
$resolvedApk has no embedded JS bundle, so it only runs with a Metro dev server on the PC.
For the standalone beta build run: npm run android:release
If you really want this development APK, rerun with -AllowDebug.
"@
    }

    Write-Warning "$resolvedApk needs Metro running on the PC; it is not usable standalone."
}

$devicesOutput = & $adbPath devices
$deviceLines = $devicesOutput | Where-Object { $_ -match '^\S+\s+device$' }

if (-not $deviceLines) {
    throw 'No Android device detected by adb. Connect the phone by USB, unlock it, and enable USB debugging.'
}

$deviceCount = @($deviceLines).Count
if ($deviceCount -gt 1) {
    throw "More than one Android device is connected ($deviceCount). Disconnect the others or install manually with adb install -r `"$resolvedApk`"."
}

& $adbPath install -r $resolvedApk

if ($LASTEXITCODE -ne 0) {
    throw "adb install failed with exit code $LASTEXITCODE"
}

& $adbPath shell monkey -p $packageName -c android.intent.category.LAUNCHER 1 | Out-Null

Write-Host "Installed $resolvedApk on the connected Android device."
