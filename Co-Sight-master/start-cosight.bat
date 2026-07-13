@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title 律枢 LexHub 一键启动

echo ========================================
echo        律枢 LexHub 一键启动
echo ========================================
echo.

where python >nul 2>nul
if not errorlevel 1 (
  python start_lexhub.py %*
  if errorlevel 1 (
    pause
    exit /b 1
  )
  exit /b 0
)

where py >nul 2>nul
if not errorlevel 1 (
  py -3 start_lexhub.py %*
  if errorlevel 1 (
    pause
    exit /b 1
  )
  exit /b 0
)

echo [错误] 未找到 Python 3.11+，请安装并加入 PATH。
pause
exit /b 1
