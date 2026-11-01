#!/usr/bin/env bash
# ==============================================================================
# Process & Port Collision Audit Script (macOS / Linux Safe)
# Safely terminates stale bot supervisors, polling instances, tunnels,
# and port listeners (FastAPI: 8008, Vite: 3000) before new service launch.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BOT_DIR="/Users/amiralirakhshani/Projects/MediqzBot"

echo "=== [Watchdog] Starting Port & Process Collision Audit ==="

# 1. Resolve Bot Token
BOT_TOKEN="8882238851:AAFdbVIurZXP4nRwZ8EmvtmGwYUIFeOxc50"
if [ -f "$BOT_DIR/.env" ]; then
    EXTRACTED_TOKEN=$(grep -E "^BOT_TOKEN=" "$BOT_DIR/.env" | cut -d '=' -f2- | tr -d ' "\r\n' || true)
    if [ -n "$EXTRACTED_TOKEN" ]; then
        BOT_TOKEN="$EXTRACTED_TOKEN"
    fi
fi

# Helper function to gracefully terminate a list of PIDs
terminate_pids() {
    local target_desc="$1"
    shift
    local pids=("$@")
    if [ ${#pids[@]} -eq 0 ]; then
        return 0
    fi

    echo "[Watchdog] Terminating $target_desc (PIDs: ${pids[*]}): Sending SIGTERM..."
    for pid in "${pids[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -15 "$pid" 2>/dev/null || true
        fi
    done

    # Wait up to 3 seconds for graceful exit
    local waited=0
    while [ $waited -lt 6 ]; do
        local still_alive=0
        for pid in "${pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                still_alive=1
                break
            fi
        done
        if [ $still_alive -eq 0 ]; then
            echo "[Watchdog] All $target_desc processes terminated gracefully."
            return 0
        fi
        sleep 0.5
        waited=$((waited + 1))
    done

    # Force kill if still running
    for pid in "${pids[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "[Watchdog] $target_desc (PID $pid) still active. Escalating to SIGKILL..."
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
}

# 2. Terminate Supervisor First (avoids immediate bot restart race)
SUPERVISOR_PIDS=$(pgrep -f "run_mediqz_service.py" || true)
if [ -n "$SUPERVISOR_PIDS" ]; then
    read -r -a P_ARR <<< "$SUPERVISOR_PIDS"
    terminate_pids "Supervisor (run_mediqz_service.py)" "${P_ARR[@]}"
fi

# 3. Terminate Bot Polling Instances
BOT_PIDS=$(pgrep -f "python.*bot\.py" || true)
if [ -n "$BOT_PIDS" ]; then
    read -r -a P_ARR <<< "$BOT_PIDS"
    terminate_pids "Bot Polling (bot.py)" "${P_ARR[@]}"
fi

# 4. Terminate any orphan processes holding files in MediqzBot directory
if [ -d "$BOT_DIR" ]; then
    MEDIQZ_HOLDERS=$(lsof +D "$BOT_DIR" -t 2>/dev/null || true)
    if [ -n "$MEDIQZ_HOLDERS" ]; then
        read -r -a P_ARR <<< "$MEDIQZ_HOLDERS"
        terminate_pids "Mediqz directory holders" "${P_ARR[@]}"
    fi
fi

# 5. Terminate Orphaned cloudflared Tunnels forwarding to 5173 or 3000
CLOUDFLARE_PIDS=$(pgrep -fl "cloudflared.*tunnel.*(5173|3000)" | awk '{print $1}' || true)
if [ -n "$CLOUDFLARE_PIDS" ]; then
    read -r -a P_ARR <<< "$CLOUDFLARE_PIDS"
    terminate_pids "Orphaned cloudflared tunnels" "${P_ARR[@]}"
fi

# 6. Audit & Terminate Port Collisions on 8008 (FastAPI) and 3000 (Vite)
PORT_PIDS=$(lsof -nP -ti tcp:8008,tcp:3000 2>/dev/null || true)
if [ -n "$PORT_PIDS" ]; then
    read -r -a P_ARR <<< "$PORT_PIDS"
    terminate_pids "Port 8008 / 3000 listeners" "${P_ARR[@]}"
fi

# 7. Telegram Server-Side Reset (Drop pending getUpdates backlog)
echo "[Watchdog] Flushing Telegram server-side pending updates & webhooks..."
API_RESP=$(curl -s -m 6 -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true" || echo '{"ok":false}')
if echo "$API_RESP" | grep -q '"ok":true'; then
    echo "[Watchdog] Telegram API response: Pending updates flushed successfully."
else
    echo "[Watchdog] Telegram API response notice: $API_RESP"
fi

# 8. Post-Execution Gate Verification
LEFTOVER_PORTS=$(lsof -nP -ti tcp:8008,tcp:3000 2>/dev/null || true)
if [ -n "$LEFTOVER_PORTS" ]; then
    echo "[!] ERROR: Ports 8008 or 3000 are still occupied by PIDs: $LEFTOVER_PORTS" >&2
    exit 1
fi

echo "=== [Watchdog] Audit Complete. Ports 8008 & 3000 are clean. Environment is ready. ==="
exit 0
