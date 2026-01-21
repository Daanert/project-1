#!/bin/bash

# Safe stop script - only kills gallery processes

echo "Stopping ComfyUI Gallery services..."

# Find and kill only gallery-specific processes
# Backend: python app.py in backend folder
BACKEND_PID=$(ps aux | grep "python.*backend/app.py" | grep -v grep | awk '{print $2}')
if [ -n "$BACKEND_PID" ]; then
    echo "Stopping backend (PID: $BACKEND_PID)"
    kill $BACKEND_PID
else
    echo "Backend not running"
fi

# Frontend: npm start in frontend folder
FRONTEND_PIDS=$(ps aux | grep "node.*frontend" | grep -v grep | awk '{print $2}')
if [ -n "$FRONTEND_PIDS" ]; then
    echo "Stopping frontend"
    for pid in $FRONTEND_PIDS; do
        kill $pid
    done
else
    echo "Frontend not running"
fi

# Cloudflared tunnel
TUNNEL_PID=$(ps aux | grep "cloudflared tunnel" | grep -v grep | awk '{print $2}')
if [ -n "$TUNNEL_PID" ]; then
    echo "Stopping tunnel (PID: $TUNNEL_PID)"
    kill $TUNNEL_PID
else
    echo "Tunnel not running"
fi

echo "Done!"
