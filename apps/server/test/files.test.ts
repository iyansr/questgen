import { describe, expect, it } from 'vitest';

import { registerAndGetToken } from './helpers/auth';
import { uniqueEmail } from './helpers/email';
import { getUserId, putR2Image } from './helpers/fixtures';
import { api } from './helpers/http';
import { env } from 'cloudflare:workers';

describe('GET /files/*', () => {
  it('returns image bytes for a valid documents/.../images/ key', async () => {
    const token = await registerAndGetToken(uniqueEmail('files-ok'));
    const userId = await getUserId(token);
    const key = `documents/${userId}/images/test-image.png`;
    const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    await putR2Image(key, pngHeader);

    const res = await api(`/files/${key}`);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    const body = new Uint8Array(await res.arrayBuffer());
    expect(body[0]).toBe(137);
  });

  it('returns 404 for keys outside documents/.../images/', async () => {
    const token = await registerAndGetToken(uniqueEmail('files-bad-prefix'));
    const userId = await getUserId(token);
    const key = `${userId}/not-an-image.pdf`;
    await env.DOCUMENTS_BUCKET.put(key, 'data');

    const res = await api(`/files/${key}`);
    expect(res.status).toBe(404);
    void token;
  });

  it('returns 404 when object does not exist', async () => {
    const res = await api('/files/documents/nobody/images/missing.png');
    expect(res.status).toBe(404);
  });
});
