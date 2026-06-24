import type { createDb } from '@questgen/db';
import { documents } from '@questgen/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export type DocumentListItem = {
  id: string;
  filename: string;
  createdAt: Date;
};

export async function listReadyDocuments(
  db: ReturnType<typeof createDb>,
  userId: string,
): Promise<DocumentListItem[]> {
  return db
    .select({
      id: documents.id,
      filename: documents.filename,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.status, 'ready')))
    .orderBy(desc(documents.createdAt));
}
