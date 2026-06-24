import { createDb } from '@questgen/db';
import { questions, questionTypeEnum } from '@questgen/db/schema';
import { Output, streamText } from 'ai';
import { z } from 'zod';

import type { ImageRef } from '@/modules/processing/chunker';
import type { QuestionTypeCount } from '@/modules/sessions/sessions.schema';
import { openrouter } from '@/shared/ai/openrouter';
import { GENERATION_PARAMS, MODELS } from '@/shared/config/models';

import { SYSTEM_PROMPT, USER_PROMPT } from './prompts/question-generation';
import { documentSearch } from './search/document-search';
import type { RetrievalTrace } from './search/types';
import { webSearch } from './search/web-search';

export type GenerationConfig = {
  topic: string;
  questionTypeCounts: QuestionTypeCount[];
  source: 'document' | 'web';
  curriculum?: string;
  grade?: string;
  classGrade?: string;
};

const QUESTION_TYPE_VALUES = questionTypeEnum.enumValues;
type QuestionType = (typeof QUESTION_TYPE_VALUES)[number];

const questionOptionSchema = z.object({
  label: z.string(),
  text: z.string(),
});

function buildGeneratedQuestionSchema(allowedTypes: QuestionType[]) {
  if (allowedTypes.length === 0) {
    throw new Error('buildGeneratedQuestionSchema requires at least one type');
  }
  return z.object({
    questionType: z
      .enum(allowedTypes as [QuestionType, ...QuestionType[]])
      .describe(
        `One of: ${allowedTypes.join(', ')}. Must match the type assigned in the prompt.`,
      ),
    questionText: z
      .string()
      .describe(
        'Question text in markdown format. Never explicitly mention imageRef here, but it may be implicitly referenced (e.g. "What does the diagram illustrate?").',
      ),
    imageRef: z
      .string()
      .nullable()
      .describe(
        'Usually null. Only set to an image ID when the question CANNOT be answered without examining that image. Most questions must be text-based, so the default is null.',
      ),
    options: z
      .array(questionOptionSchema)
      .nullable()
      .describe(
        'Options for multiple_choice/true_false (label A/B/..., text). Null for short_answer/essay.',
      ),
    correctAnswer: z
      .string()
      .describe(
        'For multiple_choice/true_false: the label of the correct option. For short_answer/essay: a model answer.',
      ),
    suggestedAnswer: z
      .string()
      .describe(
        'Brief explanation or worked solution. May be empty for simple factual questions.',
      ),
  });
}

type GeneratedQuestion = {
  questionType: QuestionType;
  questionText: string;
  imageRef: string | null;
  options: Array<{ label: string; text: string }> | null;
  correctAnswer: string;
  suggestedAnswer: string;
};

type NormalizedQuestion = {
  questionType: QuestionType;
  questionText: string;
  imageUrl: string | null;
  options: Array<{ label: string; text: string }> | null;
  correctAnswer: string;
  suggestedAnswer: string;
};

const TYPES_WITH_OPTIONS: ReadonlySet<QuestionType> = new Set([
  'multiple_choice',
  'true_false',
]);

const IMAGE_MARKDOWN_RE = /!\[.*?\]\(.*?\)\s*/g;

