@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "SCRIPT_DIR=%~dp0"
set "REPO_ROOT=%SCRIPT_DIR%"
if defined LEXHUB_HOME set "REPO_ROOT=%LEXHUB_HOME%\"
set "ROOT=%REPO_ROOT%Co-Sight-master"
set "FRONTEND=%ROOT%\cosight_frontend"
set "BACKEND_ENTRY=%ROOT%\cosight_server\deep_research\main.py"
set "VENV=%ROOT%\.venv"
set "PY_EXE=%VENV%\Scripts\python.exe"
if not defined BACKEND_PORT set "BACKEND_PORT=7788"
if not defined FRONTEND_PORT set "FRONTEND_PORT=5174"
if not defined LEXHUB_HOST set "LEXHUB_HOST=127.0.0.1"
if not defined LEXHUB_OPEN_BROWSER set "LEXHUB_OPEN_BROWSER=1"
if not defined LEXHUB_SKIP_INSTALL set "LEXHUB_SKIP_INSTALL=0"
set "PY="

title LexHub Launcher

echo ========================================
echo              LexHub
echo ========================================
echo.
echo [INFO] Project root: %REPO_ROOT%
echo [INFO] Backend port: %BACKEND_PORT%
echo [INFO] Frontend port: %FRONTEND_PORT%
echo.

if not exist "%ROOT%\" (
    echo [ERROR] Co-Sight-master not found
    echo         Expected: %ROOT%
    pause
    exit /b 1
)

if not exist "%BACKEND_ENTRY%" (
    echo [ERROR] Backend entry not found
    echo         Expected: %BACKEND_ENTRY%
    pause
    exit /b 1
)

if not exist "%FRONTEND%\package.json" (
    echo [ERROR] Frontend project not found
    echo         Expected: %FRONTEND%\package.json
    pause
    exit /b 1
)

cd /d "%ROOT%"

if not exist ".env" (
    if exist ".env_template" (
        copy /Y ".env_template" ".env" >nul
        echo [INFO] Created .env from .env_template
        echo [INFO] Configure API keys in: %ROOT%\.env
        echo.
    ) else (
        echo [WARN] .env missing; backend may fail without API keys
        echo.
    )
)

call :find_python
if not defined PY (
    echo [ERROR] Python 3.11+ required
    echo         Install from https://www.python.org/downloads/
    echo         Enable "Add Python to PATH" during setup
    pause
    exit /b 1
)

echo [INFO] Using Python: %PY%
%PY% --version
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found - install Node.js 18+ with npm
    echo         https://nodejs.org/
    pause
    exit /b 1
)

node -e "const v=parseInt(process.versions.node.split('.')[0],10); if(v<18){console.error('Node '+process.versions.node); process.exit(1)}" >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js 18+ required
    node --version
    pause
    exit /b 1
)

echo [INFO] Using Node: 
node --version
echo.

call :check_port %BACKEND_PORT% "backend"
call :check_port %FRONTEND_PORT% "frontend"

if not exist "%PY_EXE%" (
    if "%LEXHUB_SKIP_INSTALL%"=="1" (
        echo [ERROR] Python virtual environment missing, but LEXHUB_SKIP_INSTALL=1
        echo         Expected: %PY_EXE%
        pause
        exit /b 1
    )
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
    if "%LEXHUB_SKIP_INSTALL%"=="1" (
        echo [ERROR] Python dependencies missing, but LEXHUB_SKIP_INSTALL=1
        echo         Run without LEXHUB_SKIP_INSTALL first, or install manually:
        echo         "%PY_EXE%" -m pip install -r requirements.txt
        pause
        exit /b 1
    )
    echo [INFO] Installing Python dependencies - first run may take several minutes...
    set "PIP_INDEX_ARGS="
    if defined LEXHUB_PIP_INDEX_URL set "PIP_INDEX_ARGS=--index-url !LEXHUB_PIP_INDEX_URL!"
    "%PY_EXE%" -m pip install !PIP_INDEX_ARGS! --upgrade pip setuptools wheel
    if errorlevel 1 (
        echo [ERROR] pip upgrade failed
        pause
        exit /b 1
    )
    "%PY_EXE%" -m pip install !PIP_INDEX_ARGS! -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] pip install -r requirements.txt failed
        echo         Try running manually: "%PY_EXE%" -m pip install -r requirements.txt
        pause
        exit /b 1
    )
    "%PY_EXE%" -m pip install !PIP_INDEX_ARGS! "uvicorn[standard]" python-dotenv
    if errorlevel 1 (
        echo [ERROR] Failed to install uvicorn / python-dotenv
        pause
        exit /b 1
    )
    echo.
)

