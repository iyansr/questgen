import { env } from '@questgen/env/server';

export function isBetaMode(): boolean {
  return env.BETA_MODE === 'true';
}
