import { describe, expect, it } from 'vitest';

import { registerAndGetToken } from './helpers/auth';
import { uniqueEmail } from './helpers/email';
import { seedCompletedSession } from './helpers/fixtures';
import { api, readJson } from './helpers/http';

describe('PATCH /api/sessions/:id/questions', () => {
  it('updates question text via multipart form', async () => {
    const { token, sessionId, questionId } = await seedCompletedSession(
      uniqueEmail('patch-ok'),
    );

    const fd = new FormData();
    fd.set(
      'updates',
      JSON.stringify([
        {
          id: questionId,
          questionText: 'Berapakah 3 + 3?',
          options: [
            { label: 'A', text: '5' },
            { label: 'B', text: '6' },
            { label: 'C', text: '7' },
            { label: 'D', text: '8' },
          ],
          correctAnswer: 'B',
          suggestedAnswer: null,
        },
      ]),
    );

    const patchRes = await api(`/api/sessions/${sessionId}/questions`, {
      method: 'PATCH',
      token,
      body: fd,
    });

    expect(patchRes.status).toBe(200);
    const patchBody = await readJson<{ updated: number }>(patchRes);
    expect(patchBody.updated).toBe(1);

    const getRes = await api(`/api/sessions/${sessionId}`, { token });
    const session = await readJson<{
      questions: Array<{ questionText: string }>;
    }>(getRes);
    expect(session.questions[0]?.questionText).toBe('Berapakah 3 + 3?');
  });

  it('returns 400 when correctAnswer is not in options', async () => {
    const { token, sessionId, questionId } = await seedCompletedSession(
      uniqueEmail('patch-bad-answer'),
    );

    const fd = new FormData();
    fd.set(
      'updates',
      JSON.stringify([
        {
          id: questionId,
          questionText: 'Soal',
          options: [
            { label: 'A', text: '1' },
            { label: 'B', text: '2' },
          ],
          correctAnswer: 'Z',
          suggestedAnswer: null,
        },
      ]),
    );

    const res = await api(`/api/sessions/${sessionId}/questions`, {
      method: 'PATCH',
      token,
      body: fd,
    });

    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown question id', async () => {
    const { token, sessionId } = await seedCompletedSession(
      uniqueEmail('patch-unknown-q'),
    );

    const fd = new FormData();
    fd.set(
      'updates',
      JSON.stringify([
        {
          id: '00000000-0000-4000-8000-000000000099',
          questionText: 'Soal',
          options: null,
          correctAnswer: 'A',
          suggestedAnswer: null,
        },
      ]),
    );

    const res = await api(`/api/sessions/${sessionId}/questions`, {
      method: 'PATCH',
      token,
      body: fd,
    });

    expect(res.status).toBe(404);
  });

  it('returns 404 for another user session', async () => {
    const owner = await seedCompletedSession(uniqueEmail('patch-owner'));
    const tokenB = await registerAndGetToken(uniqueEmail('patch-other'));

    const fd = new FormData();
    fd.set(
      'updates',
      JSON.stringify([
        {
          id: owner.questionId,
          questionText: 'Hack',
          options: null,
          correctAnswer: 'A',
          suggestedAnswer: null,
        },
      ]),
    );

    const res = await api(`/api/sessions/${owner.sessionId}/questions`, {
      method: 'PATCH',
      token: tokenB,
      body: fd,
    });

    expect(res.status).toBe(404);
  });
});
