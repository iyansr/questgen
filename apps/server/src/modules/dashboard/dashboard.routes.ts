import { Hono } from 'hono';

import { SessionValidationError } from '@/modules/sessions/sessions.service';
import type { AppEnv } from '@/types';

import { getDashboardStats } from './dashboard.service';

const dashboard = new Hono<AppEnv>();

dashboard.get('/stats', async (c) => {
  const db = c.get('db');
  const userId = c.get('userId');

  try {
    const stats = await getDashboardStats(db, userId);
    return c.json(stats);
  } catch (err) {
    if (err instanceof SessionValidationError) {
      return c.json({ error: err.message }, err.status);
    }
    console.error('Dashboard stats error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export { dashboard };
