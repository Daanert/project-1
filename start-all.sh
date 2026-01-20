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
echo "Checking ComfyUI output folder..."

# Check if ComfyUI output folder exists
if [ -d "/workspace/ComfyUI/output" ]; then
    IMAGE_COUNT=$(find /workspace/ComfyUI/output -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) | wc -l)
    echo "✓ ComfyUI folder found: /workspace/ComfyUI/output"
    echo "  Found $IMAGE_COUNT images"
else
    echo "⚠️  Warning: /workspace/ComfyUI/output not found"
    echo "  The gallery will start but show no images until this folder exists"
fi

echo ""
echo "Starting services..."
echo ""

# Build frontend if needed
if [ ! -d "frontend/build" ]; then
    echo "📦 Building frontend (first time only)..."
    cd frontend
    npm run build
    cd ..
    echo ""
fi

# Start backend
echo "🔧 Starting Flask backend on port $BACKEND_PORT..."
cd backend
python3 app.py > /tmp/gallery_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start. Check /tmp/gallery_backend.log"
    exit 1
fi

echo "✓ Backend started (PID: $BACKEND_PID)"
echo "  Logs: /tmp/gallery_backend.log"
echo "  URL: http://localhost:$BACKEND_PORT"

# Start proxy server
echo ""
echo "🌐 Starting proxy server on port $FRONTEND_PORT..."
node proxy-server.js > /tmp/gallery_frontend.log 2>&1 &
PROXY_PID=$!

# Wait for proxy to start
sleep 2

# Check if proxy started successfully
if ! kill -0 $PROXY_PID 2>/dev/null; then
    echo "❌ Proxy server failed to start. Check /tmp/gallery_frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✓ Proxy server started (PID: $PROXY_PID)"
echo "  Logs: /tmp/gallery_frontend.log"
echo "  URL: http://localhost:$FRONTEND_PORT"

# Start tunnel if requested
if [ "$TUNNEL_MODE" = "tunnel" ]; then
    echo ""
    echo "🌍 Starting Cloudflare tunnel..."
    echo "   Press Ctrl+C to stop all services"
    echo ""

    # Cleanup function
    cleanup() {
        echo ""
        echo "Stopping services..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $PROXY_PID 2>/dev/null || true
        pkill -f cloudflared 2>/dev/null || true
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
    echo "  📱 Open in browser: http://localhost:$FRONTEND_PORT"
    echo ""
    echo "  Backend: http://localhost:$BACKEND_PORT"
    echo "  Frontend: http://localhost:$FRONTEND_PORT"
    echo ""
    echo "  📊 Logs:"
    echo "    Backend:  tail -f /tmp/gallery_backend.log"
    echo "    Frontend: tail -f /tmp/gallery_frontend.log"
    echo ""
    echo "  🛑 To stop services:"
    echo "    kill $BACKEND_PID $PROXY_PID"
    echo ""
    echo "  🌍 To start with tunnel:"
    echo "    ./start-all.sh tunnel"
    echo ""
fi
