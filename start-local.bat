@echo off
REM ComfyUI Image Gallery - Local Development Startup Script (Windows)

echo ======================================
echo  ComfyUI Image Gallery - Local Setup
echo ======================================
echo.

REM Check if placeholder images exist
if not exist "placeholder_images" (
    echo Generating placeholder images...
    python generate_placeholder_images.py
    echo.
)

REM Check Python dependencies
echo Checking Python dependencies...
python -c "import flask" 2>nul
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r backend\requirements.txt
)

REM Check Node.js dependencies
echo Checking Node.js dependencies...

REM Install proxy server dependencies
if not exist "node_modules" (
    echo Installing proxy server dependencies...
    call npm install
)

REM Install frontend dependencies
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo All dependencies installed!
echo.

REM Start backend
echo Starting Flask backend on port 5000...
cd backend
start /B python app.py > %TEMP%\gallery_backend.log 2>&1
cd ..

REM Wait a moment for backend to start
timeout /t 2 /nobreak > nul

echo Backend started
echo.

REM Start frontend
echo Starting React frontend on port 3000...
cd frontend
start /B npm start > %TEMP%\gallery_frontend.log 2>&1
cd ..

echo Frontend started
echo.

echo ========================================
echo  Gallery is starting up!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Logs:
echo    Backend: %TEMP%\gallery_backend.log
echo    Frontend: %TEMP%\gallery_frontend.log
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul

REM Open browser
start http://localhost:3000

echo.
echo Press any key to stop the servers...
pause > nul

REM Kill processes (Note: This is a simple version, may need adjustment)
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Flask*" 2>nul
taskkill /F /IM node.exe 2>nul

echo Servers stopped.
