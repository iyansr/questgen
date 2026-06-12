import { createDb } from '@questgen/db';
import { questions, questionTypeEnum } from '@questgen/db/schema';
import { Output, streamText } from 'ai';
import { z } from 'zod';

import type { ImageRef } from '../lib/chunker';
import { openrouter } from '../lib/openrouter';
import { SYSTEM_PROMPT, USER_PROMPT } from '../prompts/question-generation';
import type { QuestionTypeCount } from '../schemas/sessions.schema';
import { retrieveMultiQuery } from './rag/multi-query-retriever';
import { expandQueries } from './rag/query-expander';
import { buildTrace } from './rag/retrieval-trace';

export type GenerationConfig = {
	topic: string;
	questionTypeCounts: QuestionTypeCount[];
	source: 'document' | 'web';
};

const QUESTION_TYPE_VALUES = questionTypeEnum.enumValues;
const GENERATION_MODEL = 'google/gemini-3.1-flash-lite';
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
				'ID of an available image that illustrates the question, or null',
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

	return {
		questionType: q.questionType,
		questionText: q.questionText,
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
	if (counts.length === 1) {
		const [only] = counts as [QuestionTypeCount, ...QuestionTypeCount[]];
		return `Generate exactly ${only.count} ${only.type} questions. Every question MUST be of type "${only.type}".`;
	}

	const lines = counts
		.map((q) => `- ${q.count} of type "${q.type}"`)
		.join('\n');

	return [
		`Generate exactly the following distribution of questions (total = ${counts.reduce((s, q) => s + q.count, 0)}):`,
		lines,
		`Every question MUST be assigned one of the allowed types: ${counts.map((q) => q.type).join(', ')}.`,
		'For multiple_choice and true_false populate `options` (4 options for MC, 2 for T/F) and set `correctAnswer` to the label of the correct option.',
		'For short_answer and essay, leave `options` null and put a model answer in `correctAnswer`.',
	].join('\n');
}

export async function generateQuestionsInBackground(
	sessionId: string,
	scopeId: string,
	config: GenerationConfig,
): Promise<void> {
	const db = createDb();
	const total = config.questionTypeCounts.reduce((s, q) => s + q.count, 0);
	const traceStartedAt = new Date();

	const expanded = await expandQueries(
		config.topic,
		config.questionTypeCounts,
		config.source,
	);

	const multiQuery = await retrieveMultiQuery(
		expanded,
		scopeId,
		total,
		config.source,
	);

	const imageCatalog = new Map<string, ImageRef>();
	for (const ref of multiQuery.imageRefs) {
		imageCatalog.set(ref.id, ref);
	}

	const imageCatalogSection = multiQuery.imageRefs.length
		? `\n\nAvailable images (reference by ID, or null if none fit):\n${multiQuery.imageRefs
				.map(
					(ref, i) =>
						`${i + 1}. ${ref.id}: ${ref.caption || '(no description)'}`,
				)
				.join('\n')}\n`
		: '';

	const sourceMaterial = multiQuery.chunks.map((c) => c.text).join('\n\n');

	const systemPrompt = interpolate(SYSTEM_PROMPT, {
		TOPIC: config.topic,
		IMAGE_CATALOG: imageCatalogSection,
		SOURCE_MATERIAL: sourceMaterial,
	});

	const content = interpolate(USER_PROMPT, {
		DISTRIBUTION_PROMPT: buildDistributionPrompt(config.questionTypeCounts),
	});

	const allowedTypes = Array.from(
		new Set(config.questionTypeCounts.map((q) => q.type)),
	);

	const trace = buildTrace({
		topic: config.topic,
		source: config.source,
		expandedQueries: expanded,
		multiQueryResult: multiQuery,
		startedAt: traceStartedAt,
	});

	const { elementStream } = streamText({
		model: openrouter(GENERATION_MODEL),
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
				retrievalMode: 'multi-query',
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
