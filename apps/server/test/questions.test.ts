import { createDb } from '@questgen/db';
import { questions } from '@questgen/db/schema';
import { describe, expect, it } from 'vitest';

import { registerAndGetToken } from './helpers/auth';
import { uniqueEmail } from './helpers/email';
import { seedCompletedSession } from './helpers/fixtures';
import { api, readJson } from './helpers/http';

const DEFAULT_OPTIONS = [
  { label: 'A', text: '3' },
  { label: 'B', text: '4' },
  { label: 'C', text: '5' },
  { label: 'D', text: '6' },
];

describe('DELETE /api/sessions/:id/questions/:questionId', () => {
  it('deletes a question and compacts order', async () => {
    const { token, sessionId, questionId } = await seedCompletedSession(
      uniqueEmail('delete-ok'),
    );
    const db = createDb();

    const [second] = await db
      .insert(questions)
      .values({
        setId: sessionId,
        questionText: 'Soal kedua',
        questionType: 'multiple_choice',
        correctAnswer: 'A',
        options: DEFAULT_OPTIONS,
        order: 1,
      })
      .returning({ id: questions.id });

    const deleteRes = await api(
      `/api/sessions/${sessionId}/questions/${questionId}`,
      { method: 'DELETE', token },
    );
    expect(deleteRes.status).toBe(200);
    const deleteBody = await readJson<{ deleted: number }>(deleteRes);
    expect(deleteBody.deleted).toBe(1);

    const getRes = await api(`/api/sessions/${sessionId}`, { token });
    const session = await readJson<{
      questions: Array<{ id: string; questionText: string; order: number }>;
    }>(getRes);
    expect(session.questions).toHaveLength(1);
    expect(session.questions[0]?.id).toBe(second?.id);
    expect(session.questions[0]?.questionText).toBe('Soal kedua');
    expect(session.questions[0]?.order).toBe(0);
  });

  it('returns 404 for unknown question id', async () => {
    const { token, sessionId } = await seedCompletedSession(
      uniqueEmail('delete-unknown-q'),
    );

    const res = await api(
      `/api/sessions/${sessionId}/questions/00000000-0000-4000-8000-000000000099`,
      { method: 'DELETE', token },
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 for another user session', async () => {
    const owner = await seedCompletedSession(uniqueEmail('delete-owner'));
    const tokenB = await registerAndGetToken(uniqueEmail('delete-other'));

    const res = await api(
      `/api/sessions/${owner.sessionId}/questions/${owner.questionId}`,
      { method: 'DELETE', token: tokenB },
    );

    expect(res.status).toBe(404);
  });
});

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
