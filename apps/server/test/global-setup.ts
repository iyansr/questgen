import pg from 'pg';

import { assertSafeTestDatabaseUrl, TEST_DATABASE_URL } from './safe-database';

export default async function globalSetup() {
  assertSafeTestDatabaseUrl(TEST_DATABASE_URL);
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  await client.query(
    'TRUNCATE questions, question_sets, documents, users CASCADE',
  );
  await client.end();
}
