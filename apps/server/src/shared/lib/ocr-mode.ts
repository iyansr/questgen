import { env } from '@questgen/env/server';

const DEFAULT_R2_BUCKET_NAME = 'questgen';

export function isLocalOcrMode(): boolean {
  const base = env.SERVER_URL;
  if (!base) return true;
  try {
    const host = new URL(base).hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return true;
  }
}

export function canUseR2PresignedOcr(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY,
  );
}

export function getR2BucketName(): string {
  return env.R2_BUCKET_NAME ?? DEFAULT_R2_BUCKET_NAME;
}
