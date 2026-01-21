#!/bin/bash

echo "Stopping gallery services..."

# Get the absolute path of this script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Find and kill only gallery-specific processes using exact path matching
# Backend: python app.py from THIS specific gallery directory
BACKEND_PID=$(ps aux | grep "[p]ython.*${SCRIPT_DIR}/backend/app.py" | awk '{print $2}')
if [ -n "$BACKEND_PID" ]; then
    echo "Stopping backend (PID: $BACKEND_PID)"
    kill $BACKEND_PID 2>/dev/null
    echo "✓ Backend stopped"
else
    echo "- Backend not running"
fi

# Frontend: Find react-scripts from THIS specific directory
# Look for node processes with our specific frontend path
FRONTEND_PIDS=$(ps aux | grep "[n]ode" | grep "${SCRIPT_DIR}/frontend" | awk '{print $2}')
if [ -n "$FRONTEND_PIDS" ]; then
    echo "Stopping frontend processes"
    for pid in $FRONTEND_PIDS; do
        kill $pid 2>/dev/null
    done
    echo "✓ Frontend stopped"
else
    echo "- Frontend not running"
fi

# Cloudflared tunnel - only if pointing to our port 3000
TUNNEL_PID=$(ps aux | grep "[c]loudflared tunnel --url http://localhost:3000" | awk '{print $2}')
if [ -n "$TUNNEL_PID" ]; then
    echo "Stopping tunnel (PID: $TUNNEL_PID)"
    kill $TUNNEL_PID 2>/dev/null
    echo "✓ Tunnel stopped"
else
    echo "- Tunnel not running"
fi

echo ""
echo "✅ Gallery services stopped"