function normalizeQuestion(
  q: GeneratedQuestion,
  imageCatalog: Map<string, ImageRef>,
): NormalizedQuestion {
  let imageUrl: string | null = null;
  if (q.imageRef) {
    const ref = imageCatalog.get(q.imageRef);
    if (ref) imageUrl = ref.url;
  }

  const options = TYPES_WITH_OPTIONS.has(q.questionType)
    ? (q.options ?? null)
    : null;

  const questionText = q.questionText.replace(IMAGE_MARKDOWN_RE, '').trim();

  return {
    questionType: q.questionType,
    questionText,
    imageUrl,
    options,
    correctAnswer: q.correctAnswer,
    suggestedAnswer: q.suggestedAnswer,
  };
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

function buildDistributionPrompt(counts: QuestionTypeCount[]): string {
  const total = counts.reduce((s, q) => s + q.count, 0);
  const lines = counts
    .map((q) => `- ${q.count} of type "${q.type}"`)
    .join('\n');

  if (counts.length === 1) {
    const [only] = counts as [QuestionTypeCount, ...QuestionTypeCount[]];
    return [
      `Generate exactly ${total} questions.`,
      `Every question MUST be of type "${only.type}".`,
    ].join('\n');
  }

  return [
    `Generate exactly ${total} questions with the following distribution:`,
    lines,
    `Every question MUST be assigned one of the allowed types: ${counts.map((q) => q.type).join(', ')}.`,
  ].join('\n');
}

/**
 * Caps how many questions in the set may attach an image. Most questions
 * should be text-based even when the material is image-dense, so the budget
 * is a small fraction of the total, bounded by the images actually available.
 */
function buildImageGuidance(
  counts: QuestionTypeCount[],
  availableImages: number,
): string {
  const total = counts.reduce((s, q) => s + q.count, 0);

  if (availableImages === 0) {
    return 'No images are available. Set imageRef to null for EVERY question and never reference images in the question text.';
  }

  const maxImageQuestions = Math.min(
    availableImages,
    Math.max(1, Math.round(total * 0.3)),
  );

  return [
    `Image budget: AT MOST ${maxImageQuestions} of the ${total} questions may attach an image (set imageRef). The remaining ${total - maxImageQuestions} or more MUST set imageRef to null.`,
    'Default to imageRef = null. Only spend an image on a question that genuinely cannot be answered without looking at the diagram/chart/map — not on questions that text alone can test.',
    availableImages > 1
      ? 'When you do use images, spread them across DIFFERENT images and vary the lead-in phrasing.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildWebTrace(
  topic: string,
  startedAt: Date,
  imageRefs: ImageRef[] = [],
): RetrievalTrace {
  return {
    topic,
    source: 'web',
    expandedQueries: [],
    perQuery: [],
    uniqueChunkIds: [],
    imageRefIds: imageRefs.map((r) => r.id),
    coverage: { uniqueChunkCount: 0, avgScore: 0, minScore: 0 },
    startedAt: startedAt.toISOString(),
    completedAt: new Date().toISOString(),
  };
}

export async function generateQuestionsInBackground(
  sessionId: string,
  scopeId: string,
  config: GenerationConfig,
): Promise<void> {
  const db = createDb();
  const traceStartedAt = new Date();

  let sourceMaterial: string;
  let imageCatalog = new Map<string, ImageRef>();
  let trace: RetrievalTrace;

  if (config.source === 'web') {
    console.log('SEARCH WEB...');
    const webResult = await webSearch({
      topic: config.topic,
      sessionId,
      classGrade: config.classGrade ?? '',
      grade: config.grade ?? '',
      curriculum: config.curriculum ?? '',
    });

    for (const ref of webResult.imageRefs) {
      imageCatalog.set(ref.id, ref);
    }

    sourceMaterial = webResult.sourceMaterial;

    for (const ref of webResult.imageRefs) {
      if (!sourceMaterial.includes(ref.id)) {
        sourceMaterial += `\n\n![IMAGE:${ref.caption || 'Illustration'}](${ref.id})`;
      }
    }

    trace = buildWebTrace(config.topic, traceStartedAt, webResult.imageRefs);
  } else {
    console.log('SEARCH DOCS...');
    const result = await documentSearch({
      topic: config.topic,
      scopeId,
      sessionId,
      curriculum: config.curriculum ?? '',
      grade: config.grade ?? '',
      classGrade: config.classGrade ?? '',
    });

    imageCatalog = new Map<string, ImageRef>();
    for (const ref of result.imageRefs) {
      imageCatalog.set(ref.id, ref);
    }

    sourceMaterial = result.sourceMaterial;

    for (const ref of result.imageRefs) {
      if (!sourceMaterial.includes(ref.id)) {
        sourceMaterial += `\n\n![IMAGE:${ref.caption || 'Illustration'}](${ref.id})`;
      }
    }

    trace = {
      topic: config.topic,
      source: config.source,
      expandedQueries: result.trace.queries.map((q) => ({ query: q })),
      perQuery: result.trace.queries.map((q) => ({
        query: q,
        chunkIds: result.trace.chunks.map((c) => c.id),
        scores: result.trace.chunks.map((c) => c.score),
      })),
      uniqueChunkIds: result.trace.chunks.map((c) => c.id).slice(0, 50),
      imageRefIds: result.imageRefs.map((r) => r.id),
      coverage: result.trace.coverage,
      startedAt: traceStartedAt.toISOString(),
      completedAt: new Date().toISOString(),
    };
  }

  const imageCatalogSection = imageCatalog.size
    ? `\n\nAvailable images (reference by ID, or null if none fit):\n${Array.from(
        imageCatalog.values(),
      )
        .map(
          (ref, i) =>
            `${i + 1}. ${ref.id}: ${ref.caption || '(no description)'}`,
        )
        .join('\n')}\n`
    : '\nNo images are available for this session. Do not reference any images.\n';

  const systemPrompt = interpolate(SYSTEM_PROMPT, {
    TOPIC: config.topic,
    GRADE: config.grade ?? 'general',
    CLASS_GRADE: config.classGrade ?? 'general',
    CURRICULUM: config.curriculum ?? 'general',
    IMAGE_CATALOG: imageCatalogSection,
    SOURCE_MATERIAL: sourceMaterial,
  });

  const content = interpolate(USER_PROMPT, {
    DISTRIBUTION_PROMPT: buildDistributionPrompt(config.questionTypeCounts),
    IMAGE_GUIDANCE: buildImageGuidance(
      config.questionTypeCounts,
      imageCatalog.size,
    ),
  });

  const allowedTypes = Array.from(
    new Set(config.questionTypeCounts.map((q) => q.type)),
  );

  console.log('START STREAMING...');
  const { elementStream } = streamText({
    model: openrouter(MODELS.GENERATION),
    temperature: GENERATION_PARAMS.GENERATION.temperature,
    topP: GENERATION_PARAMS.GENERATION.topP,
    output: Output.array({
      element: buildGeneratedQuestionSchema(allowedTypes),
    }),
    system: systemPrompt,
    messages: [{ role: 'user', content }],
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'question-generation',
      metadata: {
        sessionId,
        topic: config.topic,
        retrievalMode:
          config.source === 'web' ? 'web-search-tool' : 'document-search-tool',
        source: config.source,
        retrievalTrace: JSON.stringify(trace),
      },
    },
  });

  const BATCH_SIZE = 3;
  const buffer: (typeof questions.$inferInsert)[] = [];

  const flush = async () => {
    if (buffer.length === 0) return;
    await db
      .insert(questions)
      .values([...buffer])
      .onConflictDoNothing({ target: [questions.setId, questions.order] });
    buffer.length = 0;
  };

  let index = 0;
  for await (const question of elementStream) {
    const normalized = normalizeQuestion(question, imageCatalog);
    buffer.push({
      setId: sessionId,
      order: index,
      questionText: normalized.questionText,
      questionType: normalized.questionType,
      imageUrl: normalized.imageUrl,
      options: normalized.options,
      correctAnswer: normalized.correctAnswer,
      suggestedAnswer: normalized.suggestedAnswer,
    });
    if (buffer.length >= BATCH_SIZE) await flush();
    index++;
  }

  await flush();
}
