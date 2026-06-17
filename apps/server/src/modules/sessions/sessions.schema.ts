import { z } from 'zod';

const MIN_WEB_QUERY_CHARS = 3;
const MAX_WEB_QUERY_CHARS = 200;

export const QUESTION_TYPES = [
	'multiple_choice',
	'true_false',
	'short_answer',
	'essay',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

const MAX_TOTAL_QUESTIONS = 50;

export const questionTypeCountSchema = z.object({
	type: z.enum(QUESTION_TYPES),
	count: z.coerce.number().int().min(0).max(MAX_TOTAL_QUESTIONS),
});

export type QuestionTypeCount = z.infer<typeof questionTypeCountSchema>;

const parsedQuestionTypeCounts = z
	.string()
	.transform((val, ctx) => {
		try {
			return JSON.parse(val);
		} catch {
			ctx.addIssue({
				code: 'custom',
				message: 'questionTypeCounts must be valid JSON',
			});
			return z.NEVER;
		}
	})
	.pipe(
		z
			.array(questionTypeCountSchema)
			.min(1, 'Select at least one question type')
			.max(QUESTION_TYPES.length, 'Too many question types')
			.refine((arr) => arr.every((q) => q.count > 0), {
				message: 'Each selected type must have count greater than 0',
			})
			.refine(
				(arr) => {
					const seen = new Set<string>();
					for (const q of arr) {
						if (seen.has(q.type)) return false;
						seen.add(q.type);
					}
					return true;
				},
				{ message: 'Duplicate question types are not allowed' },
			)
			.refine(
				(arr) =>
					arr.reduce((sum, q) => sum + q.count, 0) <= MAX_TOTAL_QUESTIONS,
				{
					message: `Total questions cannot exceed ${MAX_TOTAL_QUESTIONS}`,
				},
			),
	);

export const createSessionSchema = z
	.object({
		topic: z.string().min(1).max(200),
		questionTypeCounts: parsedQuestionTypeCounts,
		file: z.instanceof(File).optional(),
		documentId: z.string().optional(),
		webQuery: z
			.string()
			.trim()
			.min(MIN_WEB_QUERY_CHARS)
			.max(MAX_WEB_QUERY_CHARS)
			.optional(),
		curriculum: z.string().trim().min(1).optional(),
		grade: z.string().trim().min(1).optional(),
		classGrade: z.string().trim().min(1).optional(),
	})
	.refine(
		(d) => [d.file, d.documentId, d.webQuery].filter(Boolean).length === 1,
		{ message: 'Provide exactly one of: file, documentId, webQuery' },
	)
	.refine((d) => !d.webQuery || d.curriculum, {
		message: 'curriculum is required for web search',
		path: ['curriculum'],
	})
	.refine((d) => !d.webQuery || d.grade, {
		message: 'grade is required for web search',
		path: ['grade'],
	})
	.refine((d) => !d.webQuery || d.classGrade, {
		message: 'classGrade is required for web search',
		path: ['classGrade'],
	});

export const SESSION_STATUSES = [
	'pending',
	'generating',
	'completed',
	'failed',
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const listSessionsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	status: z.enum(SESSION_STATUSES).optional(),
	search: z.string().trim().min(1).max(200).optional(),
});

export function totalCount(counts: QuestionTypeCount[]): number {
	return counts.reduce((sum, q) => sum + q.count, 0);
}

export function toCountMap(
	counts: QuestionTypeCount[],
): Record<QuestionType, number> {
	const map = Object.fromEntries(QUESTION_TYPES.map((t) => [t, 0])) as Record<
		QuestionType,
		number
	>;
	for (const q of counts) map[q.type] = q.count;
	return map;
}
