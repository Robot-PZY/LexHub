@echo off
setlocal EnableExtensions
chcp 65001 >nul

set "ROOT=%~dp0Co-Sight-master"
set "FRONTEND=%ROOT%\cosight_frontend"
set "BACKEND_ENTRY=%ROOT%\cosight_server\deep_research\main.py"

title 律枢 LexHub 启动器

echo ========================================
echo           律枢 LexHub / Co-Sight
echo ========================================
echo.

if not exist "%ROOT%\" (
    echo [错误] 未找到 Co-Sight-master 目录
    echo        期望路径: %ROOT%
    pause
    exit /b 1
)

cd /d "%ROOT%"

if not exist ".env" (
    if exist ".env_template" (
        copy /Y ".env_template" ".env" >nul
        echo [提示] 已从 .env_template 创建 .env，请配置 API Key
        echo.
    ) else (
        echo [警告] 未找到 .env，后端可能因缺少 API Key 无法正常工作
        echo.
    )
)

where python >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.11+
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 npm，请先安装 Node.js
    pause
    exit /b 1
)

python -c "import fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
    echo [提示] 正在安装 Python 依赖...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo [错误] pip install 失败
        pause
        exit /b 1
    )
    echo.
)

if not exist "%FRONTEND%\node_modules\" (
    echo [提示] 正在安装前端依赖...
    pushd "%FRONTEND%"
    call npm install
    if errorlevel 1 (
        echo [错误] npm install 失败
        popd
        pause
        exit /b 1
    )
    popd
    echo.
)

echo [1/2] 启动后端  http://127.0.0.1:7788
start "LexHub Backend" cmd /k "cd /d \"%ROOT%\" && python \"%BACKEND_ENTRY%\""

echo [2/2] 启动前端  http://127.0.0.1:5174
start "LexHub Frontend" cmd /k "cd /d \"%FRONTEND%\" && npm run dev"

echo.
echo [提示] 等待服务启动...
timeout /t 5 /nobreak >nul

echo [提示] 正在打开浏览器...
start "" "http://127.0.0.1:5174"

echo.
echo  后端: http://127.0.0.1:7788
echo  前端: http://127.0.0.1:5174
echo  管理端: http://127.0.0.1:5174/admin
echo.
echo  关闭 Backend / Frontend 窗口即可停止服务
echo.

endlocal
