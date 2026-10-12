#!/usr/bin/env bash
# ==============================================================================
# AageOnline — PostgreSQL Safe Database Restore Pipeline
# Milestone 0.20.13: Backup & Restore Readiness + Worker Supervision
#
# Usage:
#   bash scripts/restore-db.sh <path_to_backup_file.dump> [target_database_url]
#
# Environment Variables:
#   RESTORE_DATABASE_URL   (Required target: explicitly designated disposable database)
#   DATABASE_URL           (Active application database: strictly prohibited as restore target)
#   RESTORE_FORCE_CONFIRM  (Required for automated / non-interactive execution: "true")
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "  AageOnline — PostgreSQL Safe Database Restore Pipeline  "
echo "  Safety Protocol: Strict Disposable Target Enforcement   "
echo "=========================================================="

# 1. Prerequisite Validation
if ! command -v pg_restore >/dev/null 2>&1; then
    echo "[ERROR] PostgreSQL utility 'pg_restore' is required but not installed on PATH." >&2
    echo "Please install postgresql-client or run inside a container equipped with pg_restore." >&2
    exit 1
fi

if [[ $# -lt 1 || -z "${1:-}" ]]; then
    echo "[ERROR] Missing backup file argument." >&2
    echo "Usage: bash scripts/restore-db.sh <path_to_backup_file.dump> [target_database_url]" >&2
    exit 1
fi

BACKUP_FILE="${1}"
TARGET_URL="${2:-${RESTORE_DATABASE_URL:-}}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "[ERROR] Backup file not found: ${BACKUP_FILE}" >&2
    exit 1
fi

# 2. Strict Target Configuration & Isolation
if [[ -z "${TARGET_URL:-}" ]]; then
    echo "[FATAL ERROR] RESTORE_DATABASE_URL is not set." >&2
    echo "Restoration requires an explicitly configured, dedicated disposable target database." >&2
    exit 1
fi

# Redact credentials before any logging
REDACTED_TARGET=$(echo "${TARGET_URL}" | sed -E 's|://([^:]+):([^@]+)@|://\1:***@|')
echo "[INFO] Restore Target: ${REDACTED_TARGET}"

# Safety Invariant A: Prohibit restoring into active application database
if [[ -n "${DATABASE_URL:-}" ]]; then
    NORMALIZED_TARGET=$(echo "${TARGET_URL}" | tr '[:upper:]' '[:lower:]')
    NORMALIZED_APP=$(echo "${DATABASE_URL}" | tr '[:upper:]' '[:lower:]')
    if [[ "${NORMALIZED_TARGET}" == "${NORMALIZED_APP}" ]]; then
        echo "[FATAL SAFETY VIOLATION] Restore target matches active application DATABASE_URL!" >&2
        echo "Direct restoration into the active primary application database is strictly prohibited." >&2
        exit 1
    fi
fi

# Safety Invariant B: Prohibit restore in production environment mode
if [[ "${NODE_ENV:-}" == "production" || "${APP_ENV:-}" == "production" ]]; then
    echo "[FATAL SAFETY VIOLATION] Cannot run database restore in production mode (NODE_ENV=production or APP_ENV=production)." >&2
    exit 1
fi

# Safety Invariant C: Target Database Name Validation
TARGET_DB_NAME=$(echo "${TARGET_URL}" | sed -E 's|.*\/([^?]+)(\?.*)?|\1|')
if [[ -z "${TARGET_DB_NAME:-}" ]]; then
    echo "[FATAL ERROR] Could not reliably extract database name from restore connection string." >&2
    exit 1
fi

# Prohibit production or staging name keywords
LOWER_DB_NAME=$(echo "${TARGET_DB_NAME}" | tr '[:upper:]' '[:lower:]')
if [[ "${LOWER_DB_NAME}" =~ (prod|production|live|staging|main|primary) ]]; then
    echo "[FATAL SAFETY VIOLATION] Target database '${TARGET_DB_NAME}' matches forbidden pattern (prod/live/staging/main)." >&2
    echo "Restoration into production or staging environments is permanently blocked." >&2
    exit 1
fi

# Require explicit disposable / test / restore keyword
if ! [[ "${LOWER_DB_NAME}" =~ (test|disposable|sandbox|restore|temp|tmp|dev|local|dummy) ]]; then
    echo "[FATAL SAFETY VIOLATION] Target database '${TARGET_DB_NAME}' lacks a recognized disposable token." >&2
    echo "Target must explicitly contain 'test', 'disposable', 'sandbox', 'restore', or 'dev' (e.g. 'aageonline_integration_test')." >&2
    exit 1
fi

# 3. Checksum Verification Pre-Flight
echo "--- Verifying backup integrity before restoration ---"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [[ -f "${CHECKSUM_FILE}" ]]; then
    if command -v sha256sum >/dev/null 2>&1; then
        EXPECTED_HASH=$(awk '{print $1}' "${CHECKSUM_FILE}")
        ACTUAL_HASH=$(sha256sum "${BACKUP_FILE}" | awk '{print $1}')
        if [[ "${ACTUAL_HASH}" != "${EXPECTED_HASH}" ]]; then
            echo "[FATAL ERROR] Checksum mismatch! Corrupt or tampered backup file." >&2
            exit 1
        fi
        echo "[OK] Checksum verified: ${ACTUAL_HASH}"
    fi
fi

# 4. Explicit Confirmation Gate
echo "----------------------------------------------------------"
echo "  WARNING: Restoration is a destructive operation!        "
echo "  Target: ${TARGET_DB_NAME}                               "
echo "----------------------------------------------------------"

CONFIRMED=false
if [[ "${RESTORE_FORCE_CONFIRM:-false}" == "true" || "${*:-}" == *"--confirm-disposable"* ]]; then
    CONFIRMED=true
elif [[ -t 0 ]]; then
    echo -n "Type 'RESTORE_DISPOSABLE_CONFIRM' to proceed: "
    read -r USER_INPUT
    if [[ "${USER_INPUT}" == "RESTORE_DISPOSABLE_CONFIRM" ]]; then
        CONFIRMED=true
    fi
fi

if [[ "${CONFIRMED}" != "true" ]]; then
    echo "[ABORTED] Restoration cancelled. Explicit confirmation required." >&2
    exit 1
fi

# 5. Execute pg_restore into Disposable Target
echo "--- Executing pg_restore into disposable target ---"
pg_restore --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    -d "${TARGET_URL}" \
    "${BACKUP_FILE}"

echo "=========================================================="
echo "  Database Restoration Completed Successfully!            "
echo "  Target: ${TARGET_DB_NAME}                               "
echo "  Post-Restore Checklist:                                 "
echo "  1. Run migration verification: npm run db:migrate       "
echo "  2. Validate health checks against restored database     "
echo "=========================================================="
