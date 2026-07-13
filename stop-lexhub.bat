@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

where python >nul 2>nul
if not errorlevel 1 (
  python "Co-Sight-master\start_lexhub.py" --stop
  if errorlevel 1 (
    pause
    exit /b 1
  )
  pause
  exit /b 0
)

where py >nul 2>nul
if not errorlevel 1 (
  py -3 "Co-Sight-master\start_lexhub.py" --stop
  if errorlevel 1 (
    pause
    exit /b 1
  )
  pause
  exit /b 0
)

echo [错误] 未找到 Python。
pause
exit /b 1
