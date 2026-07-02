import type { createDb } from '@questgen/db';
import { documents, questionSets, questions } from '@questgen/db/schema';
import { and, count, eq } from 'drizzle-orm';

export type DashboardStats = {
  totalQuestions: number;
  savedSets: number;
  uploadedDocuments: number;
};

export async function getDashboardStats(
  db: ReturnType<typeof createDb>,
  userId: string,
): Promise<DashboardStats> {
  const [questionsRow, setsRow, documentsRow] = await Promise.all([
    db
      .select({ total: count() })
      .from(questions)
      .innerJoin(questionSets, eq(questions.setId, questionSets.id))
      .where(
        and(
          eq(questionSets.userId, userId),
          eq(questionSets.status, 'completed'),
        ),
      ),
    db
      .select({ total: count() })
      .from(questionSets)
      .where(
        and(
          eq(questionSets.userId, userId),
          eq(questionSets.status, 'completed'),
        ),
      ),
    db
      .select({ total: count() })
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.status, 'ready'))),
  ]);

  return {
    totalQuestions: questionsRow[0]?.total ?? 0,
    savedSets: setsRow[0]?.total ?? 0,
    uploadedDocuments: documentsRow[0]?.total ?? 0,
  };
}
