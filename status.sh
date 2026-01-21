#!/bin/bash

# Check status of gallery services

echo "========================================"
echo " ComfyUI Gallery Status"
echo "========================================"
echo ""

# Get the absolute path of this script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check backend
BACKEND_PID=$(ps aux | grep "[p]ython.*${SCRIPT_DIR}/backend/app.py" | awk '{print $2}')
if [ -n "$BACKEND_PID" ]; then
    echo "✅ Backend: RUNNING (PID: $BACKEND_PID)"
else
    echo "❌ Backend: NOT RUNNING"
fi

# Check frontend
FRONTEND_PIDS=$(ps aux | grep "[n]ode" | grep "${SCRIPT_DIR}/frontend" | awk '{print $2}')
if [ -n "$FRONTEND_PIDS" ]; then
    echo "✅ Frontend: RUNNING (PIDs: $FRONTEND_PIDS)"
else
    echo "❌ Frontend: NOT RUNNING"
fi

# Check tunnel
TUNNEL_PID=$(ps aux | grep "[c]loudflared tunnel --url http://localhost:3000" | awk '{print $2}')
if [ -n "$TUNNEL_PID" ]; then
    echo "✅ Tunnel: RUNNING (PID: $TUNNEL_PID)"
else
    echo "❌ Tunnel: NOT RUNNING"
fi

echo ""
echo "========================================"
