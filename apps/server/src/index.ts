import { env } from '@questgen/env/server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { flushTracing, initTracing } from './lib/tracing';
import { authMiddleware } from './middleware/auth';
import { dbMiddleware } from './middleware/db';
import { tracingMiddleware } from './middleware/tracing';
import { type DocumentJob, processDocument } from './queue/document-processor';
import { auth } from './routes/auth';
import { documents } from './routes/documents';
import { files } from './routes/files';
import { sessions } from './routes/sessions';
import type { AppEnv } from './types';

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
	async queue(batch: MessageBatch<DocumentJob>) {
		initTracing();
		try {
			for (const message of batch.messages) {
				await processDocument(message);
			}
		} finally {
			await flushTracing();
		}
	},
};
