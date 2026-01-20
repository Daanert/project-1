#!/bin/bash
# Deployment script for Vast.ai instance

set -e

echo "==================================="
echo "ComfyUI Image Gallery - Vast.ai Setup"
echo "==================================="

# Check if we're in the right directory
if [ ! -f "backend/app.py" ]; then
    echo "Error: Run this script from the project root directory"
    exit 1
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo ""
echo "🔨 Building frontend..."
npm run build
cd ..

# Create start script
echo ""
echo "📝 Creating start script..."
cat > start-gallery.sh <<'EOF'
#!/bin/bash
# Start ComfyUI Image Gallery

echo "Starting ComfyUI Image Gallery..."
echo "Backend will run on http://localhost:5000"
echo "Press Ctrl+C to stop"

cd "$(dirname "$0")/backend"
python3 app.py
EOF

chmod +x start-gallery.sh

# Create tunnel script
cat > start-with-tunnel.sh <<'EOF'
#!/bin/bash
# Start gallery with Cloudflare tunnel

# Start backend in background
cd backend
python3 app.py > /tmp/gallery_backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 3

# Start Cloudflare tunnel
echo "Starting Cloudflare tunnel..."
echo "Backend logs: /tmp/gallery_backend.log"
cloudflared tunnel --url http://localhost:5000

# Cleanup on exit
kill $BACKEND_PID 2>/dev/null
EOF

chmod +x start-with-tunnel.sh

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the gallery:"
echo "  1. Local only:  ./start-gallery.sh"
echo "  2. With tunnel: ./start-with-tunnel.sh"
echo ""
echo "The app will scan: /workspace/ComfyUI/output"
echo ""
