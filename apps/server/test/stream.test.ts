import { describe, expect, it } from 'vitest';

import { uniqueEmail } from './helpers/email';
import { seedCompletedSession } from './helpers/fixtures';
import { api } from './helpers/http';

describe('POST /api/sessions/:id/stream', () => {
  it('returns 404 for unknown session', async () => {
    const { token } = await seedCompletedSession(uniqueEmail('stream-missing'));

    const res = await api(
      '/api/sessions/00000000-0000-4000-8000-000000000099/stream',
      { method: 'POST', token },
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 for another user session', async () => {
    const owner = await seedCompletedSession(uniqueEmail('stream-owner'));
    const other = await seedCompletedSession(uniqueEmail('stream-other'));

    const res = await api(`/api/sessions/${owner.sessionId}/stream`, {
      method: 'POST',
      token: other.token,
    });

    expect(res.status).toBe(404);
  });

  it('returns a streaming response for a completed session', async () => {
    const { token, sessionId } = await seedCompletedSession(
      uniqueEmail('stream-ok'),
    );

    const res = await api(`/api/sessions/${sessionId}/stream`, {
      method: 'POST',
      token,
    });

    expect(res.status).toBe(200);
    const contentType = res.headers.get('Content-Type') ?? '';
    expect(contentType.length).toBeGreaterThan(0);

    const body = await res.text();
    expect(body.length).toBeGreaterThan(0);
  });
});
