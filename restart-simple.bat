@echo off
echo ========================================
echo GAMR Platform - Simple Restart
echo ========================================
echo.

REM Don't close window on error
if not defined GAMR_NO_PAUSE set GAMR_NO_PAUSE=0

echo Step 1: Checking npm...
where npm
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
echo OK - npm found
echo.

echo Step 2: Checking current directory...
echo Current directory: %CD%
echo Script directory: %~dp0
echo.

if not exist "%~dp0package.json" (
    echo ERROR: package.json not found in script directory!
    echo Please ensure this script is in the GAMR platform root.
    pause
    exit /b 1
)
echo OK - package.json found
echo.

echo Step 3: Setting up ports...
set BACK_PORT=3002
set FRONT_PORT=5173

REM Important: Clear any conflicting environment variables
set PORT=
set VITE_PORT=
set BACKEND_PORT=
set VITE_PROXY_TARGET=

echo Backend port: %BACK_PORT%
echo Frontend port: %FRONT_PORT%
echo Backend URL for proxy: http://localhost:%BACK_PORT%
echo.

echo Step 4: Killing processes on ports...
echo Checking for processes on ports %BACK_PORT% and %FRONT_PORT%...

REM Kill backend port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%BACK_PORT%" ^| findstr LISTENING 2^>nul') do (
    echo Killing process on port %BACK_PORT% (PID %%a)
    taskkill /F /PID %%a 2>nul
)

REM Kill frontend port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%FRONT_PORT%" ^| findstr LISTENING 2^>nul') do (
    echo Killing process on port %FRONT_PORT% (PID %%a)
    taskkill /F /PID %%a 2>nul
)

REM Kill common dev ports (include all variants to be thorough)
echo Checking other common development ports...
for %%P in (5173 5174 3003 3004 3005 3006 8080) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P" ^| findstr LISTENING 2^>nul') do (
        echo Killing process on port %%P (PID %%a)
        taskkill /F /PID %%a 2>nul
    )
)

echo.
echo Step 5: Waiting 2 seconds for ports to free...
timeout /t 2 >nul 2>nul
echo.

echo Step 6: Starting backend server...
cd /d "%~dp0"
start "GAMR Backend" cmd /k "set PORT=%BACK_PORT% && npm run server:dev"
echo Backend started in new window
echo.

echo Step 7: Waiting 2 seconds before starting frontend...
timeout /t 2 >nul 2>nul
echo.

echo Step 8: Starting frontend server...
echo   Frontend port: %FRONT_PORT%
echo   Proxy target: http://localhost:%BACK_PORT%
start "GAMR Frontend [Port %FRONT_PORT%]" cmd /k "set PORT=%FRONT_PORT% && set VITE_PORT=%FRONT_PORT% && set BACKEND_PORT=%BACK_PORT% && set VITE_BACKEND_PORT=%BACK_PORT% && set VITE_PROXY_TARGET=http://localhost:%BACK_PORT% && echo Starting Vite on port %FRONT_PORT% with backend at %BACK_PORT%... && npm run dev"
echo Frontend started in new window
echo.

echo Step 9: Waiting 3 seconds for services to start...
timeout /t 3 >nul 2>nul
echo.

echo Step 10: Checking if backend is running...
netstat -ano | findstr ":%BACK_PORT%" | findstr LISTENING
if %ERRORLEVEL% equ 0 (
    echo OK - Backend is listening on port %BACK_PORT%
) else (
    echo WARNING - Backend NOT detected on port %BACK_PORT%
    echo Check the "GAMR Backend" window for errors!
)
echo.

echo Step 11: Checking if frontend is running...
netstat -ano | findstr ":%FRONT_PORT%" | findstr LISTENING
if %ERRORLEVEL% equ 0 (
    echo OK - Frontend is listening on port %FRONT_PORT%
) else (
    echo WARNING - Frontend NOT detected on port %FRONT_PORT%
    echo Check the "GAMR Frontend" window for errors!
)
echo.

echo ========================================
echo   DONE!
echo ========================================
echo.
echo Backend:  http://localhost:%BACK_PORT%
echo Frontend: http://localhost:%FRONT_PORT%
echo.
echo IMPORTANT: Check the backend and frontend windows for any errors!
echo If backend failed to start, the frontend won't be able to connect.
echo.
pause

