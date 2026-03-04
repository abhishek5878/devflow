#!/usr/bin/env bash
# Full DevFlow test: build, context, extension, proxy failover, client
set -e
echo "=== DevFlow Full Test Suite ==="
echo ""

echo "[1/5] Build + Context + Extension..."
npm test
echo ""

echo "[2/5] Starting proxy (mock mode)..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
DEVFLOW_MOCK_LIMITS=1 npm run dev &
sleep 5
echo ""

echo "[3/5] Proxy failover test..."
npm run test:proxy
echo ""

echo "[4/5] Test client..."
npm run test:client
echo ""

echo "[5/5] Tests complete. Stopping proxy..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
echo ""
echo "✅ All tests passed"
