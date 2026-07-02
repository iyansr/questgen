import { sql } from 'drizzle-orm';
import { createDb } from '@questgen/db';
import { beforeEach } from 'vitest';

beforeEach(async () => {
  const db = createDb();
  await db.execute(
    sql`TRUNCATE questions, question_sets, documents, users CASCADE`,
  );
});
