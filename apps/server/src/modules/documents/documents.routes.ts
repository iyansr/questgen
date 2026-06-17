import { documents as documentsTable } from '@questgen/db/schema';
import { env } from '@questgen/env/server';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';

import { SessionValidationError } from '@/modules/sessions/sessions.service';
import type { AppEnv } from '@/types';

import { listReadyDocuments } from './documents.service';

const MIME_BY_TYPE: Record<'pdf' | 'docx', string> = {
	pdf: 'application/pdf',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const documents = new Hono<AppEnv>();

documents.get('/', async (c) => {
	const db = c.get('db');
	const userId = c.get('userId');

	try {
		const items = await listReadyDocuments(db, userId);
		return c.json({ items });
	} catch (err) {
		if (err instanceof SessionValidationError) {
			return c.json({ error: err.message }, err.status);
		}
		console.error('List documents error:', err);
		return c.json({ error: 'Internal server error' }, 500);
	}
});

documents.get('/:id/preview', async (c) => {
	const db = c.get('db');
	const userId = c.get('userId');
	const id = c.req.param('id');

	const [doc] = await db
		.select({
			fileUrl: documentsTable.fileUrl,
			fileType: documentsTable.fileType,
			filename: documentsTable.filename,
		})
		.from(documentsTable)
		.where(and(eq(documentsTable.id, id), eq(documentsTable.userId, userId)))
		.limit(1);

	if (!doc) {
		return c.json({ error: 'Document not found' }, 404);
	}

	const object = await env.DOCUMENTS_BUCKET.get(doc.fileUrl);
	if (!object) {
		return c.json({ error: 'File not found in storage' }, 404);
	}

	const contentType =
		object.httpMetadata?.contentType ?? MIME_BY_TYPE[doc.fileType];

	return new Response(object.body, {
		headers: {
			'Content-Type': contentType,
			'Content-Length': String(object.size),
			'Content-Disposition': `inline; filename="${encodeURIComponent(doc.filename)}"`,
			'Cache-Control': 'private, max-age=300',
		},
	});
});

export { documents };
