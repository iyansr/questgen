import { describe, expect, it } from 'vitest';

import { registerAndGetToken } from './helpers/auth';
import { uniqueEmail } from './helpers/email';
import {
  documentSessionForm,
  fileSessionForm,
  webSessionForm,
} from './helpers/sessions-form';
import {
  seedProcessingDocument,
  seedReadyDocument,
} from './helpers/fixtures';
import { api, readJson } from './helpers/http';

describe('POST /api/sessions', () => {
  it('returns 201 for valid web search form', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-web'));

    const res = await api('/api/sessions', {
      method: 'POST',
      token,
      body: webSessionForm(),
    });

    expect(res.status).toBe(201);
    const body = await readJson<{ id: string }>(res);
    expect(body.id).toEqual(expect.any(String));
  });

  it('returns 400 when no source is provided', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-no-source'));
    const fd = webSessionForm();
    fd.delete('webQuery');

    const res = await api('/api/sessions', { method: 'POST', token, body: fd });
    expect(res.status).toBe(400);
  });

  it('returns 400 when multiple sources are provided', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-multi'));
    const fd = webSessionForm();
    fd.set('documentId', '00000000-0000-4000-8000-000000000001');

    const res = await api('/api/sessions', { method: 'POST', token, body: fd });
    expect(res.status).toBe(400);
  });

  it('returns 400 when web search is missing curriculum', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-no-curriculum'));
    const fd = webSessionForm({ curriculum: undefined });

    const res = await api('/api/sessions', { method: 'POST', token, body: fd });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid questionTypeCounts JSON', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-bad-json'));

    const res = await api('/api/sessions', {
      method: 'POST',
      token,
      body: webSessionForm({ questionTypeCounts: 'not-json' }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 when all question counts are zero', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-zero-counts'));

    const res = await api('/api/sessions', {
      method: 'POST',
      token,
      body: webSessionForm({
        questionTypeCounts: JSON.stringify([
          { type: 'multiple_choice', count: 0 },
        ]),
      }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for duplicate question types in counts', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-dup-types'));

    const res = await api('/api/sessions', {
      method: 'POST',
      token,
      body: webSessionForm({
        questionTypeCounts: JSON.stringify([
          { type: 'multiple_choice', count: 1 },
          { type: 'multiple_choice', count: 2 },
        ]),
      }),
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for unsupported file MIME type', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-bad-mime'));
    const file = new File(['plain text'], 'notes.txt', { type: 'text/plain' });

    const res = await api('/api/sessions', {
      method: 'POST',
      token,
      body: fileSessionForm(file),
    });

    expect(res.status).toBe(400);
  });

  it('returns 404 when documentId is not ready', async () => {
    const token = await registerAndGetToken(uniqueEmail('create-bad-doc'));
    const fd = documentSessionForm('00000000-0000-4000-8000-000000000099');

    const res = await api('/api/sessions', { method: 'POST', token, body: fd });
    expect(res.status).toBe(404);
  });

  it('returns 201 when creating from a ready document', async () => {
    const { token, documentId } = await seedReadyDocument(
      uniqueEmail('create-from-doc'),
    );

    const res = await api('/api/sessions', {
      method: 'POST',
      token,
      body: documentSessionForm(documentId),
    });

    expect(res.status).toBe(201);
  });

  it('returns 404 when document is still processing', async () => {
    const { token, documentId } = await seedProcessingDocument(
      uniqueEmail('create-processing-doc'),
    );

    const res = await api('/api/sessions', {
      method: 'POST',
      token,
      body: documentSessionForm(documentId),
    });

    expect(res.status).toBe(404);
  });
});
