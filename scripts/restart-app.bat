@echo off
setlocal enabledelayedexpansion

REM ==============================================
REM  GAMR Platform - Stop and Start Dev Servers
REM  Defaults: backend 3002, frontend 5173
REM  Usage: restart-app.bat [BACKEND_PORT] [FRONTEND_PORT]
REM  Example: restart-app.bat 3002 5173
REM ==============================================

set BACK_PORT=%1
if "%BACK_PORT%"=="" set BACK_PORT=3002
set FRONT_PORT=%2
if "%FRONT_PORT%"=="" set FRONT_PORT=5173

REM Include a few common dev ports to clean up just in case
set KILL_PORTS=%BACK_PORT% %FRONT_PORT% 5173 5174 3002

echo.
echo Stopping processes listening on ports: %KILL_PORTS%

REM Kill processes on specified ports using netstat + taskkill
for %%P in (%KILL_PORTS%) do (
  echo Checking port %%P...
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P "') do (
    if not "%%a"=="0" (
      echo Killing PID %%a on port %%P
      taskkill /PID %%a /F >nul 2>nul
    )
  )
)

echo.
echo Starting backend (PORT %BACK_PORT%) and frontend (PORT %FRONT_PORT%) ...

REM Change directory to project root (this script is in scripts\)
cd /d "%~dp0.."

REM Start backend (Express dev) in a background window with specified port
start "GAMR Backend" cmd /c "set PORT=%BACK_PORT% && npm run server:dev"

REM Start frontend (Vite) in a background window with specified port and proxy target to backend
start "GAMR Frontend" cmd /c "set PORT=%FRONT_PORT% && set VITE_PORT=%FRONT_PORT% && set BACKEND_PORT=%BACK_PORT% && set VITE_PROXY_TARGET=http://localhost:%BACK_PORT% && npm run dev"

echo.
echo Backend: http://localhost:%BACK_PORT%
echo Frontend: http://localhost:%FRONT_PORT%
echo Done. You can close this window.

echo.
endlocal

