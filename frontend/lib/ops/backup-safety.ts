/**
 * AageOnline — Database Backup & Restore Operational Safety Engine
 *
 * Enforces strict safety, path containment, target isolation, and credential redaction
 * for PostgreSQL backup, verification, and restoration routines.
 *
 * SAFETY INVARIANTS:
 * 1. Directory Containment: Backups must never write to or delete files outside designated BACKUP_DIR.
 * 2. Active Application DB Protection: Restore must NEVER target the current active application DATABASE_URL.
 * 3. Disposable Target Requirement: Restore requires an explicitly designated disposable target database.
 * 4. Production Rejection: Restore is strictly forbidden when NODE_ENV=production or APP_ENV=production.
 * 5. Checksum Integrity: Checksum verification failure strictly halts restoration.
 * 6. Zero Credential Exposure: Connection strings are redacted in manifests, logs, and error messages.
 */

import path from 'node:path';
import { redactConnectionString, extractDatabaseName } from '../db/test-safety.ts';

export interface BackupManifest {
  manifestVersion: string;
  backupTimestamp: string;
  databaseName: string;
  fileName: string;
  fileSizeBytes: number;
  format: string;
  checksumSha256: string;
  appVersion?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  encryption: {
    encryptedAtRest: boolean;
    mechanism: string;
    note: string;
  };
  disasterRecovery: {
    isOffsiteCopy: boolean;
    storageTier: string;
  };
  credentialsStored: false;
}

export interface PathValidationResult {
  isSafe: boolean;
  resolvedPath?: string;
  error?: string;
}

export interface RestoreTargetValidationResult {
  isSafe: boolean;
  databaseName?: string;
  sanitizedTarget?: string;
  error?: string;
}

export interface RetentionPruningPlan {
  toDelete: string[];
  toKeep: string[];
  protectedCount: number;
}

/**
 * Validates and resolves a backup file path, preventing directory traversal attacks.
 */
export function validateBackupPath(
  destinationDir: string,
  requestedFilename: string
): PathValidationResult {
  if (!destinationDir || destinationDir.trim().length === 0) {
    return { isSafe: false, error: 'Backup destination directory must not be empty.' };
  }

  if (!requestedFilename || requestedFilename.trim().length === 0) {
    return { isSafe: false, error: 'Backup filename must not be empty.' };
  }

  // Reject directory traversal sequences
  if (
    requestedFilename.includes('..') ||
    requestedFilename.includes('/') ||
    requestedFilename.includes('\\')
  ) {
    return {
      isSafe: false,
      error: `Filename "${requestedFilename}" contains directory traversal or separator characters.`,
    };
  }

  // Enforce valid backup filename format
  const validPattern = /^[a-zA-Z0-9_\-.]+$/;
  if (!validPattern.test(requestedFilename)) {
    return {
      isSafe: false,
      error: `Filename "${requestedFilename}" contains invalid characters. Must be alphanumeric with dashes, underscores, or dots.`,
    };
  }

  const normalizedDir = path.resolve(destinationDir);
  const resolvedPath = path.resolve(normalizedDir, requestedFilename);

  // Ensure resolved path starts strictly within normalizedDir
  const relative = path.relative(normalizedDir, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return {
      isSafe: false,
      error: `Path traversal detected: "${resolvedPath}" escapes backup directory "${normalizedDir}".`,
    };
  }

  return {
    isSafe: true,
    resolvedPath,
  };
}

/**
 * Validates whether a database connection string is a safe, disposable restore target.
 * Rejects production, staging, active application databases, and ambiguous targets.
 */
