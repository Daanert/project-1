#!/bin/bash

echo "Stopping all gallery services..."

# Kill Python (Flask backend)
pkill -f "python.*app.py" || true

# Kill Node (React frontend)
pkill -f "node.*react-scripts" || true
pkill -f "npm.*start" || true

echo "All services stopped."
