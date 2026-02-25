#!/usr/bin/env bash
# =============================================================================
# diagnose-live-auth.sh
# Live auth diagnostic script for DevCollab and TeamFlow
#
# Usage:
#   bash scripts/diagnose-live-auth.sh          (run curl tests from local machine)
#   bash scripts/diagnose-live-auth.sh --local  (same as above)
#
# For sections 6-7, SSH into the VPS and run the commented commands.
# Fill in the FINDINGS TEMPLATE at the bottom after running all sections.
# =============================================================================

set -euo pipefail

DEVCOLLAB_WEB="https://devcollab.fernandomillan.me"
TEAMFLOW_WEB="https://teamflow.fernandomillan.me"

# Try both known API subdomain patterns (only one will be correct)
DEVCOLLAB_API_CANDIDATE_1="https://devcollab-api.fernandomillan.me"
DEVCOLLAB_API_CANDIDATE_2="https://api-devcollab.fernandomillan.me"
TEAMFLOW_API_CANDIDATE_1="https://api-teamflow.fernandomillan.me"
TEAMFLOW_API_CANDIDATE_2="https://teamflow-api.fernandomillan.me"

echo ""
echo "============================================================"
echo "  Live Auth Diagnostic — DevCollab + TeamFlow"
echo "  Run from: local machine (curl tests)"
echo "  Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "============================================================"

# ============================================================
# SECTION 1 — DevCollab API reachability
# ============================================================
echo ""
echo "=== [1] DevCollab API health ==="
echo "Trying: $DEVCOLLAB_API_CANDIDATE_1/health"
STATUS1=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$DEVCOLLAB_API_CANDIDATE_1/health" 2>/dev/null || echo "FAILED")
echo "  -> HTTP $STATUS1 from $DEVCOLLAB_API_CANDIDATE_1/health"

if [ "$STATUS1" != "200" ]; then
  echo "Trying fallback: $DEVCOLLAB_API_CANDIDATE_2/health"
  STATUS1B=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$DEVCOLLAB_API_CANDIDATE_2/health" 2>/dev/null || echo "FAILED")
  echo "  -> HTTP $STATUS1B from $DEVCOLLAB_API_CANDIDATE_2/health"
  if [ "$STATUS1B" = "200" ]; then
    DEVCOLLAB_API="$DEVCOLLAB_API_CANDIDATE_2"
    echo "  [FOUND] DevCollab API is at: $DEVCOLLAB_API"
  else
    echo "  [WARNING] Neither API domain returned 200. Container may be down or domain is different."
    DEVCOLLAB_API="$DEVCOLLAB_API_CANDIDATE_1"
  fi
else
  DEVCOLLAB_API="$DEVCOLLAB_API_CANDIDATE_1"
  echo "  [FOUND] DevCollab API is at: $DEVCOLLAB_API"
fi

# ============================================================
# SECTION 2 — DevCollab login with demo credentials (seed check + CORS check)
# ============================================================
echo ""
echo "=== [2] DevCollab login attempt ==="
echo "Endpoint: $DEVCOLLAB_API/auth/login"
echo "Credentials: admin@demo.devcollab / Demo1234!"
echo "Origin header: $DEVCOLLAB_WEB"
echo ""

DEVCOLLAB_LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  --max-time 15 \
  -X POST "$DEVCOLLAB_API/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: $DEVCOLLAB_WEB" \
  --include \
  -d '{"email":"admin@demo.devcollab","password":"Demo1234!"}' 2>/dev/null || echo "CURL_FAILED")

echo "$DEVCOLLAB_LOGIN_RESPONSE"
echo ""
echo "Interpretation:"
echo "  200 + Set-Cookie: devcollab_token=...  -> Login works"
echo "  401                                     -> API up but seed NOT run (user does not exist)"
echo "  Access-Control-Allow-Origin missing     -> CORS error (DEVCOLLAB_WEB_URL wrong in Coolify)"
echo "  CURL_FAILED / connection refused        -> Wrong API domain or container down"

# ============================================================
# SECTION 3 — TeamFlow NextAuth providers endpoint
# ============================================================
echo ""
echo "=== [3] TeamFlow NextAuth providers ==="
echo "Endpoint: $TEAMFLOW_WEB/api/auth/providers"
echo ""
TEAMFLOW_PROVIDERS=$(curl -s --max-time 10 "$TEAMFLOW_WEB/api/auth/providers" 2>/dev/null || echo "CURL_FAILED")
echo "Response: $TEAMFLOW_PROVIDERS"
echo ""
echo "Interpretation:"
echo "  JSON with 'credentials' key  -> NextAuth is up and configured"
echo "  500 / empty                  -> NEXTAUTH_SECRET or NEXTAUTH_URL missing in Coolify"
echo "  CURL_FAILED                  -> Container down or domain unreachable"

# ============================================================
# SECTION 4 — TeamFlow API reachability
# ============================================================
echo ""
echo "=== [4] TeamFlow API health ==="
echo "Trying: $TEAMFLOW_API_CANDIDATE_1/api/health"
TF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$TEAMFLOW_API_CANDIDATE_1/api/health" 2>/dev/null || echo "FAILED")
echo "  -> HTTP $TF_STATUS from $TEAMFLOW_API_CANDIDATE_1/api/health"

