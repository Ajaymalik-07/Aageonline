#!/usr/bin/env bash
# ==============================================================================
# AageOnline — Production Deployment & Verification Script
# Milestone 0.20.6 / Phase 1F: Deployment Script Reliability Hardening
# Usage:
#   bash scripts/deploy.sh                 # Full build, migration & deployment pipeline
#   bash scripts/deploy.sh --preflight-only # Execute preflight configuration validation only
# ==============================================================================

set -euo pipefail

PREFLIGHT_ONLY=false
if [[ "${1:-}" == "--preflight-only" || "${1:-}" == "-p" ]]; then
    PREFLIGHT_ONLY=true
fi

echo "=========================================================="
echo "  AageOnline — Deployment Pipeline                        "
echo "  Architecture: Docker VPS + Managed PostgreSQL + Caddy   "
echo "=========================================================="

ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# 1. Verify Configuration File & Permissions
if [[ ! -f "${ENV_FILE}" ]]; then
    echo "[ERROR] ${ENV_FILE} not found!" >&2
    echo "Please create ${ENV_FILE} from .env.production.example and configure credentials." >&2
    exit 1
fi

# Enforce secure file permissions (owner read/write only)
chmod 600 "${ENV_FILE}" 2>/dev/null || true
echo "[OK] ${ENV_FILE} exists with secure permissions."

# 2. Source and Validate Environment Variables
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

# --- Database Configuration Safeguards ---
if [[ -z "${DATABASE_URL:-}" || "${DATABASE_URL:-}" == *"REPLACE_"* || "${DATABASE_URL:-}" == *"managed-db.example.com"* ]]; then
    echo "[ERROR] DATABASE_URL in ${ENV_FILE} is missing, blank, or contains placeholders!" >&2
    echo "Please provide your genuine managed PostgreSQL 16+ SSL connection string." >&2
    exit 1
fi

# Invariant: Verify direct session connection for worker & migrator advisory locks
# Session advisory locks: pg_try_advisory_lock(829104812) [migrator], pg_try_advisory_lock(94827104) [worker supervisor]
if [[ "${DATABASE_URL}" == *":6543"* || "${DATABASE_URL}" == *"pool_mode=transaction"* ]]; then
    echo "[ERROR] DATABASE_URL appears to use a transaction-mode connection pooler (e.g., port 6543 or pool_mode=transaction)!" >&2
    echo "Worker supervisor and migrator require direct session connections for session-level advisory locks." >&2
    echo "Configure the direct PostgreSQL session port (typically 5432 or 25060 for managed clusters)." >&2
    exit 1
fi

# Aggregate Connection Budget Check
MAX_CONNS="${DATABASE_MAX_CONNECTIONS:-10}"
if ! [[ "${MAX_CONNS}" =~ ^[0-9]+$ ]] || [[ "${MAX_CONNS}" -lt 1 ]]; then
    echo "[ERROR] DATABASE_MAX_CONNECTIONS must be a positive integer. Found: '${MAX_CONNS}'" >&2
    exit 1
fi
AGGREGATE_BUDGET=$(( (MAX_CONNS * 2) + 5 ))
echo "[OK] Database aggregate connection budget: ${AGGREGATE_BUDGET} max connections (web: ${MAX_CONNS}, api: ${MAX_CONNS}, worker: 5, migrator: 1 one-off)."

# TLS Certificate Validation Safeguards
if [[ "${APP_ENV:-production}" == "production" ]]; then
    if [[ "${DATABASE_SSL_REJECT_UNAUTHORIZED:-true}" == "false" ]]; then
        echo "[ERROR] DATABASE_SSL_REJECT_UNAUTHORIZED is set to 'false' in production!" >&2
        echo "Strict CA certificate chain validation is mandatory to prevent MITM attacks." >&2
        exit 1
    fi
    echo "[OK] Strict database TLS certificate validation enforced (DATABASE_SSL_REJECT_UNAUTHORIZED=true)."
else
    if [[ "${DATABASE_SSL_REJECT_UNAUTHORIZED:-true}" == "false" ]]; then
        echo "[WARNING] DATABASE_SSL_REJECT_UNAUTHORIZED is disabled. TLS certificates will not be verified against trusted CAs."
    fi
