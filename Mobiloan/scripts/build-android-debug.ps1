$ErrorActionPreference = 'Stop'

$jdkPath = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'
$sdkRoot = 'C:\Users\JP\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe'

if (-not (Test-Path $jdkPath)) {
    throw "JDK not found at $jdkPath"
}

if (-not (Test-Path $sdkRoot)) {
    throw "Android SDK root not found at $sdkRoot"
}

$env:JAVA_HOME = $jdkPath
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$jdkPath\bin;$sdkRoot\platform-tools;$env:Path"

Push-Location (Join-Path $PSScriptRoot '..\android')
try {
    .\gradlew.bat assembleDebug
} finally {
    Pop-Location
}
