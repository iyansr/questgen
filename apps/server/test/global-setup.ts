import pg from 'pg';

const TEST_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:5432/questgen_test';

export default async function globalSetup() {
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  await client.query(
    'TRUNCATE questions, question_sets, documents, users CASCADE',
  );
  await client.end();
}