if not exist "%FRONTEND%\node_modules\" (
    if "%LEXHUB_SKIP_INSTALL%"=="1" (
        echo [ERROR] Frontend dependencies missing, but LEXHUB_SKIP_INSTALL=1
        echo         Expected: %FRONTEND%\node_modules
        pause
        exit /b 1
    )
    echo [INFO] Installing frontend dependencies...
    pushd "%FRONTEND%"
    if defined LEXHUB_NPM_REGISTRY (
        call npm config set registry "%LEXHUB_NPM_REGISTRY%"
        if errorlevel 1 (
            echo [ERROR] Failed to set npm registry
            popd
            pause
            exit /b 1
        )
    )
    if exist "package-lock.json" (
        call npm ci
        if errorlevel 1 (
            echo [WARN] npm ci failed; trying npm install...
            call npm install
        )
    ) else (
        call npm install
    )
    if errorlevel 1 (
        echo [ERROR] npm install failed
        popd
        pause
        exit /b 1
    )
    popd
    echo.
)

echo [1/2] Starting backend  http://%LEXHUB_HOST%:%BACKEND_PORT%
start "LexHub Backend" cmd /k "cd /d \"%ROOT%\" && \"%PY_EXE%\" \"%BACKEND_ENTRY%\""

echo [2/2] Starting frontend  http://%LEXHUB_HOST%:%FRONTEND_PORT%
start "LexHub Frontend" cmd /k "cd /d \"%FRONTEND%\" && npm run dev -- --host %LEXHUB_HOST% --port %FRONTEND_PORT%"

echo.
echo [INFO] Waiting for services...
call :wait_for_backend
call :wait_for_frontend

if "%LEXHUB_OPEN_BROWSER%"=="1" (
    echo [INFO] Opening browser...
    start "" "http://%LEXHUB_HOST%:%FRONTEND_PORT%"
)

echo.
echo  Backend:  http://%LEXHUB_HOST%:%BACKEND_PORT%
echo  Frontend: http://%LEXHUB_HOST%:%FRONTEND_PORT%
echo  Admin:    http://%LEXHUB_HOST%:%FRONTEND_PORT%/admin
echo.
echo  Optional environment variables:
echo    BACKEND_PORT=7788
echo    FRONTEND_PORT=5174
echo    LEXHUB_PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
echo    LEXHUB_NPM_REGISTRY=https://registry.npmmirror.com
echo    LEXHUB_SKIP_INSTALL=1
echo    LEXHUB_OPEN_BROWSER=0
echo.
echo  Close Backend / Frontend windows to stop services
echo.

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

:check_port
netstat -ano | findstr /C:":%1 " | findstr LISTENING >nul 2>nul
if not errorlevel 1 (
    echo [WARN] Port %1 already in use - %2 may fail to start
    echo        Close the process using this port or change the port in config
    echo.
)
goto :eof

:wait_for_backend
set /a _tries=0
:wait_backend_loop
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://%LEXHUB_HOST%:%BACKEND_PORT%/api/nae-deep-research/v1/deep-research/server-timestamp' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto :eof
set /a _tries+=1
if !_tries! geq 30 (
    echo [WARN] Backend not ready after 60s - check LexHub Backend window for errors
    goto :eof
)
timeout /t 2 /nobreak >nul
goto :wait_backend_loop

:wait_for_frontend
set /a _tries=0
:wait_frontend_loop
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://%LEXHUB_HOST%:%FRONTEND_PORT%/' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto :eof
set /a _tries+=1
if !_tries! geq 20 (
    echo [WARN] Frontend not ready after 40s - check LexHub Frontend window for errors
    goto :eof
)
timeout /t 2 /nobreak >nul
goto :wait_frontend_loop
