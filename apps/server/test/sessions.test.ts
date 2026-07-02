import { describe, expect, it } from 'vitest';

import { uniqueEmail } from './helpers/email';
import { seedCompletedSession } from './helpers/fixtures';
import { api, readJson } from './helpers/http';

describe('GET /api/sessions', () => {
  it('lists seeded sessions for the authenticated user', async () => {
    const first = await seedCompletedSession(uniqueEmail('list-a'), {
      title: 'Geometri',
    });
    await seedCompletedSession(uniqueEmail('list-b'), { title: 'Aljabar' });

    const res = await api('/api/sessions', { token: first.token });
    const body = await readJson<{
      items: Array<{ title: string }>;
      total: number;
    }>(res);

    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.title).toBe('Geometri');
  });

  it('filters by status', async () => {
    const { token, sessionId } = await seedCompletedSession(
      uniqueEmail('filter-status'),
    );

    const res = await api('/api/sessions?status=completed', { token });
    const body = await readJson<{ items: Array<{ id: string }> }>(res);

    expect(res.status).toBe(200);
    expect(body.items.some((s) => s.id === sessionId)).toBe(true);
  });

  it('searches by title', async () => {
    const { token } = await seedCompletedSession(uniqueEmail('search-hit'), {
      title: 'Trigonometri Lanjut',
    });
    await seedCompletedSession(uniqueEmail('search-miss'), {
      title: 'Biologi Sel',
    });

    const res = await api('/api/sessions?search=Trigonometri', { token });
    const body = await readJson<{ items: Array<{ title: string }>; total: number }>(
      res,
    );

    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.items[0]?.title).toContain('Trigonometri');
  });
});

describe('GET /api/sessions/:id', () => {
  it('returns session with questions', async () => {
    const { token, sessionId, questionId } = await seedCompletedSession(
      uniqueEmail('get-session'),
    );

    const res = await api(`/api/sessions/${sessionId}`, { token });
    const body = await readJson<{
      id: string;
      status: string;
      questions: Array<{ id: string }>;
    }>(res);

    expect(res.status).toBe(200);
    expect(body.id).toBe(sessionId);
    expect(body.status).toBe('completed');
    expect(body.questions).toHaveLength(1);
    expect(body.questions[0]?.id).toBe(questionId);
  });

  it('returns 404 for unknown session id', async () => {
    const { token } = await seedCompletedSession(uniqueEmail('get-missing'));

    const res = await api(
      '/api/sessions/00000000-0000-4000-8000-000000000099',
      { token },
    );

    expect(res.status).toBe(404);
  });
});
