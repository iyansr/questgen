import { env } from '@questgen/env/server';
import { Hono } from 'hono';

const files = new Hono();

files.get('/*', async (c) => {
  const key = c.req.path.replace(/^\/files\//, '');

  if (!key.startsWith('documents/') || !key.includes('/images/')) {
    return c.json({ error: 'Not found' }, 404);
  }

  const object = await env.DOCUMENTS_BUCKET.get(key);
  if (!object) {
    return c.json({ error: 'File not found' }, 404);
  }

  const contentType =
    object.httpMetadata?.contentType ?? 'application/octet-stream';

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(object.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

export { files };
