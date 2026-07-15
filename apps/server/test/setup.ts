import { createDb } from '@questgen/db';
import { sql } from 'drizzle-orm';
import { beforeEach } from 'vitest';

import { assertSafeTestDatabaseUrl } from './safe-database';
import { env } from 'cloudflare:workers';

beforeEach(async () => {
  assertSafeTestDatabaseUrl(env.DATABASE_URL);
  const db = createDb();
  await db.execute(
    sql`TRUNCATE questions, question_sets, documents, users CASCADE`,
  );
});
