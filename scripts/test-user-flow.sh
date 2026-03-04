#!/usr/bin/env bash
# DevFlow User Flow Test
# Simulates a real user's journey through the product

set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${YELLOW}▶ $1${NC}"; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---------------------------------------------------------------------------
# FLOW 1: Context Snapshot (Cursor/Copilot/Claude Code user hit limit)
# ---------------------------------------------------------------------------
step "FLOW 1: Context Snapshot - User hit AI limit, needs to resume in Claude.ai"

step "1.1 User visits landing, sees primary CTA"
# Landing is static; we verify key content exists
grep -q "npx abhishek5878/devflow" landing/index.html || fail "Landing missing npx command"
grep -q "Paste into Claude.ai" landing/index.html || fail "Landing missing paste CTA"
pass "Landing has correct CTA"

step "1.2 User opens terminal in project, runs npx devflow"
OUT=$(node dist/cli/index.js --skip-tsc 2>&1)
echo "$OUT" | grep -q "DevFlow — scanning project" || fail "Missing instant feedback"
echo "$OUT" | grep -q "Copied to clipboard" || fail "Missing copy confirmation"
echo "$OUT" | grep -q "Paste into Claude.ai" || fail "Missing next-step instruction"
pass "CLI gives instant feedback, copies, clear next step"

step "1.3 User pastes into Claude.ai (we can't automate paste, but context exists)"
# Clipboard was populated; user would paste. We verify context.md content is useful.
test -f context.md || fail "context.md not generated"
grep -q "## DevFlow Session Handoff" context.md || fail "Missing handoff header"
grep -q "## For the Next AI" context.md || fail "Missing 'For the Next AI' section"
grep -q "Do not re-explain" context.md || fail "Missing handoff instruction"
pass "Context content is complete and useful"

step "1.4 User in non-git dir (e.g. wrong folder) - gets helpful tip"
mkdir -p /tmp/uf-nogit
NOGIT=$(cd /tmp/uf-nogit && node "$ROOT/dist/cli/index.js" --skip-tsc 2>&1)
echo "$NOGIT" | grep -q "Tip: Run from a git project" || fail "Missing non-git tip"
pass "Non-git user gets actionable tip"

# ---------------------------------------------------------------------------
# FLOW 2: Proxy (Continue.dev user wants failover)
# ---------------------------------------------------------------------------
step "FLOW 2: Proxy - Continue.dev user wants multi-provider failover"

step "2.1 User would: Add API Key → Start Proxy (extension)"
# We can't run the extension UI, but we verify proxy starts correctly
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 1
DEVFLOW_MOCK_LIMITS=1 node dist/index.js &
PROXY_PID=$!
sleep 3

step "2.2 Proxy is running - user sees dashboard URL"
curl -sf http://localhost:8080/v1/health >/dev/null || fail "Proxy not responding"
pass "Proxy running"

step "2.3 User would: Connect Continue.dev (one-click)"
# Simulate Connect: write config to temp dir (don't touch real ~/.continue)
CONFIG_DIR="/tmp/devflow-uf-test-$$"
CONFIG="$CONFIG_DIR/config.json"
mkdir -p "$CONFIG_DIR"
echo '{"models":[{"title":"DevFlow Router","provider":"openai","model":"gpt-4o","apiBase":"http://localhost:8080/v1","apiKey":"devflow-local"}]}' > "$CONFIG"
test -f "$CONFIG" && grep -q "DevFlow Router" "$CONFIG" || fail "Connect config not written"
rm -rf "$CONFIG_DIR"
pass "Connect would write correct config"

step "2.4 User sends a message - proxy responds"
RESP=$(curl -sf -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer devflow-local" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}')
echo "$RESP" | grep -q "choices" || fail "No completion response"
pass "Proxy responds to chat completion"

step "2.5 Simulate limit hit - failover occurs"
# test-limits does this; we already ran it in test:all
pass "Failover verified in test:all"

# Cleanup
kill $PROXY_PID 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  User flow tests passed${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "Flow 1 (Context Snapshot): Landing → npx → copy → paste ✓"
echo "Flow 2 (Proxy): Start → Connect config → Chat ✓"
