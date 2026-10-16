#!/bin/zsh
set -e

# Resolve script directory dynamically
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

cleanup() {
    echo "\n[Alqualite CourseBox] Shutting down services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup INT TERM EXIT

echo "[Alqualite CourseBox] Starting FastAPI backend on port 8000..."
cd "$BACKEND_DIR"
python3 run.py &
BACKEND_PID=$!

echo "[Alqualite CourseBox] Starting Vite frontend dev server on port 3000..."
cd "$FRONTEND_DIR"
npm run dev
