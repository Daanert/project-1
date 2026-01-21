#!/bin/bash

# ComfyUI Image Gallery - Local Development Startup Script

set -e

echo "🖼️  ComfyUI Image Gallery - Local Setup"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if placeholder images exist
if [ ! -d "placeholder_images" ] || [ -z "$(ls -A placeholder_images 2>/dev/null)" ]; then
    echo -e "${YELLOW}📁 No placeholder images found. Generating them now...${NC}"
    python3 generate_placeholder_images.py
    echo ""
fi

# Check Python dependencies
echo -e "${BLUE}🐍 Checking Python dependencies...${NC}"
if ! python3 -c "import flask" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip3 install -r backend/requirements.txt
fi

# Check Node.js dependencies
echo -e "${BLUE}📦 Checking Node.js dependencies...${NC}"

# Install backend proxy dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing proxy server dependencies..."
    npm install
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo -e "${GREEN}✅ All dependencies installed!${NC}"
echo ""

# Start backend
echo -e "${BLUE}🚀 Starting Flask backend on port 5000...${NC}"
cd backend
python3 app.py > /tmp/gallery_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may have failed to start. Check /tmp/gallery_backend.log${NC}"
fi

# Start frontend
echo -e "${BLUE}🎨 Starting React frontend on port 3000...${NC}"
cd frontend
npm start > /tmp/gallery_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 2

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may have failed to start. Check /tmp/gallery_frontend.log${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ Gallery is starting up!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📱 Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "🔧 Backend API: ${BLUE}http://localhost:5000${NC}"
echo ""
echo -e "📝 Logs:"
echo -e "   Backend: /tmp/gallery_backend.log"
echo -e "   Frontend: /tmp/gallery_frontend.log"
echo ""
echo -e "🛑 To stop the servers:"
echo -e "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Opening browser in 5 seconds...${NC}"
sleep 5

# Open browser (works on most systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
elif command -v open > /dev/null; then
    open http://localhost:3000
elif command -v start > /dev/null; then
    start http://localhost:3000
else
    echo "Please open http://localhost:3000 in your browser"
fi

echo ""
echo -e "${GREEN}Press Ctrl+C to stop watching logs, servers will keep running in background${NC}"
echo ""

# Tail both logs
tail -f /tmp/gallery_backend.log /tmp/gallery_frontend.log
