@echo off
setlocal

:: Get the directory where this script lives
set "HOST_DIR=%~dp0"

:: Update the path in the JSON file
echo { > "%HOST_DIR%com.openapply.companion.json"
echo   "name": "com.openapply.companion", >> "%HOST_DIR%com.openapply.companion.json"
echo   "description": "Companion service for OpenApply", >> "%HOST_DIR%com.openapply.companion.json"
echo   "path": "openapply-host.bat", >> "%HOST_DIR%com.openapply.companion.json"
echo   "type": "stdio", >> "%HOST_DIR%com.openapply.companion.json"
echo   "allowed_origins": [ >> "%HOST_DIR%com.openapply.companion.json"
echo     "chrome-extension://hechfijngknkhdkibbbhlgbicmghdjik/" >> "%HOST_DIR%com.openapply.companion.json"
echo   ] >> "%HOST_DIR%com.openapply.companion.json"
echo } >> "%HOST_DIR%com.openapply.companion.json"

:: Write to registry
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.openapply.companion" /ve /t REG_SZ /d "%HOST_DIR%com.openapply.companion.json" /f
REG ADD "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.openapply.companion" /ve /t REG_SZ /d "%HOST_DIR%com.openapply.companion.json" /f

echo OpenApply Companion host successfully registered for Chrome and Edge.
pause
