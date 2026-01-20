@echo off
cd /d "%~dp0"
echo Starting Loan Manager... > launch-log.txt
echo Current Directory: %CD% >> launch-log.txt

echo Starting Electron... >> launch-log.txt
set NODE_ENV=production
call npx electron . >> launch-log.txt 2>&1

IF %ERRORLEVEL% NEQ 0 (
    echo Electron exited with error code %ERRORLEVEL% >> launch-log.txt
    type launch-log.txt
    pause
)
