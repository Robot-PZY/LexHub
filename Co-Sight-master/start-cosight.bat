@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"
title Co-Sight Launcher

echo ========================================
echo            Co-Sight Launcher
echo ========================================
echo.

if not exist ".env" (
    if exist ".env_template" (
        copy /Y ".env_template" ".env" >nul
        echo [INFO] .env was missing and has been created from .env_template
        echo [INFO] Update model and search settings in .env if needed
        echo.
    ) else (
        echo [ERROR] .env_template was not found
        pause
        exit /b 1
    )
)

where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python was not found. Install Python 3.11 or newer first.
    pause
    exit /b 1
)

echo [1/3] Checking Python version...
python --version
echo.

echo [2/3] Checking key dependencies...
python -c "import fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
    echo [INFO] Missing dependencies detected. Installing requirements.txt ...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Dependency installation failed. Run: python -m pip install -r requirements.txt
        pause
        exit /b 1
    )
)
echo.

echo [3/3] Starting Co-Sight service...
echo [INFO] Open in browser: http://localhost:7788/cosight/
echo.

start "" "http://localhost:7788/cosight/"
python cosight_server\deep_research\main.py

endlocal
