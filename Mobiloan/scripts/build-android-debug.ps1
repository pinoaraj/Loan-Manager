$ErrorActionPreference = 'Stop'

$jdkPath = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'
$sdkRoot = 'C:\Users\JP\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$shortRoot = 'C:\mob'
$shortProjectRoot = Join-Path $shortRoot 'Mobiloan'

if (-not (Test-Path $jdkPath)) {
    throw "JDK not found at $jdkPath"
}

if (-not (Test-Path $sdkRoot)) {
    throw "Android SDK root not found at $sdkRoot"
}

$env:NODE_ENV = 'development'
$env:JAVA_HOME = $jdkPath
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$jdkPath\bin;$sdkRoot\platform-tools;$env:Path"

$createdShortRoot = $false
$createdJunction = $false

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

Push-Location (Join-Path $shortProjectRoot 'android')
try {
    .\gradlew.bat assembleDebug
} finally {
    Pop-Location

    if ($createdJunction -and (Test-Path $shortProjectRoot)) {
        cmd /c rmdir $shortProjectRoot | Out-Null
    }

    if ($createdShortRoot -and (Test-Path $shortRoot) -and -not (Get-ChildItem -LiteralPath $shortRoot -Force | Select-Object -First 1)) {
        Remove-Item -LiteralPath $shortRoot -Force
    }
}
