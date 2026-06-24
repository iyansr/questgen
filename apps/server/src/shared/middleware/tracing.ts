import { createMiddleware } from 'hono/factory';

import { flushTracing, initTracing } from '@/shared/lib/tracing';
import type { AppEnv } from '@/types';

export const tracingMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  initTracing();
  await next();
  c.executionCtx.waitUntil(flushTracing());
});
