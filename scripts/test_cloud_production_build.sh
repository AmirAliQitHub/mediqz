#!/usr/bin/env bash
set -e

# ==============================================================================
# Cloud Production Build & Webhook Verification Test Suite
# Tests single-port unified serving, dynamic $PORT binding, and Telegram Webhooks
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=== [1/6] Compiling Vite Frontend Production Build ==="
cd frontend
npm run build
cd "$PROJECT_ROOT"

if [ ! -f "frontend/dist/index.html" ]; then
    echo "ERROR: frontend/dist/index.html not found!"
    exit 1
fi
echo "✓ Frontend build verified in frontend/dist/"

# Select an isolated dynamic port to simulate cloud provider $PORT injection
TEST_PORT=8095
echo "=== [2/6] Starting Unified Server on Simulated Cloud PORT=$TEST_PORT ==="

export PORT=$TEST_PORT
export DATA_DIR="$PROJECT_ROOT/backend/assets"
export TELEGRAM_BOT_TOKEN="8882238851:AAFdbVIurZXP4nRwZ8EmvtmGwYUIFeOxc50"
export TELEGRAM_SECRET_TOKEN="test_cloud_secret_token_12345"
export WEB_APP_URL="http://127.0.0.1:$TEST_PORT"

PYTHONPATH=backend python3 -m uvicorn app.main:app --host 127.0.0.1 --port "$TEST_PORT" > /tmp/cloud_test_server.log 2>&1 &
SERVER_PID=$!

cleanup() {
    echo "Cleaning up server process PID $SERVER_PID..."
    kill -TERM "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "Waiting for server to become healthy..."
READY=0
for i in {1..30}; do
    if curl -s "http://127.0.0.1:$TEST_PORT/api/health" | grep -q "healthy"; then
        READY=1
        break
    fi
    sleep 0.5
done

if [ "$READY" -ne 1 ]; then
    echo "ERROR: Server failed to start within timeout. Logs:"
    cat /tmp/cloud_test_server.log
    exit 1
fi
echo "✓ Unified server healthy on port $TEST_PORT"

echo "=== [3/6] Testing Static SPA Root and Catch-All Routing ==="
ROOT_HTML=$(curl -s "http://127.0.0.1:$TEST_PORT/")
if ! echo "$ROOT_HTML" | grep -q 'id="root"'; then
    echo "ERROR: Root path / did not serve index.html!"
    exit 1
fi
echo "✓ GET / successfully served index.html"

SPA_HTML=$(curl -s "http://127.0.0.1:$TEST_PORT/courses")
if ! echo "$SPA_HTML" | grep -q 'id="root"'; then
    echo "ERROR: SPA route /courses did not fallback to index.html!"
    exit 1
fi
echo "✓ GET /courses successfully served index.html (SPA Fallback)"

echo "=== [4/6] Testing REST API Endpoints ==="
COURSES_RES=$(curl -s "http://127.0.0.1:$TEST_PORT/api/courses")
if ! echo "$COURSES_RES" | grep -q '"id"'; then
    echo "ERROR: /api/courses failed to return course catalog!"
    exit 1
fi
echo "✓ GET /api/courses returned valid JSON course catalog"

echo "=== [5/6] Testing Telegram Webhook Endpoint ==="
# Test valid webhook update
MOCK_UPDATE='{"update_id": 999999, "message": {"message_id": 1, "date": 1700000000, "chat": {"id": 12345678, "type": "private"}, "from": {"id": 12345678, "is_bot": false, "first_name": "TestStudent"}, "text": "/start"}}'

WEBHOOK_RES=$(curl -s -X POST "http://127.0.0.1:$TEST_PORT/api/telegram/webhook" \
    -H "Content-Type: application/json" \
    -H "X-Telegram-Bot-Api-Secret-Token: $TELEGRAM_SECRET_TOKEN" \
    -d "$MOCK_UPDATE")

if ! echo "$WEBHOOK_RES" | grep -q '"ok":true'; then
    echo "ERROR: Telegram webhook failed for valid payload. Response: $WEBHOOK_RES"
    exit 1
fi
echo "✓ POST /api/telegram/webhook accepted update with valid secret token"

# Test rejection with invalid secret token
REJECT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:$TEST_PORT/api/telegram/webhook" \
    -H "Content-Type: application/json" \
    -H "X-Telegram-Bot-Api-Secret-Token: wrong_secret_token" \
    -d "$MOCK_UPDATE")

if [ "$REJECT_CODE" -ne 403 ]; then
    echo "ERROR: Webhook did not reject invalid token (expected 403, got $REJECT_CODE)"
    exit 1
fi
echo "✓ POST /api/telegram/webhook strictly rejected invalid secret token (HTTP 403)"

echo "=== [6/6] Verifying API 404 Isolation ==="
API_404_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$TEST_PORT/api/nonexistent_route")
if [ "$API_404_CODE" -ne 404 ]; then
    echo "ERROR: Nonexistent API route did not return 404 (got $API_404_CODE)"
    exit 1
fi
echo "✓ Unmatched /api/* returned HTTP 404 JSON, preserving API contract"

echo "=========================================================="
echo "🎉 ALL CLOUD PRODUCTION CHECKS PASSED WITH 100% SUCCESS! 🎉"
echo "=========================================================="
