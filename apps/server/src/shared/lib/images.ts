import { env } from '@questgen/env/server';

export function buildImagePublicUrl(key: string): string {
  const base = env.R2_PUBLIC_HOST ?? env.SERVER_URL;
  if (!base) {
    throw new Error(
      'Missing R2_PUBLIC_HOST or SERVER_URL — cannot build image URL',
    );
  }

  const trimmed = base.replace(/\/+$/, '');
  if (env.R2_PUBLIC_HOST) {
    return `${trimmed}/${key}`;
  }
  return `${trimmed}/files/${key}`;
}
