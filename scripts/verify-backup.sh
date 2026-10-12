#!/usr/bin/env bash
# ==============================================================================
# AageOnline — PostgreSQL Backup Verification Pipeline
# Milestone 0.20.13: Backup & Restore Readiness + Worker Supervision
#
# Usage:
#   bash scripts/verify-backup.sh <path_to_backup_file.dump>
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "  AageOnline — Backup Integrity Verification Pipeline    "
echo "=========================================================="

if [[ $# -lt 1 || -z "${1:-}" ]]; then
    echo "[ERROR] Missing backup file argument." >&2
    echo "Usage: bash scripts/verify-backup.sh <path_to_backup_file.dump>" >&2
    exit 1
fi

BACKUP_FILE="${1}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "[ERROR] Backup file does not exist: ${BACKUP_FILE}" >&2
    exit 1
fi

# Detect SHA-256 binary
if command -v sha256sum >/dev/null 2>&1; then
    SHA_CMD="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
    SHA_CMD="shasum -a 256"
else
    echo "[ERROR] Utility 'sha256sum' or 'shasum' is required for checksum verification." >&2
    exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"
MANIFEST_FILE="${BACKUP_FILE}.manifest.json"

EXPECTED_CHECKSUM=""

if [[ -f "${CHECKSUM_FILE}" ]]; then
    EXPECTED_CHECKSUM=$(awk '{print $1}' "${CHECKSUM_FILE}")
elif [[ -f "${MANIFEST_FILE}" ]]; then
    EXPECTED_CHECKSUM=$(grep -o '"checksumSha256": *"[^"]*"' "${MANIFEST_FILE}" | cut -d'"' -f4)
else
    echo "[ERROR] Neither ${CHECKSUM_FILE} nor ${MANIFEST_FILE} found for verification." >&2
    exit 1
fi

if [[ -z "${EXPECTED_CHECKSUM}" ]]; then
    echo "[ERROR] Could not extract expected SHA-256 checksum." >&2
    exit 1
fi

echo "--- Verifying SHA-256 checksum ---"
ACTUAL_CHECKSUM=$(${SHA_CMD} "${BACKUP_FILE}" | awk '{print $1}')

if [[ "${ACTUAL_CHECKSUM}" != "${EXPECTED_CHECKSUM}" ]]; then
    echo "[FATAL ERROR] Checksum verification failed!" >&2
    echo "Expected: ${EXPECTED_CHECKSUM}" >&2
    echo "Actual:   ${ACTUAL_CHECKSUM}" >&2
    exit 1
fi

echo "[SUCCESS] Checksum matches: ${ACTUAL_CHECKSUM}"

# Check archive integrity using pg_restore --list if available
if command -v pg_restore >/dev/null 2>&1; then
    echo "--- Testing PostgreSQL archive stream integrity (pg_restore --list) ---"
    if pg_restore --list "${BACKUP_FILE}" >/dev/null 2>&1; then
        TABLE_COUNT=$(pg_restore --list "${BACKUP_FILE}" | grep -c "TABLE DATA" || echo "0")
        echo "[SUCCESS] Archive stream and table catalog valid (${TABLE_COUNT} table data segments identified)."
    else
        echo "[FATAL ERROR] pg_restore failed to read archive header or TOC catalogue! Archive corrupt." >&2
        exit 1
    fi
else
    echo "[WARNING] pg_restore is not installed on PATH; archive header listing deferred. Checksum validation succeeded."
fi

# Update manifest verification status if present
if [[ -f "${MANIFEST_FILE}" ]]; then
    sed -i 's/"verificationStatus": "PENDING"/"verificationStatus": "VERIFIED"/' "${MANIFEST_FILE}" 2>/dev/null || true
    echo "[OK] Updated manifest status to VERIFIED in ${MANIFEST_FILE}."
fi

echo "=========================================================="
echo "  Backup Verification PASSED: ${BACKUP_FILE}              "
echo "=========================================================="
