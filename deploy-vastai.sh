#!/bin/bash

# Complete deployment script for Vast.ai
# This script handles everything from dependencies to starting with tunnel

set -e

echo "========================================"
echo " ComfyUI Gallery - Vast.ai Deployment"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/app.py" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Not in the project directory"
    echo "Please cd to the comfyui-gallery folder first"
    exit 1
fi

# Check for ComfyUI folder
if [ -d "/ComfyUI/output" ]; then
    IMAGE_COUNT=$(find /ComfyUI/output -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) 2>/dev/null | wc -l)
    echo "✅ Found /ComfyUI/output with $IMAGE_COUNT images"
elif [ -d "/workspace/ComfyUI/output" ]; then
    IMAGE_COUNT=$(find /workspace/ComfyUI/output -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) 2>/dev/null | wc -l)
    echo "✅ Found /workspace/ComfyUI/output with $IMAGE_COUNT images"
else
    echo "⚠️  Warning: ComfyUI output folder not found"
    echo "   Expected: /ComfyUI/output or /workspace/ComfyUI/output"
    echo "   The gallery will use placeholder images instead"
fi

echo ""
echo "========================================"
echo " Installing Dependencies"
echo "========================================"
echo ""

# Install backend dependencies
if [ ! -f "backend/.dependencies_installed" ]; then
    echo "📦 Installing Python dependencies..."
    cd backend
    pip install -q -r requirements.txt
    touch .dependencies_installed
    cd ..
    echo "✅ Python dependencies installed"
else
    echo "✅ Python dependencies already installed"
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing Node.js dependencies (this may take a few minutes)..."
    cd frontend
    npm install --silent
    cd ..
    echo "✅ Node.js dependencies installed"
else
    echo "✅ Node.js dependencies already installed"
fi

echo ""
echo "========================================"
echo " Starting Services"
echo "========================================"
echo ""

# Start backend
echo "🔧 Starting Flask backend on port 5000..."
cd backend
python3 app.py > /tmp/gallery_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check /tmp/gallery_backend.log"
    tail -n 20 /tmp/gallery_backend.log
    exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"

# Start frontend
echo "🎨 Starting React dev server on port 3000..."
cd frontend
PORT=3000 npm start > /tmp/gallery_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to compile
echo "   Waiting for React to compile..."
sleep 10

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check /tmp/gallery_frontend.log"
    tail -n 20 /tmp/gallery_frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "========================================"
echo " Starting Cloudflare Tunnel"
echo "========================================"
echo ""
echo "🌍 Creating public URL..."
echo "   Press Ctrl+C to stop all services"
echo ""

# Cleanup function - only kill our specific PIDs
cleanup() {
    echo ""
    echo "Stopping services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    # Kill only our cloudflared tunnel process
    TUNNEL_PID=$(ps aux | grep "cloudflared tunnel --url http://localhost:3000" | grep -v grep | awk '{print $2}')
    if [ -n "$TUNNEL_PID" ]; then
        kill $TUNNEL_PID 2>/dev/null || true
    fi
    echo "✅ All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start tunnel (blocks until Ctrl+C)
cloudflared tunnel --url http://localhost:3000

cleanup
