@echo off
REM Add new placeholder images to test auto-sync

echo ========================================
echo  Adding New Placeholder Images
echo ========================================
echo.

REM Get current count of images
set "count=0"
for %%F in (placeholder_images\*.png) do set /a count+=1

echo Current images: %count%
echo Adding 5 new images...
echo.

REM Run Python script to generate new images
python add_test_images.py

echo.
echo ========================================
echo Done! Watch the gallery auto-sync.
echo New images should appear in 5 seconds!
echo ========================================
pause
