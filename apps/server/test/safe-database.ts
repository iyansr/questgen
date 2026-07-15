/** Local-only DB used by blackbox tests. Never point this at prod. */
export const TEST_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:5432/questgen_test';

function redactDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return '(unparseable DATABASE_URL)';
  }
}

/**
 * Abort before any destructive SQL if Worker env was overridden by
 * apps/server/.env (Wrangler loads .env as secrets and overrides vars).
 */
export function assertSafeTestDatabaseUrl(url: string | undefined): void {
  if (url === TEST_DATABASE_URL) return;

  throw new Error(
    [
      'Refusing destructive test SQL: DATABASE_URL is not local questgen_test.',
      `Expected: ${TEST_DATABASE_URL}`,
      `Got: ${url ? redactDatabaseUrl(url) : '(undefined)'}`,
      'Fix: do not load apps/server/.env into vitest; use wrangler.test.jsonc + .dev.vars.test.',
    ].join('\n'),
  );
}
