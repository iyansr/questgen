import { describe, expect, it } from 'vitest';

import { uniqueEmail } from './helpers/email';
import {
  seedDocumentMissingR2,
  seedProcessingDocument,
  seedReadyDocument,
} from './helpers/fixtures';
import { api, readJson } from './helpers/http';

describe('GET /api/documents', () => {
  it('returns only ready documents', async () => {
    const ready = await seedReadyDocument(uniqueEmail('docs-ready'));
    await seedProcessingDocument(uniqueEmail('docs-processing'));

    const res = await api('/api/documents', { token: ready.token });
    const body = await readJson<{
      items: Array<{ id: string; filename: string }>;
    }>(res);

    expect(res.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.filename).toBe('test-doc.pdf');
  });

  it('returns empty list when user has no ready documents', async () => {
    const { token } = await seedProcessingDocument(uniqueEmail('docs-empty'));

    const res = await api('/api/documents', { token });
    const body = await readJson<{ items: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.items).toEqual([]);
  });
});

describe('GET /api/documents/:id/preview', () => {
  it('streams the document from R2', async () => {
    const content = '%PDF-1.4 blackbox preview test';
    const { token, documentId } = await seedReadyDocument(
      uniqueEmail('preview-ok'),
      content,
    );

    const res = await api(`/api/documents/${documentId}/preview`, { token });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(await res.text()).toBe(content);
  });

  it('returns 404 when object is missing from R2', async () => {
    const { token, documentId } = await seedDocumentMissingR2(
      uniqueEmail('preview-no-r2'),
    );

    const res = await api(`/api/documents/${documentId}/preview`, { token });
    expect(res.status).toBe(404);
  });

  it('returns 404 for another user document', async () => {
    const owner = await seedReadyDocument(uniqueEmail('preview-owner'));
    const other = await seedReadyDocument(uniqueEmail('preview-other'));

    const res = await api(`/api/documents/${owner.documentId}/preview`, {
      token: other.token,
    });

    expect(res.status).toBe(404);
  });
});
