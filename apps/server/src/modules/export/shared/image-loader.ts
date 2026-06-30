import { env } from '@questgen/env/server';

export function extractR2KeyFromUrl(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    let pathname = u.pathname.replace(/^\/+/, '');
    if (pathname.startsWith('files/')) {
      pathname = pathname.slice('files/'.length);
    }
    return pathname || null;
  } catch {
    return null;
  }
}

export type LoadedImage = {
  bytes: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
};

export async function loadQuestionImage(
  imageUrl: string | null,
): Promise<LoadedImage | null> {
  if (!imageUrl) return null;

  const key = extractR2KeyFromUrl(imageUrl);
  if (!key) return null;

  const object = await env.DOCUMENTS_BUCKET.get(key);
  if (!object) return null;

  const contentType =
    object.httpMetadata?.contentType ?? 'application/octet-stream';
  if (contentType !== 'image/png' && contentType !== 'image/jpeg') {
    return null;
  }

  const bytes = new Uint8Array(await object.arrayBuffer());
  return {
    bytes,
    mimeType: contentType,
  };
}
