@echo off
echo ========================================
echo  Restarting ComfyUI Gallery
echo ========================================
echo.

echo Stopping existing servers...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo.
echo Waiting 2 seconds...
timeout /t 2 /nobreak > nul

echo.
echo Starting fresh...
call start-local.bat
