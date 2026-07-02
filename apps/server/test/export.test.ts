import { describe, expect, it } from 'vitest';

import { uniqueEmail } from './helpers/email';
import { seedCompletedSession, seedEmptyCompletedSession } from './helpers/fixtures';
import { api, readJson } from './helpers/http';

const exportPayload = {
  subject: 'Matematika',
  schoolName: 'SMA Negeri 1',
  classLabel: 'X IPA 1',
  semester: 'Semester Ganjil',
};

describe('POST /api/sessions/:id/export/pdf', () => {
  it('returns application/pdf for a completed session with questions', async () => {
    const { token, sessionId } = await seedCompletedSession(
      uniqueEmail('export-pdf'),
    );

    const res = await api(`/api/sessions/${sessionId}/export/pdf`, {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportPayload),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const bytes = await res.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(100);
    expect(res.headers.get('Content-Disposition')).toContain('soal-');
  });

  it('returns 400 when session has no questions', async () => {
    const { token, sessionId } = await seedEmptyCompletedSession(
      uniqueEmail('export-empty'),
    );

    const res = await api(`/api/sessions/${sessionId}/export/pdf`, {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportPayload),
    });

    expect(res.status).toBe(400);
    const err = await readJson<{ error: string }>(res);
    expect(err.error).toContain('soal');
  });

  it('returns 400 when subject is missing', async () => {
    const { token, sessionId } = await seedCompletedSession(
      uniqueEmail('export-no-subject'),
    );

    const res = await api(`/api/sessions/${sessionId}/export/pdf`, {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolName: 'SMA 1' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 404 for another user session', async () => {
    const { token } = await seedCompletedSession(uniqueEmail('export-owner'));
    const other = await seedCompletedSession(uniqueEmail('export-other'));

    const res = await api(`/api/sessions/${other.sessionId}/export/pdf`, {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportPayload),
    });

    expect(res.status).toBe(404);
    void token;
  });
});

describe('POST /api/sessions/:id/export/docx', () => {
  it('returns Word document bytes', async () => {
    const { token, sessionId } = await seedCompletedSession(
      uniqueEmail('export-docx'),
    );

    const res = await api(`/api/sessions/${sessionId}/export/docx`, {
      method: 'POST',
      token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exportPayload),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    const bytes = await res.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(100);
  });
});
