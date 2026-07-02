import { describe, expect, it } from 'vitest';

import { loginUser, registerAndGetToken, registerUser } from './helpers/auth';
import { api, readJson } from './helpers/http';

describe('POST /api/auth/register', () => {
  it('returns 201 with token and user', async () => {
    const { res, body } = await registerUser('teacher@example.com');

    expect(res.status).toBe(201);
    expect(body.token).toEqual(expect.any(String));
    expect(body.user).toMatchObject({
      email: 'teacher@example.com',
      name: 'Test User',
    });
    expect(body.user.id).toEqual(expect.any(String));
  });

  it('returns 400 for duplicate email without revealing enumeration', async () => {
    await registerUser('dup@example.com');
    const { res, body } = await registerUser('dup@example.com');

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ error: 'Registration failed' });
  });

  it('returns 400 for invalid email', async () => {
    const res = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'password123',
        name: 'Test',
      }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'short@example.com',
        password: 'short',
        name: 'Test',
      }),
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with token for valid credentials', async () => {
    await registerUser('login@example.com');
    const { res, body } = await loginUser('login@example.com');

    expect(res.status).toBe(200);
    expect(body.token).toEqual(expect.any(String));
    expect(body.user.email).toBe('login@example.com');
  });

  it('returns 401 for wrong password', async () => {
    await registerUser('wrong-pass@example.com');
    const { res, body } = await loginUser(
      'wrong-pass@example.com',
      'bad-password',
    );

    expect(res.status).toBe(401);
    expect(body).toMatchObject({ error: 'Invalid email or password' });
  });

  it('returns 401 for unknown email', async () => {
    const { res, body } = await loginUser('missing@example.com');

    expect(res.status).toBe(401);
    expect(body).toMatchObject({ error: 'Invalid email or password' });
  });
});

describe('GET /api/auth/me', () => {
  it('returns 200 with user when authorized', async () => {
    const token = await registerAndGetToken('me@example.com');
    const res = await api('/api/auth/me', { token });
    const body = await readJson<{ user: { email: string } }>(res);

    expect(res.status).toBe(200);
    expect(body.user.email).toBe('me@example.com');
  });

  it('returns 401 without Authorization header', async () => {
    const res = await api('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid token', async () => {
    const res = await api('/api/auth/me', { token: 'not-a-valid-token' });
    expect(res.status).toBe(401);
  });
});

describe('auth token access', () => {
  it('allows access to protected routes with a valid token', async () => {
    const token = await registerAndGetToken('protected@example.com');
    const res = await api('/api/sessions', { token });
    const body = await readJson<{ items: unknown[]; total: number }>(res);

    expect(res.status).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });
});
