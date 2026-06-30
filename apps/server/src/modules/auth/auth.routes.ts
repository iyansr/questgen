import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { authMiddleware } from '@/shared/middleware/auth';
import type { AppEnv } from '@/types';

import { loginSchema } from './auth.schema';
import { getUserById, loginUser } from './auth.service';

const auth = new Hono<AppEnv>();

auth.post('/register', async (c) => {
  return c.json({ error: 'Registration is closed during beta' }, 403);
});

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const db = c.get('db');

  try {
    const result = await loginUser(db, email, password);
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid email or password') {
      return c.json({ error: err.message }, 401);
    }
    console.error('Login error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const db = c.get('db');

  try {
    const result = await getUserById(db, userId);
    return c.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      return c.json({ error: err.message }, 404);
    }
    console.error('Get me error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { auth };
