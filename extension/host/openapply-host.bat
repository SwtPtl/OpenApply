@echo off
setlocal

:: Get the directory where this script lives (extension\host\)
set "HOST_DIR=%~dp0"

:: The companion directory is one level up and then into companion
set "COMPANION_DIR=%HOST_DIR%..\..\companion"

:: Run the python script using the virtual environment
call "%COMPANION_DIR%\venv\Scripts\python.exe" "%COMPANION_DIR%\main.py"
