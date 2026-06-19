import { env } from '@questgen/env/server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { auth } from '@/modules/auth/auth.routes';
import { documents } from '@/modules/documents/documents.routes';
import { files } from '@/modules/files/files.routes';
import { sessions } from '@/modules/sessions/sessions.routes';
import { authMiddleware } from '@/shared/middleware/auth';
import { dbMiddleware } from '@/shared/middleware/db';
import { tracingMiddleware } from '@/shared/middleware/tracing';
import type { AppEnv } from '@/types';

export { GenerationWorkflow } from '@/modules/processing/generation.workflow';

const app = new Hono<AppEnv>();

app.use(tracingMiddleware);
app.use(logger());
app.use(
	'/*',
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
	}),
);

app.get('/', (c) => {
	return c.text('OK');
});

app.route('/files', files);

app.use('/api/*', dbMiddleware);
app.route('/api/auth', auth);

app.use('/api/*', authMiddleware);
app.route('/api/sessions', sessions);
app.route('/api/documents', documents);

export default {
	fetch: app.fetch,
};
