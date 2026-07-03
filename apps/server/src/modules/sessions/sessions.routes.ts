import { zValidator } from '@hono/zod-validator';
import { questionSets, questions } from '@questgen/db/schema';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';

import type { AppEnv } from '@/types';

import { updateQuestionsSchema } from './questions.schema';
import {
  collectImageAssignments,
  deleteQuestion,
  updateQuestions,
} from './questions.service';
import {
  createSessionSchema,
  listSessionsQuerySchema,
} from './sessions.schema';
import {
  createSession,
  getSessionWithQuestions,
  listSessions,
  SessionValidationError,
} from './sessions.service';

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

sessions.patch(
  '/:id/questions',
  zValidator('form', updateQuestionsSchema),
  async (c) => {
    const db = c.get('db');
    const userId = c.get('userId');
    const id = c.req.param('id');
    const input = c.req.valid('form');
    const formData = await c.req.formData();
    const images = await collectImageAssignments(formData, input.updates);

    try {
      const result = await updateQuestions(
        db,
        userId,
        id,
        input.updates,
        images,
      );
      return c.json(result);
    } catch (err) {
      if (err instanceof SessionValidationError) {
        return c.json({ error: err.message }, err.status);
      }
      console.error('Update questions error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  },
);

sessions.delete('/:id/questions/:questionId', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');
  const id = c.req.param('id');
  const questionId = c.req.param('questionId');

  try {
    const result = await deleteQuestion(db, userId, id, questionId);
    return c.json(result);
  } catch (err) {
    if (err instanceof SessionValidationError) {
      return c.json({ error: err.message }, err.status);
    }
    console.error('Delete question error:', err);
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
      const lastEmittedAt = new Map<string, number>();
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

        const allQuestions = await db
          .select()
          .from(questions)
          .where(eq(questions.setId, id))
          .orderBy(questions.order);

        let emittedAny = false;
        for (const q of allQuestions) {
          const updatedAtMs = new Date(q.updatedAt).getTime();
          const previous = lastEmittedAt.get(q.id);
          if (previous === undefined || updatedAtMs > previous) {
            writer.write({ type: 'data-question', id: q.id, data: q });
            lastEmittedAt.set(q.id, updatedAtMs);
            emittedAny = true;
          }
        }

        if (currentSession.status === 'failed') {
          break;
        }

        if (emittedAny && currentSession.status === 'completed') {
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