export function validateRestoreTarget(
  targetUrl?: string,
  currentAppUrl?: string,
  env: Record<string, string | undefined> = process.env
): RestoreTargetValidationResult {
  if (!targetUrl || targetUrl.trim().length === 0) {
    return {
      isSafe: false,
      error: 'RESTORE_DATABASE_URL is not configured. Restore requires an explicit target.',
    };
  }

  const sanitizedTarget = redactConnectionString(targetUrl);

  // 1. Guard against restoring into current active application database
  if (currentAppUrl && currentAppUrl.trim().length > 0) {
    const targetNorm = targetUrl.trim().toLowerCase();
    const appNorm = currentAppUrl.trim().toLowerCase();
    if (targetNorm === appNorm) {
      return {
        isSafe: false,
        sanitizedTarget,
        error: 'RESTORE BLOCKED: Target database matches the active application DATABASE_URL. Restoring into active production or primary database is strictly prohibited.',
      };
    }
  }

  // 2. Production Environment Guard
  if (env.NODE_ENV === 'production' || env.APP_ENV === 'production') {
    return {
      isSafe: false,
      sanitizedTarget,
      error: 'RESTORE BLOCKED: Cannot execute restore operations in production environment mode (NODE_ENV=production or APP_ENV=production).',
    };
  }

  // 3. Extract database name
  const dbName = extractDatabaseName(targetUrl);
  if (!dbName) {
    return {
      isSafe: false,
      sanitizedTarget,
      error: 'Could not reliably parse database name from restore connection string. Target is ambiguous.',
    };
  }

  // 4. Prohibit production-looking target database names
  const forbiddenPatterns = [
    /prod/i,
    /production/i,
    /live/i,
    /staging/i,
    /primary/i,
    /main/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(dbName)) {
      return {
        isSafe: false,
        databaseName: dbName,
        sanitizedTarget,
        error: `RESTORE BLOCKED: Target database "${dbName}" matches forbidden target pattern (${pattern.source}). Must never restore into production, live, or staging databases.`,
      };
    }
  }

  // 5. Require explicit disposable / test / restore designation
  const disposablePattern = /(?:test|disposable|sandbox|restore|temp|tmp|dev|local|dummy)/i;
  if (!disposablePattern.test(dbName)) {
    return {
      isSafe: false,
      databaseName: dbName,
      sanitizedTarget,
      error: `RESTORE BLOCKED: Target database "${dbName}" does not contain a recognized disposable token ("test", "disposable", "sandbox", "restore", "dev"). Restoration is permitted ONLY into explicitly disposable databases.`,
    };
  }

  return {
    isSafe: true,
    databaseName: dbName,
    sanitizedTarget,
  };
}

/**
 * Generates an auditable metadata manifest for a PostgreSQL backup artifact.
 */
export function generateBackupManifest(options: {
  backupFileName: string;
  databaseName: string;
  checksumSha256: string;
  fileSizeBytes: number;
  appVersion?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'FAILED';
  encryptedAtRest?: boolean;
  encryptionMechanism?: string;
  isOffsiteCopy?: boolean;
  timestamp?: string;
}): BackupManifest {
  return {
    manifestVersion: '1.0.0',
    backupTimestamp: options.timestamp || new Date().toISOString(),
    databaseName: options.databaseName,
    fileName: options.backupFileName,
    fileSizeBytes: options.fileSizeBytes,
    format: 'pg_dump custom format (-Fc)',
    checksumSha256: options.checksumSha256,
    appVersion: options.appVersion || '0.1.0',
    verificationStatus: options.verificationStatus || 'PENDING',
    encryption: {
      encryptedAtRest: Boolean(options.encryptedAtRest),
      mechanism: options.encryptionMechanism || 'Volume/Storage Provider Level (LUKS/Encrypted EBS/S3 SSE)',
      note: 'Backup file itself is unencrypted custom-format stream; encryption at rest depends on underlying storage volume or offsite bucket encryption.',
    },
    disasterRecovery: {
      isOffsiteCopy: Boolean(options.isOffsiteCopy),
      storageTier: options.isOffsiteCopy ? 'Offsite Object Storage (Cold Tier)' : 'Local Host Volume',
    },
    credentialsStored: false,
  };
}

/**
 * Calculates backup retention pruning plan without deleting files outside designated backup directory.
 */
export function calculateRetentionPruning(
  files: Array<{ name: string; mtimeMs: number }>,
  retentionDays: number,
  nowMs = Date.now()
): RetentionPruningPlan {
  if (retentionDays < 1) {
    throw new Error('Retention days must be at least 1.');
  }

  const cutoffMs = nowMs - retentionDays * 24 * 60 * 60 * 1000;
  const toDelete: string[] = [];
  const toKeep: string[] = [];
  let protectedCount = 0;

  for (const file of files) {
    // Only manage files matching our backup naming prefix and extensions
    const isBackupArtifact = /^aageonline_backup_.*\.(?:dump|sha256|manifest\.json)$/i.test(file.name);

    if (!isBackupArtifact) {
      // Non-backup files are strictly protected from retention pruning
      toKeep.push(file.name);
      protectedCount++;
      continue;
    }

    if (file.mtimeMs < cutoffMs) {
      toDelete.push(file.name);
    } else {
      toKeep.push(file.name);
    }
  }

  return {
    toDelete,
    toKeep,
    protectedCount,
  };
}

