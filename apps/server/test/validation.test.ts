import { describe, expect, it } from 'vitest';

import { registerAndGetToken } from './helpers/auth';
import { api } from './helpers/http';

describe('protected route authorization', () => {
  it('returns 401 for GET /api/sessions without token', async () => {
    const res = await api('/api/sessions');
    expect(res.status).toBe(401);
  });

  it('returns 401 for GET /api/documents without token', async () => {
    const res = await api('/api/documents');
    expect(res.status).toBe(401);
  });

  it('returns 401 for POST /api/sessions/:id/export/pdf without token', async () => {
    const res = await api('/api/sessions/00000000-0000-4000-8000-000000000001/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Matematika',
      }),
    });

    expect(res.status).toBe(401);
  });
});

describe('resource ownership', () => {
  it('returns 404 when accessing another user session', async () => {
    await registerAndGetToken('user-a@example.com');
    const tokenB = await registerAndGetToken('user-b@example.com');

    const res = await api(
      '/api/sessions/00000000-0000-4000-8000-000000000099',
      { token: tokenB },
    );

    expect(res.status).toBe(404);
  });
});

describe('GET /api/sessions query validation', () => {
  it('returns 400 for invalid page', async () => {
    const token = await registerAndGetToken('pagination@example.com');
    const res = await api('/api/sessions?page=0', { token });
    expect(res.status).toBe(400);
  });

  it('returns 400 for limit above maximum', async () => {
    const token = await registerAndGetToken('limit@example.com');
    const res = await api('/api/sessions?limit=200', { token });
    expect(res.status).toBe(400);
  });
});
