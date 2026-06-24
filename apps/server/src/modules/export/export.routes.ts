import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import {
  getSessionWithQuestions,
  SessionValidationError,
} from '@/modules/sessions/sessions.service';
import type { AppEnv } from '@/types';

import { exportPdfSchema, slugifyFilename } from './export.schema';
import { buildExamPdf } from './pdf/build-exam-pdf';

const exportRoutes = new Hono<AppEnv>();

exportRoutes.post(
  '/:id/export/pdf',
  zValidator('json', exportPdfSchema),
  async (c) => {
    const db = c.get('db');
    const userId = c.get('userId');
    const id = c.req.param('id');
    const input = c.req.valid('json');

    try {
      const session = await getSessionWithQuestions(db, userId, id);

      if (session.questions.length === 0) {
        return c.json({ error: 'Tidak ada soal untuk diekspor' }, 400);
      }

      const pdfBytes = await buildExamPdf(session, input);
      const filename = `soal-${slugifyFilename(session.title)}.pdf`;

      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
          'Cache-Control': 'private, no-store',
        },
      });
    } catch (err) {
      if (err instanceof SessionValidationError) {
        return c.json({ error: err.message }, err.status);
      }
      console.error('Export PDF error:', err);
      return c.json({ error: 'Gagal membuat PDF' }, 500);
    }
  },
);

export { exportRoutes };
