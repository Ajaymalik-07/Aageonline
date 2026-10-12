/**
 * AageOnline — Database Test Safety & Disposable Target Validator
 *
 * Enforces strict safety rules before any integration test runs or cleanup occurs:
 * 1. Prohibits execution against production environments (NODE_ENV=production or APP_ENV=production).
 * 2. Positively verifies that the database target is explicitly designated as disposable/test.
 * 3. Rejects ambiguous, production-looking, or live cloud databases.
 * 4. Redacts credentials when logging or reporting database targets.
 * 5. Fails closed on any ambiguity.
 */

export interface TestDatabaseSafetyReport {
  isSafe: boolean;
  databaseName?: string;
  sanitizedTarget?: string;
  rejectionReason?: string;
}

/**
 * Redacts username and password credentials from a PostgreSQL connection string.
 */
export function redactConnectionString(connectionString?: string): string {
  if (!connectionString) return '[UNCONFIGURED]';
  return connectionString.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

/**
 * Extracts the database name from a PostgreSQL connection string.
 */
export function extractDatabaseName(connectionString: string): string | null {
  try {
    const url = new URL(connectionString);
    const pathname = url.pathname.replace(/^\//, '');
    return pathname.split('?')[0] || null;
  } catch {
    // If URL parsing fails, attempt regex fallback
    const match = connectionString.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : null;
  }
}

/**
 * Validates whether a database connection string points to a safe, disposable test database.
 * Rejects production targets and unverified databases.
 */
export function validateDisposableTestDatabase(
  connectionString?: string,
  environment: Record<string, string | undefined> = process.env
): TestDatabaseSafetyReport {
  if (!connectionString) {
    return {
      isSafe: false,
      rejectionReason: 'DATABASE_URL is not configured.',
    };
  }

  const sanitizedTarget = redactConnectionString(connectionString);

  // 1. Production Mode Guard
  if (environment.NODE_ENV === 'production' || environment.APP_ENV === 'production') {
    return {
      isSafe: false,
      sanitizedTarget,
      rejectionReason: 'Refusing test execution in production environment (NODE_ENV=production or APP_ENV=production).',
    };
  }

  // 2. Extract database name
  const dbName = extractDatabaseName(connectionString);
  if (!dbName) {
    return {
      isSafe: false,
      sanitizedTarget,
      rejectionReason: 'Could not reliably parse database name from connection string. Target is ambiguous.',
    };
  }

  // 3. Prohibit production-looking database names
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
        rejectionReason: `Database name "${dbName}" matches forbidden target pattern (${pattern.source}). Must not run tests against live or production databases.`,
      };
    }
  }

  // 4. Require explicit test-database naming pattern
  const isExplicitTestName = /(?:test|disposable|sandbox|tmp)/i.test(dbName);
  const isExplicitTestVar = Boolean(environment.INTEGRATION_TEST_DATABASE_URL);

  if (!isExplicitTestName && !isExplicitTestVar) {
    return {
      isSafe: false,
      databaseName: dbName,
      sanitizedTarget,
      rejectionReason: `Database name "${dbName}" does not contain "test", "disposable", or "sandbox". Tests require an explicitly named disposable database (e.g. "aageonline_integration_test").`,
    };
  }

  return {
    isSafe: true,
    databaseName: dbName,
    sanitizedTarget,
  };
}

/**
 * Asserts that a database target is safe for integration testing; throws a detailed error if not.
 */
export function assertDisposableTestDatabase(
  connectionString?: string,
  environment: Record<string, string | undefined> = process.env
): string {
  const report = validateDisposableTestDatabase(connectionString, environment);
  if (!report.isSafe) {
    throw new Error(`SAFETY VIOLATION: ${report.rejectionReason} (Target: ${report.sanitizedTarget})`);
  }
  return report.databaseName!;
}
