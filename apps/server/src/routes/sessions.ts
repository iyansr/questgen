import { zValidator } from '@hono/zod-validator';
import { questionSets, questions } from '@questgen/db/schema';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { and, eq, gte } from 'drizzle-orm';
import { Hono } from 'hono';

import {
	createSessionSchema,
	listSessionsQuerySchema,
} from '../schemas/sessions.schema';
import {
	createSession,
	getSessionWithQuestions,
	listSessions,
	SessionValidationError,
} from '../services/sessions.service';
import type { AppEnv } from '../types';

const MAX_STREAM_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 1000;

const sessions = new Hono<AppEnv>();

sessions.get('/', zValidator('query', listSessionsQuerySchema), async (c) => {
	const db = c.get('db');
	const userId = c.get('userId');
	const { page, limit, status, search } = c.req.valid('query');

	try {
		const result = await listSessions(db, userId, page, limit, {
			status,
			search,
		});
		return c.json(result);
	} catch (err) {
		if (err instanceof SessionValidationError) {
			return c.json({ error: err.message }, err.status);
		}
		console.error('List sessions error:', err);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

sessions.post('/', zValidator('form', createSessionSchema), async (c) => {
	const db = c.get('db');
	const userId = c.get('userId');
	const input = c.req.valid('form');

	try {
		const result = await createSession(db, userId, input);
		return c.json(result, 201);
	} catch (err) {
		if (err instanceof SessionValidationError) {
			return c.json({ error: err.message }, err.status);
		}
		console.error('Create session error:', err);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

sessions.get('/:id', async (c) => {
	const db = c.get('db');
	const userId = c.get('userId');
	const id = c.req.param('id');

	try {
		const result = await getSessionWithQuestions(db, userId, id);
		return c.json(result);
	} catch (err) {
		if (err instanceof SessionValidationError) {
			return c.json({ error: err.message }, err.status);
		}
		console.error('Get session error:', err);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

sessions.post('/:id/stream', async (c) => {
	const db = c.get('db');
	const userId = c.get('userId');
	const id = c.req.param('id');

	const [session] = await db
		.select()
		.from(questionSets)
		.where(eq(questionSets.id, id));

	if (!session || session.userId !== userId) {
		return c.json({ error: 'Not found' }, 404);
	}

	const abortSignal = c.req.raw.signal;

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const startedAt = Date.now();
			let lastQuestionCount = 0;
			let lastStatus: string | null = null;
			let lastErrorMessage: string | null = null;

			while (!abortSignal.aborted && Date.now() - startedAt < MAX_STREAM_MS) {
				const [currentSession] = await db
					.select()
					.from(questionSets)
					.where(eq(questionSets.id, id));

				if (!currentSession) {
					if (lastStatus !== 'failed') {
						writer.write({
							type: 'data-status',
							data: {
								status: 'failed',
								errorMessage: 'Session no longer exists',
							},
							transient: true,
						});
						lastStatus = 'failed';
						lastErrorMessage = 'Session no longer exists';
					}
					break;
				}

				if (
					currentSession.status !== lastStatus ||
					currentSession.errorMessage !== lastErrorMessage
				) {
					writer.write({
						type: 'data-status',
						data: {
							status: currentSession.status,
							errorMessage: currentSession.errorMessage,
						},
						transient: true,
					});
					lastStatus = currentSession.status;
					lastErrorMessage = currentSession.errorMessage;
				}

			const freshQuestions = await db
				.select()
				.from(questions)
				.where(
					and(
						eq(questions.setId, id),
						gte(questions.order, lastQuestionCount),
					),
				)
				.orderBy(questions.order);

			if (freshQuestions.length > 0) {
				for (const q of freshQuestions) {
					writer.write({ type: 'data-question', id: q.id, data: q });
				}
				lastQuestionCount += freshQuestions.length;
			}

				if (
					currentSession.status === 'completed' ||
					currentSession.status === 'failed'
				) {
					break;
				}

				await new Promise<void>((resolve) => {
					const t = setTimeout(resolve, POLL_INTERVAL_MS);
					abortSignal.addEventListener(
						'abort',
						() => {
							clearTimeout(t);
							resolve();
						},
						{ once: true },
					);
				});
			}
		},
	});

	return createUIMessageStreamResponse({ stream });
});

export { sessions };
