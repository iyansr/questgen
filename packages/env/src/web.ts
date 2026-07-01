import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

const booleanFromString = z
  .union([z.literal('true'), z.literal('false')])
  .optional()
  .default('false')
  .transform((value) => value === 'true');

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_SERVER_URL: z.url(),
    VITE_BETA_MODE: booleanFromString,
    VITE_REQUEST_ACCESS_FORM_URL: z.url().optional(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
