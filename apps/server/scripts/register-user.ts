/**
 * Register a user while BETA_MODE blocks POST /api/auth/register.
 * Writes directly to Postgres — same validation + hashing as the API route.
 *
 * Usage:
 *   pnpm --filter server register-user
 */

import { dirname, resolve } from 'node:path';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { users } from '@questgen/db/schema';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { registerSchema } from '../src/modules/auth/auth.schema.js';
import { hashPassword } from '../src/shared/lib/auth.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(scriptDir, '../.env') });

async function prompt(label: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(label);
    return answer.trim();
  } finally {
    rl.close();
  }
}

async function promptPassword(label: string): Promise<string> {
  stdout.write(label);

  if (!stdin.isTTY || !stdin.setRawMode) {
    const rl = createInterface({ input: stdin, output: stdout });
    try {
      return (await rl.question('')).trim();
    } finally {
      rl.close();
    }
  }

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  let value = '';
  return new Promise((resolve, reject) => {
    const onData = (chunk: string) => {
      const ch = chunk[0] ?? '';

      if (ch === '\u0003') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        reject(new Error('Cancelled'));
        return;
      }

      if (ch === '\r' || ch === '\n' || ch === '\u0004') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        stdout.write('\n');
        resolve(value);
        return;
      }

      if (ch === '\u007f' || ch === '\b') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }

      value += ch;
      stdout.write('*');
    };

    stdin.on('data', onData);
  });
}

async function promptRegisterFields() {
  stdout.write('Register user (bypasses BETA_MODE). Ctrl+C to cancel.\n\n');

  while (true) {
    const email = await prompt('Email: ');
    const name = await prompt('Name: ');
    const password = await promptPassword('Password: ');
    const confirmPassword = await promptPassword('Confirm password: ');

    if (password !== confirmPassword) {
      stdout.write('Passwords do not match. Try again.\n\n');
      continue;
    }

    const parsed = registerSchema.safeParse({ email, password, name });
    if (!parsed.success) {
      stdout.write(
        `${parsed.error.issues.map((i) => i.message).join('\n')}\n\n`,
      );
      continue;
    }

    const confirm = await prompt(
      `Create user ${parsed.data.email} (${parsed.data.name})? [y/N] `,
    );
    if (confirm.toLowerCase() === 'y') {
      return parsed.data;
    }

    stdout.write('Cancelled.\n');
    process.exit(0);
  }
}

async function main() {
  const { email, password, name } = await promptRegisterFields();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set (check apps/server/.env)');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool });

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.error(`Email already registered: ${email}`);
      process.exit(1);
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash, name })
      .returning({ id: users.id, email: users.email, name: users.name });

    if (!user) {
      console.error('Failed to create user');
      process.exit(1);
    }

    console.log('\nUser registered:');
    console.log(JSON.stringify(user, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  if (err instanceof Error && err.message === 'Cancelled') {
    stdout.write('\nCancelled.\n');
    process.exit(130);
  }
  console.error(err);
  process.exit(1);
});