if [ "$TF_STATUS" != "200" ]; then
  echo "Trying fallback: $TEAMFLOW_API_CANDIDATE_2/api/health"
  TF_STATUS2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$TEAMFLOW_API_CANDIDATE_2/api/health" 2>/dev/null || echo "FAILED")
  echo "  -> HTTP $TF_STATUS2 from $TEAMFLOW_API_CANDIDATE_2/api/health"
  if [ "$TF_STATUS2" = "200" ]; then
    TEAMFLOW_API="$TEAMFLOW_API_CANDIDATE_2"
    echo "  [FOUND] TeamFlow API is at: $TEAMFLOW_API"
  else
    echo "  [WARNING] Neither TeamFlow API domain returned 200."
    TEAMFLOW_API="$TEAMFLOW_API_CANDIDATE_1"
  fi
else
  TEAMFLOW_API="$TEAMFLOW_API_CANDIDATE_1"
  echo "  [FOUND] TeamFlow API is at: $TEAMFLOW_API"
fi

# ============================================================
# SECTION 5 — TeamFlow session endpoint (Redis / NextAuth alive check)
# ============================================================
echo ""
echo "=== [5] TeamFlow session endpoint ==="
echo "Endpoint: $TEAMFLOW_WEB/api/auth/session"
echo ""
TEAMFLOW_SESSION=$(curl -s --max-time 10 "$TEAMFLOW_WEB/api/auth/session" 2>/dev/null || echo "CURL_FAILED")
echo "Response: $TEAMFLOW_SESSION"
echo ""
echo "Interpretation:"
echo "  {} or {\"user\":null}   -> NextAuth is alive (Redis may be OK if no session exists)"
echo "  5xx / error response  -> NextAuth internal failure: missing NEXTAUTH_SECRET, Redis down"
echo "  CURL_FAILED           -> Container down"

# ============================================================
# SECTION 6 — Docker container logs (requires SSH into VPS as root)
# ============================================================
echo ""
echo "=== [6] Docker container logs (VPS commands — SSH required) ==="
echo ""
echo "  Run these on VPS after: ssh <your-vps> && sudo su -"
echo ""
echo "  # List running container names first:"
echo "  docker ps --format '{{.Names}}'"
echo ""
echo "  # DevCollab API logs (look for: error, cors, jwt, seed):"
echo "  docker logs devcollab-api --tail 50 2>&1 | grep -iE 'error|cors|jwt|seed'"
echo ""
echo "  # DevCollab Web logs (look for: error, api_url, localhost):"
echo "  docker logs devcollab-web --tail 50 2>&1 | grep -iE 'error|api_url|localhost'"
echo ""
echo "  # TeamFlow Web logs (look for: error, redis, jwt, nextauth):"
echo "  docker logs teamflow-web --tail 50 2>&1 | grep -iE 'error|redis|jwt|nextauth'"
echo "  # Try alternate name if the above fails:"
echo "  docker logs teamflow-web-prod --tail 50 2>&1 | grep -iE 'error|redis|jwt|nextauth'"
echo ""
echo "  # TeamFlow API logs (look for: error, cors, jwt):"
echo "  docker logs teamflow-api --tail 50 2>&1 | grep -iE 'error|cors|jwt'"
echo "  # Try alternate name if the above fails:"
echo "  docker logs teamflow-api-prod --tail 50 2>&1 | grep -iE 'error|cors|jwt'"

# ============================================================
# SECTION 7 — JWT_SECRET fingerprint check (run on VPS as root)
# ============================================================
echo ""
echo "=== [7] JWT_SECRET fingerprint check (VPS commands — SSH required) ==="
echo ""
echo "  # On VPS, inspect running env vars (partial reveal only, first 60 chars):"
echo ""
echo "  # DevCollab API JWT secret:"
echo "  docker inspect devcollab-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -iE 'jwt|secret' | cut -c1-60"
echo ""
echo "  # TeamFlow Web JWT secret:"
echo "  docker inspect teamflow-web --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -iE 'jwt|secret|nextauth|redis|database' | cut -c1-80"
echo ""
echo "  # TeamFlow API JWT secret:"
echo "  docker inspect teamflow-api --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -iE 'jwt|cors' | cut -c1-80"
echo ""
echo "  CRITICAL: Both teamflow-web JWT_SECRET and teamflow-api JWT_SECRET must be IDENTICAL."
echo "  A mismatch means authenticated API calls will all return 401 (invalid signature)."

echo ""
echo "============================================================"
echo "  END OF AUTOMATED CHECKS"
echo "  Fill in FINDINGS TEMPLATE below after running sections 6-7 on VPS"
echo "============================================================"

# ============================================================
# FINDINGS TEMPLATE — fill in and report back after running:
# ============================================================
# [1] DevCollab API domain: _____ HTTP status: _____
# [2] DevCollab login result: _____ (200/401/CORS error/refused)
# [3] TeamFlow providers JSON: _____ (has credentials / 500 error)
# [4] TeamFlow API domain: _____ HTTP status: _____
# [5] TeamFlow session JSON: _____ ({} / error message)
# [6] Notable container log lines: _____
# [7] JWT_SECRET match (web vs api): same / different / not set
# ============================================================
