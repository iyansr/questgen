import { createDb } from '@questgen/db';
import { createMiddleware } from 'hono/factory';

import type { AppEnv } from '@/types';

export const dbMiddleware = createMiddleware<AppEnv>(async (c, next) => {
	c.set('db', createDb());
	await next();
});
