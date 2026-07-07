@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "ROOT=%~dp0"
set "BACKEND_ENTRY=%ROOT%cosight_server\deep_research\main.py"
set "VENV=%ROOT%.venv"
set "PY_EXE=%VENV%\Scripts\python.exe"
set "PY="

cd /d "%ROOT%"
title Co-Sight Launcher

echo ========================================
echo            Co-Sight Launcher
echo ========================================
echo.

if not exist "%BACKEND_ENTRY%" (
    echo [ERROR] Backend entry not found: %BACKEND_ENTRY%
    pause
    exit /b 1
)

if not exist ".env" (
    if exist ".env_template" (
        copy /Y ".env_template" ".env" >nul
        echo [INFO] Created .env from .env_template
        echo [INFO] Update model and search settings in .env if needed
        echo.
    ) else (
        echo [ERROR] .env_template not found
        pause
        exit /b 1
    )
)

call :find_python
if not defined PY (
    echo [ERROR] Python 3.11+ required
    pause
    exit /b 1
)

echo [INFO] Using Python: %PY%
%PY% --version
echo.

if not exist "%PY_EXE%" (
    echo [INFO] Creating Python virtual environment...
    %PY% -m venv "%VENV%"
    if errorlevel 1 (
        echo [ERROR] Failed to create venv
        pause
        exit /b 1
    )
    echo.
)

"%PY_EXE%" -c "import importlib.util as u; mods=['fastapi','uvicorn','dotenv','chromadb','aiohttp']; missing=[m for m in mods if u.find_spec(m) is None]; import sys; sys.exit(1 if missing else 0)" >nul 2>nul
if errorlevel 1 (
    echo [INFO] Installing Python dependencies...
    "%PY_EXE%" -m pip install --upgrade pip setuptools wheel
    if errorlevel 1 (
        echo [ERROR] pip upgrade failed
        pause
        exit /b 1
    )
    "%PY_EXE%" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] pip install failed
        pause
        exit /b 1
    )
    "%PY_EXE%" -m pip install "uvicorn[standard]" python-dotenv
    if errorlevel 1 (
        echo [ERROR] Failed to install uvicorn / python-dotenv
        pause
        exit /b 1
    )
    echo.
)

netstat -ano | findstr /C:":7788 " | findstr LISTENING >nul 2>nul
if not errorlevel 1 (
    echo [WARN] Port 7788 already in use
    echo.
)

echo [INFO] Open in browser: http://localhost:7788/cosight/
echo.

start "" "http://localhost:7788/cosight/"
"%PY_EXE%" "%BACKEND_ENTRY%"

endlocal
exit /b 0

:find_python
where py >nul 2>nul
if not errorlevel 1 (
    py -3.11 -c "import sys; raise SystemExit(0 if sys.version_info>=(3,11) else 1)" >nul 2>nul
    if not errorlevel 1 set "PY=py -3.11" & goto :eof
    py -3 -c "import sys; raise SystemExit(0 if sys.version_info>=(3,11) else 1)" >nul 2>nul
    if not errorlevel 1 set "PY=py -3" & goto :eof
)
where python >nul 2>nul
if not errorlevel 1 (
    python -c "import sys; raise SystemExit(0 if sys.version_info>=(3,11) else 1)" >nul 2>nul
    if not errorlevel 1 set "PY=python" & goto :eof
)
where python3 >nul 2>nul
if not errorlevel 1 (
    python3 -c "import sys; raise SystemExit(0 if sys.version_info>=(3,11) else 1)" >nul 2>nul
    if not errorlevel 1 set "PY=python3" & goto :eof
)
goto :eof
