#!/bin/bash

# Vast.ai deployment script for ComfyUI Image Gallery

set -e

echo "======================================"
echo " ComfyUI Gallery - Vast.ai Deployment"
echo "======================================"
echo ""

# Set the ComfyUI output folder path for Vast.ai
export COMFYUI_OUTPUT_FOLDER="/ComfyUI/output"

echo "📁 ComfyUI Output Folder: $COMFYUI_OUTPUT_FOLDER"
echo ""

# Check if folder exists
if [ -d "$COMFYUI_OUTPUT_FOLDER" ]; then
    IMAGE_COUNT=$(find "$COMFYUI_OUTPUT_FOLDER" -name "*.png" | wc -l)
    echo "✅ Folder found with $IMAGE_COUNT images"
else
    echo "❌ WARNING: Folder not found!"
fi

echo ""

# Install Python dependencies if needed
if [ ! -f "backend/.dependencies_installed" ]; then
    echo "Installing Python dependencies..."
    cd backend
    pip install -r requirements.txt
    touch .dependencies_installed
    cd ..
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "======================================"
echo " Starting Services"
echo "======================================"
echo ""

# Start backend with environment variable
echo "Starting Flask backend..."
cd backend
nohup python app.py > /tmp/gallery_backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Wait for backend
sleep 3

# Start frontend
echo "Starting React frontend..."
cd frontend
nohup npm start > /tmp/gallery_frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "======================================"
echo " ✅ Gallery Started!"
echo "======================================"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Logs:"
echo "  Backend: /tmp/gallery_backend.log"
echo "  Frontend: /tmp/gallery_frontend.log"
echo ""
echo "PIDs: $BACKEND_PID $FRONTEND_PID"
echo ""
