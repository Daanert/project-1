#!/bin/bash
# Quick update script for Vast.ai

echo "🔄 Updating ComfyUI Image Gallery..."

# Stop running services
echo "Stopping any running services..."
pkill -f "python3 app.py" 2>/dev/null
pkill -f "node proxy-server.js" 2>/dev/null
sleep 2

# Pull latest changes
echo "Pulling latest code..."
git fetch origin
git pull origin claude/image-gallery-lightbox-NA5YT

# Rebuild frontend
echo "Rebuilding frontend..."
cd frontend
npm run build
cd ..

echo ""
echo "✅ Update complete!"
echo ""
echo "To start the gallery:"
echo "  ./start-all.sh tunnel"
echo ""