/**
 * Validates that an expected checksum matches an actual checksum.
 */
export function verifyChecksum(actualChecksum: string, expectedChecksum: string): boolean {
  if (!actualChecksum || !expectedChecksum) return false;
  return actualChecksum.trim().toLowerCase() === expectedChecksum.trim().toLowerCase();
}

/**
 * Asserts that a required PostgreSQL utility exists; throws a clear operational error if missing.
 */
export function assertPostgresUtilityAvailable(
  utilityName: string,
  checkBinaryFn: (name: string) => boolean
): void {
  const exists = checkBinaryFn(utilityName);
  if (!exists) {
    throw new Error(
      `OPERATIONAL PREREQUISITE MISSING: PostgreSQL utility "${utilityName}" is required but not installed or not found on PATH.`
    );
  }
}

export interface ManifestValidationResult {
  isValid: boolean;
  manifest?: BackupManifest;
  error?: string;
}

/**
 * Validates a backup manifest artifact, rejecting corrupt JSON, missing fields, failed status, or stored credentials.
 */
export function validateBackupManifest(
  rawContent: string | Record<string, unknown>
): ManifestValidationResult {
  if (!rawContent) {
    return { isValid: false, error: 'Manifest content is empty or null.' };
  }

  let parsed: Record<string, unknown>;
  if (typeof rawContent === 'string') {
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return { isValid: false, error: 'Manifest is corrupted: invalid JSON syntax.' };
    }
  } else {
    parsed = rawContent;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { isValid: false, error: 'Manifest must be a JSON object.' };
  }

  const requiredFields = [
    'manifestVersion',
    'backupTimestamp',
    'databaseName',
    'fileName',
    'fileSizeBytes',
    'checksumSha256',
    'verificationStatus',
  ];

  for (const field of requiredFields) {
    if (parsed[field] === undefined || parsed[field] === null || parsed[field] === '') {
      return { isValid: false, error: `Manifest corrupted: missing required field "${field}".` };
    }
  }

  // Checksum format validation (64 hex characters)
  const checksum = String(parsed.checksumSha256);
  if (!/^[a-fA-F0-9]{64}$/.test(checksum)) {
    return { isValid: false, error: 'Manifest corrupted: invalid SHA-256 checksum format.' };
  }

  // File size validation
  const size = Number(parsed.fileSizeBytes);
  if (isNaN(size) || size <= 0) {
    return { isValid: false, error: 'Manifest corrupted: fileSizeBytes must be a positive number.' };
  }

  // Verification status check
  const status = String(parsed.verificationStatus);
  if (status === 'FAILED') {
    return { isValid: false, error: 'Backup marked as FAILED in manifest: partial or corrupt artifact.' };
  }

  if (status !== 'PENDING' && status !== 'VERIFIED') {
    return { isValid: false, error: `Manifest corrupted: unrecognized verificationStatus "${status}".` };
  }

  // Credentials security check: must strictly never store credentials
  if (parsed.credentialsStored !== false) {
    return { isValid: false, error: 'Security violation: manifest must declare credentialsStored=false.' };
  }

  return {
    isValid: true,
    manifest: parsed as unknown as BackupManifest,
  };
}

/**
 * Checks whether a proposed backup destination file already exists, preventing accidental overwrite.
 */
export function checkBackupFileOverwrite(
  targetFilePath: string,
  fileExistsFn: (filePath: string) => boolean
): { canWrite: boolean; error?: string } {
  if (fileExistsFn(targetFilePath)) {
    return {
      canWrite: false,
      error: `Destination backup file already exists: "${targetFilePath}". Aborting to prevent overwrite.`,
    };
  }
  return { canWrite: true };
}

/**
 * Formats a database restore error string, strictly redacting passwords or connection secrets.
 */
export function formatSafeRestoreError(err: unknown): string {
  if (!err) return 'Database restore operation failed with unknown error.';
  const rawMsg = err instanceof Error ? err.message : String(err);
  return redactConnectionString(rawMsg);
}

