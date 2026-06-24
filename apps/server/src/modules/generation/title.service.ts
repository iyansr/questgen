import { createDb } from '@questgen/db';
import { questionSets, questions } from '@questgen/db/schema';
import { generateText } from 'ai';
import { asc, eq } from 'drizzle-orm';

import { openrouter } from '@/shared/ai/openrouter';
import { MODELS } from '@/shared/config/models';

const MAX_TITLE_LENGTH = 120;
const SAMPLE_QUESTION_COUNT = 8;

type TitleContext = {
  topic: string;
  curriculum?: string;
  grade?: string;
  classGrade?: string;
};

/**
 * Generates a short, human-readable session title from the questions that were
 * actually produced, then persists it. Best-effort: any failure leaves the
 * temporary topic-based title in place rather than failing the workflow.
 */
export async function generateSessionTitle(
  sessionId: string,
  context: TitleContext,
): Promise<void> {
  const db = createDb();

  const sampled = await db
    .select({ questionText: questions.questionText })
    .from(questions)
    .where(eq(questions.setId, sessionId))
    .orderBy(asc(questions.order))
    .limit(SAMPLE_QUESTION_COUNT);

  if (sampled.length === 0) return;

  const levelParts = [
    context.curriculum && `kurikulum ${context.curriculum}`,
    context.grade,
    context.classGrade && `kelas ${context.classGrade}`,
  ].filter(Boolean);
  const levelHint = levelParts.length > 0 ? levelParts.join(' ') : '';

  const questionList = sampled
    .map((q, i) => `${i + 1}. ${q.questionText}`)
    .join('\n');

  const { text } = await generateText({
    model: openrouter(MODELS.TITLE),
    temperature: 0.3,
    system: `\
Kamu membuat judul singkat untuk satu set soal latihan.

Aturan:
- Tulis judul dalam Bahasa Indonesia, ringkas (maksimal 8 kata).
- Judul harus mencerminkan topik konkret dari soal-soal, bukan deskripsi umum.
- Sertakan jenjang/kurikulum bila relevan, contoh: "Matematika Kalkulus SMA Kelas X Kurikulum Merdeka".
- Jangan gunakan tanda kutip, tanda baca akhir, atau awalan seperti "Judul:".
- Keluarkan HANYA judulnya, tanpa penjelasan.`,
    prompt: `\
Topik: ${context.topic}
${levelHint ? `Jenjang: ${levelHint}\n` : ''}Contoh soal yang dihasilkan:
${questionList}

Buat satu judul singkat untuk set soal ini.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'session-title',
      metadata: { sessionId, topic: context.topic },
    },
  });

  const title = text
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[.\s]+$/, '')
    .slice(0, MAX_TITLE_LENGTH)
    .trim();

  if (!title) return;

  await db
    .update(questionSets)
    .set({ title, updatedAt: new Date() })
    .where(eq(questionSets.id, sessionId));
}
