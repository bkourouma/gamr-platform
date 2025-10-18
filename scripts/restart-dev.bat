@echo off
setlocal enabledelayedexpansion

REM Restart GAMR Platform dev servers
REM - Ensures ports are free before launching
REM - Defaults: backend 3002, frontend 5173
REM Usage: restart-dev.bat [BACK_PORT] [FRONT_PORT]

set BACK_PORT=%1
if "%BACK_PORT%"=="" set BACK_PORT=3002
set FRONT_PORT=%2
if "%FRONT_PORT%"=="" set FRONT_PORT=5173

REM Build list of ports to free (includes common vite port 5173 and alt 5174)
set KILL_PORTS=%BACK_PORT% %FRONT_PORT% 5173 5174

echo.
echo Stopping processes listening on ports: %KILL_PORTS%

REM Prefer PowerShell for robust PID detection
where powershell >nul 2>nul
if %ERRORLEVEL%==0 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "
    $ports = '%KILL_PORTS%'.Split(' ') | Where-Object { $_ -match '^\d+$' } | Sort-Object -Unique
    foreach($p in $ports){
      try{
        $attempt=0
        do{
          $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
          if($conns){
            $pids = $conns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
            foreach($pid in $pids){
              try{ Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue; Write-Host \"Stopped PID $pid on port $p\" } catch {}
            }
          }
          Start-Sleep -Milliseconds 300
          $attempt++
        } while((Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) -and $attempt -lt 40)
        if(Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue){ Write-Host \"Warning: port $p still busy\" }
        else{ Write-Host \"Port $p is free\" }
      } catch {}
    }
  "
) else (
  for %%P in (%KILL_PORTS%) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":%%P[ ]" ^| findstr LISTENING') do (
      echo Killing PID %%a on port %%P
      taskkill /F /PID %%a >nul 2>nul
    )
    REM Wait up to ~12s for port to free
    set /a ATTEMPTS=0
    :waitloop_%%P
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R ":%%P[ ]" ^| findstr LISTENING') do set BUSY=1
    if defined BUSY (
      set BUSY=
      set /a ATTEMPTS+=1
      if !ATTEMPTS! LSS 40 (
        timeout /t 1 >nul 2>nul
        goto waitloop_%%P
      )
      echo Warning: port %%P still busy
    ) else (
      echo Port %%P is free
    )
  )
)

echo.
echo Starting backend (PORT %BACK_PORT%) and frontend (PORT %FRONT_PORT%) ...

REM Change directory to project root (this script is in scripts\)
cd /d "%~dp0.."

REM Start backend (server) in a background window with specified port
start "GAMR Backend" cmd /c "set PORT=%BACK_PORT% && npm run server:dev"

REM Start frontend (Vite) in a background window with specified port and proxy target
start "GAMR Frontend" cmd /c "set PORT=%FRONT_PORT% && set VITE_PORT=%FRONT_PORT% && set BACKEND_PORT=%BACK_PORT% && set VITE_PROXY_TARGET=http://localhost:%BACK_PORT% && npm run dev"

echo.
echo Backend and frontend launched. You can close this window.

endlocal