fi

# --- Cryptographic Security Keys Validation ---
if [[ -z "${AUTH_SECRET:-}" || "${AUTH_SECRET:-}" == *"REPLACE_"* || ${#AUTH_SECRET} -lt 32 ]]; then
    echo "[ERROR] AUTH_SECRET in ${ENV_FILE} is missing, placeholder, or insecure (< 32 characters)." >&2
    echo "Generate with: openssl rand -hex 32" >&2
    exit 1
fi

if [[ -z "${SESSION_SECRET:-}" || "${SESSION_SECRET:-}" == *"REPLACE_"* || ${#SESSION_SECRET} -lt 32 ]]; then
    echo "[ERROR] SESSION_SECRET in ${ENV_FILE} is missing, placeholder, or insecure (< 32 characters)." >&2
    echo "Generate with: openssl rand -hex 32" >&2
    exit 1
fi

if [[ -z "${RATE_LIMIT_SALT:-}" || "${RATE_LIMIT_SALT:-}" == *"REPLACE_"* ]]; then
    echo "[ERROR] RATE_LIMIT_SALT in ${ENV_FILE} is missing or placeholder." >&2
    echo "Generate with: openssl rand -hex 32" >&2
    exit 1
fi

if [[ -z "${ADMIN_TOKEN:-}" || "${ADMIN_TOKEN:-}" == *"REPLACE_"* || ${#ADMIN_TOKEN} -lt 32 ]]; then
    echo "[ERROR] ADMIN_TOKEN in ${ENV_FILE} is missing, placeholder, or insecure (< 32 characters)." >&2
    echo "Admin service authentication requires a dedicated secret token. Generate with: openssl rand -hex 32" >&2
    exit 1
fi

# --- Payment Gateway (PayU) Environment Safety ---
if [[ "${PAYU_ENV:-}" != "test" && "${PAYU_ENV:-}" != "production" ]]; then
    echo "[ERROR] PAYU_ENV must be explicitly set to 'test' or 'production'. Found: '${PAYU_ENV:-<empty>}'" >&2
    exit 1
fi

if [[ "${PAYU_ENV}" == "production" ]]; then
    # Invariant: Non-production environments must never use PAYU_ENV=production
    if [[ "${APP_ENV:-production}" != "production" ]]; then
        echo "[ERROR] PAYU_ENV is set to 'production' in non-production environment '${APP_ENV:-development}'!" >&2
        echo "Live customer payments are strictly prohibited outside production (APP_ENV=production). Use PAYU_ENV=test." >&2
        exit 1
    fi

    # Reject known sandbox / test keys
    if [[ "${PAYU_MERCHANT_KEY:-}" == "gtKFFx" || "${PAYU_MERCHANT_SALT:-}" == "eCwWELxi" ]]; then
        echo "[ERROR] PAYU_ENV is set to production but sandbox test credentials (gtKFFx/eCwWELxi) are configured!" >&2
        echo "Production deployment requires genuine merchant portal credentials." >&2
        exit 1
    fi

    # Reject missing or placeholder merchant credentials
    if [[ -z "${PAYU_MERCHANT_KEY:-}" || "${PAYU_MERCHANT_KEY:-}" == *"REPLACE_"* ]]; then
        echo "[ERROR] PAYU_MERCHANT_KEY is missing or placeholder in production mode!" >&2
        exit 1
    fi

    if [[ -z "${PAYU_MERCHANT_SALT:-}" || "${PAYU_MERCHANT_SALT:-}" == *"REPLACE_"* ]]; then
        echo "[ERROR] PAYU_MERCHANT_SALT is missing or placeholder in production mode!" >&2
        exit 1
    fi
    echo "[OK] Verified production PayU configuration with genuine merchant credentials."
else
    echo "[OK] Verified PayU test/sandbox mode active (PAYU_ENV=test). Real payments are disabled."
fi

# --- Outbound Email Non-Production Safety Invariant ---
if [[ "${APP_ENV:-production}" != "production" ]]; then
    if [[ "${NOTIFICATION_EMAIL_ENABLED:-false}" == "true" ]]; then
        if [[ "${EMAIL_SAFETY_SINK_ENABLED:-false}" != "true" ]]; then
            echo "[ERROR] NOTIFICATION_EMAIL_ENABLED is true in non-production environment '${APP_ENV}' without EMAIL_SAFETY_SINK_ENABLED=true!" >&2
            echo "Non-production environments must not dispatch emails to real customer mailboxes." >&2
            echo "Either set EMAIL_SAFETY_SINK_ENABLED=true or set NOTIFICATION_EMAIL_ENABLED=false." >&2
            exit 1
        fi
        echo "[OK] Verified email safety sink active: outbound notifications are intercepted locally."
    else
        echo "[OK] Outbound email disabled for non-production environment."
    fi
fi

# Print safe summary (NEVER print secret values)
echo "[OK] Preflight environment validation passed:"
echo "     SITE_ADDRESS:   ${SITE_ADDRESS:-aageonline.com}"
echo "     APP_ENV:        ${APP_ENV:-production}"
echo "     PAYU_ENV:       ${PAYU_ENV}"
echo "     DATABASE_SSL:   ${DATABASE_SSL:-true} (rejectUnauthorized: ${DATABASE_SSL_REJECT_UNAUTHORIZED:-true})"
echo "     MAX_CONNS:      ${MAX_CONNS} (aggregate budget: ${AGGREGATE_BUDGET})"

if [[ "${PREFLIGHT_ONLY}" == "true" ]]; then
    echo "=========================================================="
    echo "  Preflight Validation Completed Successfully!            "
    echo "=========================================================="
    exit 0
fi

# 3. Build Production Multi-Stage Containers
echo "--- Building Docker images ---"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" build

# 4. Execute Database Migrations via Migrator Container BEFORE Service Rollout
echo "--- Running Database Migrations via Migrator Container ---"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm migrator

# 5. Start Production Services
echo "--- Launching Production Services ---"
docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d

# 6. Service Readiness: Wait for EVERY Required Service to Become Healthy
echo "--- Waiting for service health probes (web, api, admin, worker, caddy) ---"

DEPLOY_TIMEOUT_SECS="${DEPLOY_TIMEOUT_SECS:-90}"
DEPLOY_POLL_INTERVAL_SECS="${DEPLOY_POLL_INTERVAL_SECS:-3}"

REQUIRED_SERVICES=("web" "api" "admin" "worker" "caddy")
REQUIRED_CONTAINERS=("aageonline_web" "aageonline_api" "aageonline_admin" "aageonline_worker" "aageonline_caddy")

ELAPSED=0
ALL_HEALTHY=false

while [[ ${ELAPSED} -lt ${DEPLOY_TIMEOUT_SECS} ]]; do
    PENDING_SERVICES=()

    for i in "${!REQUIRED_SERVICES[@]}"; do
        SVC="${REQUIRED_SERVICES[$i]}"
        CONTAINER="${REQUIRED_CONTAINERS[$i]}"

        HEALTH_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${CONTAINER}" 2>/dev/null || echo "not_found")
        IS_RUNNING=$(docker inspect --format='{{.State.Running}}' "${CONTAINER}" 2>/dev/null || echo "false")

        if [[ "${IS_RUNNING}" != "true" || "${HEALTH_STATUS}" == "unhealthy" || "${HEALTH_STATUS}" == "dead" ]]; then
            echo "[WARN] Service '${SVC}' (${CONTAINER}) is in abnormal state: health=${HEALTH_STATUS}, running=${IS_RUNNING}"
            PENDING_SERVICES+=("${SVC}")
        elif [[ "${HEALTH_STATUS}" != "healthy" && "${HEALTH_STATUS}" != "running" ]]; then
            PENDING_SERVICES+=("${SVC}")
        fi
    done

    if [[ ${#PENDING_SERVICES[@]} -eq 0 ]]; then
        ALL_HEALTHY=true
        echo "[SUCCESS] All required services (web, api, admin, worker, caddy) are healthy and running!"
        break
    fi

    echo "Waiting for services to become healthy: [${PENDING_SERVICES[*]}] (${ELAPSED}s / ${DEPLOY_TIMEOUT_SECS}s)..."
    sleep "${DEPLOY_POLL_INTERVAL_SECS}"
    ELAPSED=$((ELAPSED + DEPLOY_POLL_INTERVAL_SECS))
done

# On Timeout: Print Sanitized Service Diagnostics & Exit Non-Zero
if [[ "${ALL_HEALTHY}" != "true" ]]; then
    echo "" >&2
    echo "==========================================================" >&2
    echo "  [ERROR] DEPLOYMENT TIMED OUT AFTER ${DEPLOY_TIMEOUT_SECS}s!                 " >&2
    echo "  One or more required services failed to reach healthy state." >&2
    echo "==========================================================" >&2
    echo "--- Container Status Overview ---" >&2
    docker compose -f "${COMPOSE_FILE}" ps >&2 || true

    echo "" >&2
    echo "--- Sanitized Diagnostics (Redacted) ---" >&2
    for SVC in "${REQUIRED_SERVICES[@]}"; do
        echo ">>> Recent logs for service '${SVC}':" >&2
        docker compose -f "${COMPOSE_FILE}" logs --tail 30 "${SVC}" 2>/dev/null | \
            sed -E 's|://([^:]+):([^@]+)@|://\1:***@|g; s/[0-9a-fA-F]{32,}/[REDACTED_SECRET]/g; s/[A-Za-z0-9+/=]{40,}/[REDACTED_SECRET]/g' >&2 || true
    done

    echo "" >&2
    echo "==========================================================" >&2
    echo "  DEPLOYMENT ROLLBACK & RECOVERY GUIDANCE                 " >&2
    echo "==========================================================" >&2
    echo "1. APPLICATION-LEVEL FAILURE DETECTED:" >&2
    echo "   Do NOT automatically restore a database backup!" >&2
    echo "   Database migrations are forward-compatible and database state" >&2
    echo "   is unaffected by application container startup failures." >&2
    echo "   Automatic restoration would destroy valid, newly created data." >&2
    echo "" >&2
    echo "2. APPLICATION ROLLBACK PROCEDURE:" >&2
    echo "   Roll back containers to the previous known-good image release:" >&2
    echo "   docker compose -f ${COMPOSE_FILE} up -d <previous-image-tag>" >&2
    echo "" >&2
    echo "3. DISASTER RECOVERY (Only if database corruption is independently proven):" >&2
    echo "   Restoration requires an explicit, separately approved procedure:" >&2
    echo "   RESTORE_FORCE_CONFIRM=true bash scripts/restore-db.sh <backup.dump> <RESTORE_DATABASE_URL>" >&2
    echo "==========================================================" >&2
    exit 1
fi

# 7. Print Final Container Status
echo "--- Running Container Status ---"
docker compose -f "${COMPOSE_FILE}" ps

# 8. Local Internal Smoke Test (Liveness & Readiness across Services)
echo "--- Executing internal health checks inside container network ---"

echo "1. Web Liveness Probe:"
docker compose -f "${COMPOSE_FILE}" exec web wget -qO- http://127.0.0.1:3000/api/health/live
echo ""

echo "2. Web Readiness Probe:"
READY_JSON=$(docker compose -f "${COMPOSE_FILE}" exec web wget -qO- http://127.0.0.1:3000/api/health/ready)
echo "${READY_JSON}"
echo ""

if [[ "${READY_JSON}" != *"\"ready\":true"* && "${READY_JSON}" != *"\"status\":\"UP\""* ]]; then
    echo "[ERROR] Web readiness probe returned unready status! Check database connectivity and migrations." >&2
    exit 1
fi

echo "3. API Health Probe:"
docker compose -f "${COMPOSE_FILE}" exec api wget -qO- http://127.0.0.1:4000/api/health/live
echo ""

echo "4. Admin Health Probe:"
docker compose -f "${COMPOSE_FILE}" exec admin wget -qO- http://127.0.0.1:3001/api/health
echo ""

echo "5. Worker Health Probe:"
docker compose -f "${COMPOSE_FILE}" exec worker node --experimental-strip-types scripts/worker.ts --health
echo ""

echo "=========================================================="
echo "  Production Deployment Completed Successfully!           "
echo "  Public URL: https://${SITE_ADDRESS:-aageonline.com}     "
echo "=========================================================="
