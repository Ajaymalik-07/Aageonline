#!/usr/bin/env bash
# ==============================================================================
# AageOnline — PostgreSQL Database Backup Pipeline
# Milestone 0.20.13: Backup & Restore Readiness + Worker Supervision
#
# Usage:
#   bash scripts/backup-db.sh [optional_destination_dir]
#
# Environment Variables:
#   DATABASE_URL          (Required: PostgreSQL connection string)
#   BACKUP_DIR            (Optional: defaults to ./backups)
#   BACKUP_RETENTION_DAYS (Optional: defaults to 7 days)
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "  AageOnline — Database Backup Automation Pipeline        "
echo "  Standard: PostgreSQL pg_dump Custom Format (-Fc)       "
echo "=========================================================="

# 1. Prerequisite Validation
if ! command -v pg_dump >/dev/null 2>&1; then
    echo "[ERROR] PostgreSQL utility 'pg_dump' is required but not installed on PATH." >&2
    echo "Please install postgresql-client or run inside a container equipped with pg_dump." >&2
    exit 1
fi

# Detect SHA-256 binary
if command -v sha256sum >/dev/null 2>&1; then
    SHA_CMD="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
    SHA_CMD="shasum -a 256"
else
    echo "[ERROR] Utility 'sha256sum' or 'shasum' is required for backup checksum generation." >&2
    exit 1
fi

# 2. Configuration & Credential Redaction
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "[ERROR] DATABASE_URL is not set. Cannot perform backup without target connection string." >&2
    exit 1
fi

# Safely redact credentials before any logging
REDACTED_URL=$(echo "${DATABASE_URL}" | sed -E 's|://([^:]+):([^@]+)@|://\1:***@|')
echo "[INFO] Source Database: ${REDACTED_URL}"

# Extract database name without credentials
DB_NAME=$(echo "${DATABASE_URL}" | sed -E 's|.*\/([^?]+)(\?.*)?|\1|')
if [[ -z "${DB_NAME:-}" ]]; then
    DB_NAME="aageonline_db"
fi

# 3. Destination Directory & Path Traversal Guards
DEST_DIR="${1:-${BACKUP_DIR:-./backups}}"
mkdir -p "${DEST_DIR}"
chmod 700 "${DEST_DIR}" 2>/dev/null || true

# Resolve absolute canonical directory path
RESOLVED_DIR=$(cd "${DEST_DIR}" && pwd)

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="aageonline_backup_${TIMESTAMP}.dump"

# Guard against directory traversal in requested filename
if [[ "${BACKUP_FILENAME}" == *".."* || "${BACKUP_FILENAME}" == *"/"* || "${BACKUP_FILENAME}" == *"\\"* ]]; then
    echo "[ERROR] Invalid backup filename detected. Traversal rejected." >&2
    exit 1
fi

BACKUP_FILE="${RESOLVED_DIR}/${BACKUP_FILENAME}"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
MANIFEST_FILE="${BACKUP_FILE}.manifest.json"

# Prevent accidental overwrites
if [[ -f "${BACKUP_FILE}" ]]; then
    echo "[ERROR] Destination backup file already exists: ${BACKUP_FILE}. Aborting to prevent overwrite." >&2
    exit 1
fi

echo "[INFO] Backup target: ${BACKUP_FILE}"

# 4. Execute pg_dump with Custom Format (-Fc)
echo "--- Initiating pg_dump custom format stream ---"
pg_dump -Fc \
    --no-owner \
    --no-privileges \
    --blobs \
    -d "${DATABASE_URL}" \
    -f "${BACKUP_FILE}"

FILE_SIZE=$(wc -c < "${BACKUP_FILE}" | tr -d ' ')
echo "[OK] Backup created successfully (${FILE_SIZE} bytes)."

# 5. Compute SHA-256 Checksum
echo "--- Generating SHA-256 checksum ---"
CHECKSUM_VAL=$(${SHA_CMD} "${BACKUP_FILE}" | awk '{print $1}')
echo "${CHECKSUM_VAL}  ${BACKUP_FILENAME}" > "${CHECKSUM_FILE}"
echo "[OK] Checksum: ${CHECKSUM_VAL}"

# 6. Extract Application Version
APP_VERSION="0.1.0"
if [[ -f "frontend/package.json" ]]; then
    APP_VERSION=$(grep -o '"version": *"[^"]*"' frontend/package.json | cut -d'"' -f4 || echo "0.1.0")
fi

# 7. Generate Auditable Metadata Manifest (Strictly No Credentials)
cat <<EOF > "${MANIFEST_FILE}"
{
  "manifestVersion": "1.0.0",
  "backupTimestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "databaseName": "${DB_NAME}",
  "fileName": "${BACKUP_FILENAME}",
  "fileSizeBytes": ${FILE_SIZE},
  "format": "pg_dump custom format (-Fc)",
  "checksumSha256": "${CHECKSUM_VAL}",
  "appVersion": "${APP_VERSION}",
  "verificationStatus": "PENDING",
  "encryption": {
    "encryptedAtRest": false,
    "mechanism": "Volume/Storage Provider Level (LUKS/Encrypted EBS/S3 SSE)",
    "note": "Backup file stream is unencrypted; encryption at rest depends on underlying storage volume or offsite bucket encryption."
  },
  "disasterRecovery": {
    "isOffsiteCopy": false,
    "storageTier": "Local Host Volume"
  },
  "credentialsStored": false
}
EOF

echo "[OK] Manifest generated: ${MANIFEST_FILE}"

# 8. Automated Retention Pruning (Safe Directory Scoping)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
echo "--- Checking backup retention policy (${RETENTION_DAYS} days) ---"
if [[ "${RETENTION_DAYS}" -ge 1 ]]; then
    # Strictly scope deletion to aageonline_backup_* artifacts within RESOLVED_DIR
    find "${RESOLVED_DIR}" -maxdepth 1 -type f \
        \( -name "aageonline_backup_*.dump" -o -name "aageonline_backup_*.sha256" -o -name "aageonline_backup_*.manifest.json" \) \
        -mtime "+${RETENTION_DAYS}" -exec rm -f {} +
    echo "[OK] Retention pruning completed."
fi

echo "=========================================================="
echo "  Database Backup Completed Successfully!                 "
echo "  Artifact: ${BACKUP_FILE}                                "
echo "  Checksum: ${CHECKSUM_FILE}                              "
echo "  Manifest: ${MANIFEST_FILE}                              "
echo "  Note: For disaster recovery, synchronize artifact to   "
echo "        independent offsite cloud storage (S3 / R2).      "
echo "=========================================================="
