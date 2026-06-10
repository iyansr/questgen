import { env } from '@questgen/env/server';
import { createMiddleware } from 'hono/factory';

import { verifyToken } from '../lib/auth';
import type { AppEnv } from '../types';

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
	const header = c.req.header('Authorization');

	if (!header?.startsWith('Bearer ')) {
		return c.json({ error: 'Missing or invalid Authorization header' }, 401);
	}

	const token = header.slice(7);

	try {
		const payload = await verifyToken(token, env.JWT_SECRET);
		c.set('userId', payload.userId);
		c.set('email', payload.email);
		await next();
	} catch {
		return c.json({ error: 'Invalid or expired token' }, 401);
	}
});
