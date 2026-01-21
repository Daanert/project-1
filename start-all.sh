#!/bin/bash
# All-in-one startup script for ComfyUI Image Gallery
# This script starts both backend and frontend with optional tunnel

set -e

# Configuration
BACKEND_PORT=5000
FRONTEND_PORT=3000
TUNNEL_MODE=${1:-"local"}  # "local" or "tunnel"

echo "==================================="
echo "ComfyUI Image Gallery"
echo "==================================="
echo ""

# Check if ComfyUI output folder exists
if [ -d "/ComfyUI/output" ]; then
    IMAGE_COUNT=$(find /ComfyUI/output -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) | wc -l)
    echo "✅ Found /ComfyUI/output with $IMAGE_COUNT images"
elif [ -d "/workspace/ComfyUI/output" ]; then
    IMAGE_COUNT=$(find /workspace/ComfyUI/output -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) | wc -l)
    echo "✅ Found /workspace/ComfyUI/output with $IMAGE_COUNT images"
else
    echo "⚠️  ComfyUI output folder not found - will use placeholder images"
fi

echo ""
echo "Starting services..."
echo ""

# Start backend
echo "🔧 Starting Flask backend on port $BACKEND_PORT..."
cd backend
python3 app.py > /tmp/gallery_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check /tmp/gallery_backend.log"
    exit 1
fi

echo "✅ Backend started (PID: $BACKEND_PID)"

# Start React dev server
echo ""
echo "🎨 Starting React dev server on port $FRONTEND_PORT..."
cd frontend
PORT=$FRONTEND_PORT npm start > /tmp/gallery_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to compile
sleep 10

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Frontend failed to start. Check /tmp/gallery_frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Start tunnel if requested
if [ "$TUNNEL_MODE" = "tunnel" ]; then
    echo ""
    echo "🌍 Starting Cloudflare tunnel..."
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
        TUNNEL_PID=$(ps aux | grep "cloudflared tunnel --url http://localhost:$FRONTEND_PORT" | grep -v grep | awk '{print $2}')
        if [ -n "$TUNNEL_PID" ]; then
            kill $TUNNEL_PID 2>/dev/null || true
        fi
        echo "All services stopped."
        exit 0
    }

    trap cleanup SIGINT SIGTERM

    # Start tunnel (blocks until Ctrl+C)
    cloudflared tunnel --url http://localhost:$FRONTEND_PORT

    cleanup
else
    echo ""
    echo "==================================="
    echo "✅ Gallery is running!"
    echo "==================================="
    echo ""
    echo "  📱 Open: http://localhost:$FRONTEND_PORT"
    echo ""
    echo "  📊 Logs:"
    echo "    Backend:  tail -f /tmp/gallery_backend.log"
    echo "    Frontend: tail -f /tmp/gallery_frontend.log"
    echo ""
    echo "  🛑 To stop:"
    echo "    kill $BACKEND_PID $FRONTEND_PID"
    echo ""
    echo "  🌍 To start with tunnel:"
    echo "    ./start-all.sh tunnel"
    echo ""
fi
