#!/usr/bin/env bash
# ==============================================================================
# AageOnline — Production Deployment & Verification Script
# Milestone 0.20.6: Local Development → Production Deployment Architecture
# Usage: bash scripts/deploy.sh
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "  AageOnline — Production Deployment Pipeline            "
echo "  Architecture: Docker VPS + Managed PostgreSQL + Caddy   "
echo "=========================================================="

ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.yml"

# 1. Verify Configuration File & Permissions
if [[ ! -f "${ENV_FILE}" ]]; then
    echo "[ERROR] ${ENV_FILE} not found!" >&2
    echo "Please create ${ENV_FILE} from .env.production.example and configure credentials." >&2
    exit 1
fi

# Enforce secure file permissions (owner read/write only)
chmod 600 "${ENV_FILE}"
echo "[OK] ${ENV_FILE} exists with permissions $(stat -c %a "${ENV_FILE}" 2>/dev/null || stat -f %Lp "${ENV_FILE}" 2>/dev/null || echo '600')."

# 2. Source and Validate Environment Variables
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

if [[ "${DATABASE_URL:-}" == *"REPLACE_"* || "${DATABASE_URL:-}" == *"managed-db.example.com"* || -z "${DATABASE_URL:-}" ]]; then
    echo "[ERROR] DATABASE_URL in ${ENV_FILE} is not properly configured!" >&2
    echo "Please provide your real managed PostgreSQL 16+ SSL connection string." >&2
    exit 1
fi

if [[ "${AUTH_SECRET:-}" == *"REPLACE_"* || -z "${AUTH_SECRET:-}" || ${#AUTH_SECRET} -lt 32 ]]; then
    echo "[ERROR] AUTH_SECRET in ${ENV_FILE} is missing or insecure (< 32 characters)." >&2
    echo "Generate with: openssl rand -hex 32" >&2
    exit 1
fi

if [[ "${RATE_LIMIT_SALT:-}" == *"REPLACE_"* || -z "${RATE_LIMIT_SALT:-}" ]]; then
    echo "[ERROR] RATE_LIMIT_SALT in ${ENV_FILE} is not configured." >&2
    echo "Generate with: openssl rand -hex 32" >&2
    exit 1
fi

# Verify Payment Gateway Environment Safety
if [[ "${PAYU_ENV:-}" == "production" ]]; then
    if [[ "${PAYU_MERCHANT_KEY:-}" == "gtKFFx" || "${PAYU_MERCHANT_SALT:-}" == "eCwWELxi" ]]; then
        echo "[ERROR] PAYU_ENV is set to production but test credentials (gtKFFx/eCwWELxi) are configured!" >&2
        echo "Production deployment requires genuine merchant portal credentials." >&2
        exit 1
    fi
    echo "[OK] Verified production PayU configuration."
else
    echo "[WARNING] PAYU_ENV is set to '${PAYU_ENV:-test}'. Verify this is intended before opening to real customer payments."
fi

echo "[OK] Environment configuration verified."
echo "     SITE_ADDRESS: ${SITE_ADDRESS:-aageonline.com}"
echo "     APP_ENV:      ${APP_ENV:-production}"
echo "     PAYU_ENV:     ${PAYU_ENV:-test}"

# 3. Build Production Multi-Stage Containers
echo "--- Building Docker images ---"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" build

# 4. Execute Database Migrations (001-010) via Migrator Container BEFORE Rollout
# Note: Any migration error immediately halts execution with exit code 1 under set -euo pipefail
echo "--- Running Database Migrations (001-010) ---"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm migrator

# 5. Start Production Services (Caddy, Next.js Web, Reconciler Worker)
echo "--- Launching Production Services ---"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d

# 6. Wait for Next.js Web Container Health Probe
echo "--- Waiting for web container health probe ---"
MAX_WAIT=45
WAIT_COUNT=0
while [[ ${WAIT_COUNT} -lt ${MAX_WAIT} ]]; do
    HEALTH_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' aageonline_web 2>/dev/null || echo '"starting"')
    if [[ "${HEALTH_STATUS}" == '"healthy"' ]]; then
        echo "[SUCCESS] aageonline_web is healthy!"
        break
    fi
    echo "Container health status: ${HEALTH_STATUS} (waiting... ${WAIT_COUNT}s)"
    sleep 3
    WAIT_COUNT=$((WAIT_COUNT + 3))
done

if [[ ${WAIT_COUNT} -ge ${MAX_WAIT} ]]; then
    echo "[ERROR] Web container failed to reach healthy status within ${MAX_WAIT}s!" >&2
    docker compose -f "${COMPOSE_FILE}" logs --tail 50 web
    exit 1
fi

# 7. Print Container Status
echo "--- Running Container Status ---"
docker compose -f "${COMPOSE_FILE}" ps

# 8. Local Internal Smoke Test (Liveness & Readiness)
echo "--- Executing internal health checks inside container network ---"
echo "1. Liveness Probe:"
docker compose -f "${COMPOSE_FILE}" exec web wget -qO- http://127.0.0.1:3000/api/health/live
echo ""

echo "2. Readiness Probe:"
READY_JSON=$(docker compose -f "${COMPOSE_FILE}" exec web wget -qO- http://127.0.0.1:3000/api/health/ready)
echo "${READY_JSON}"
echo ""

if [[ "${READY_JSON}" != *"\"ready\":true"* && "${READY_JSON}" != *"\"status\":\"UP\""* ]]; then
    echo "[ERROR] Readiness probe returned unready status! Check database connectivity and migrations." >&2
    exit 1
fi

echo "=========================================================="
echo "  Production Deployment Completed Successfully!           "
echo "  Public URL: https://${SITE_ADDRESS:-aageonline.com}     "
echo "=========================================================="
