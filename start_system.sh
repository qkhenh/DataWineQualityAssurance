#!/bin/bash

echo "========================================="
echo "   DE Integration Project Launcher"
echo "========================================="
echo "1. Start System (Frontend + Backend)"
echo "2. Start Full System (Frontend + Backend + AI Service + Simulation)"
echo "========================================="
read -p "Enter your choice (1 or 2): " choice

# Function to handle script exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    # Kill all child processes in the current process group
    # Note: On some Windows bash environments, kill 0 might behave differently,
    # but it's the standard way to kill the process group.
    kill 0
}

# Trap SIGINT (Ctrl+C) and EXIT
trap cleanup SIGINT EXIT

if [ "$choice" == "1" ]; then
    echo "[INFO] Starting Backend..."
    (cd backend && npm run dev) &
    
    echo "[INFO] Starting Frontend..."
    (cd frontend && yarn dev) &
    
    # Wait for all background processes
    wait

elif [ "$choice" == "2" ]; then
    echo "[INFO] Starting AI Service..."
    uvicorn ai_service.inference.main:app --reload --port 8000 &
    
    echo "[INFO] Starting Backend..."
    (cd backend && npm run dev) &
    
    echo "[INFO] Starting Frontend..."
    (cd frontend && yarn dev) &
    
    echo "[INFO] Waiting 5 seconds for services to initialize..."
    sleep 5
    
    echo "[INFO] Starting Simulation..."
    python ./simulation.py &
    
    # Wait for all background processes
    wait

else
    echo "[ERROR] Invalid choice. Exiting."
    exit 1
fi
