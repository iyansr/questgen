import z from 'zod';

export const QUESTION_TYPES = [
	'multiple_choice',
	'true_false',
	'short_answer',
	'essay',
] as const;

export const QUESTION_TYPE_LABELS: Record<
	(typeof QUESTION_TYPES)[number],
	string
> = {
	multiple_choice: 'Pilihan ganda',
	true_false: 'Benar / Salah',
	short_answer: 'Isian singkat',
	essay: 'Esai',
};

export type QuestionType = (typeof QUESTION_TYPES)[number];

const MAX_TOTAL_QUESTIONS = 50;
const MAX_PER_TYPE = MAX_TOTAL_QUESTIONS;

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 20;
export const MAX_PDF_PAGES = 50;

export const sourceModeSchema = z.enum(['file', 'document', 'web']);

export const MAX_WEB_QUERY_CHARS = 200;
export const MIN_WEB_QUERY_CHARS = 3;

export const questionTypeCountSchema = z.object({
	type: z.enum(QUESTION_TYPES),
	count: z.number().int().min(0).max(MAX_PER_TYPE),
});

export type QuestionTypeCount = z.infer<typeof questionTypeCountSchema>;

export const newSessionFormSchema = z
	.object({
		topic: z
			.string()
			.min(1, 'Topik wajib diisi')
			.max(200, 'Topik maksimal 200 karakter'),
		questionTypeCounts: z
			.array(questionTypeCountSchema)
			.min(1, 'Pilih minimal satu jenis soal')
			.refine((arr) => arr.every((q) => q.count > 0), {
				message: 'Setiap jenis soal yang dipilih harus berjumlah lebih dari 0',
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
				{ message: 'Jenis soal tidak boleh duplikat' },
			)
			.refine(
				(arr) =>
					arr.reduce((sum, q) => sum + q.count, 0) <= MAX_TOTAL_QUESTIONS,
				{
					message: `Total soal tidak boleh melebihi ${MAX_TOTAL_QUESTIONS}`,
				},
			),
		file: z
			.instanceof(File, { message: 'File tidak valid' })
			.optional()
			.refine((f) => !f || f.size <= MAX_FILE_SIZE_BYTES, {
				message: `Ukuran file maksimal ${MAX_FILE_SIZE_MB} MB`,
			}),
		documentId: z.string().min(1, 'Pilih dokumen').optional(),
		webQuery: z
			.string()
			.trim()
			.min(
				MIN_WEB_QUERY_CHARS,
				`Kata kunci minimal ${MIN_WEB_QUERY_CHARS} karakter`,
			)
			.max(
				MAX_WEB_QUERY_CHARS,
				`Kata kunci maksimal ${MAX_WEB_QUERY_CHARS} karakter`,
			)
			.optional(),
	})
	.refine(
		(d) => [d.file, d.documentId, d.webQuery].filter(Boolean).length === 1,
		{
			message: 'Pilih salah satu sumber: file, dokumen, atau riset web',
			path: ['source'],
		},
	);

export type NewSessionFormValues = z.infer<typeof newSessionFormSchema>;

export function totalCount(counts: { count: number }[]): number {
	return counts.reduce((sum, q) => sum + q.count, 0);
}
