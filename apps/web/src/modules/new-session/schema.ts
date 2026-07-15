import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from '@questgen/db/upload-limits';
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

export {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_PDF_PAGES,
} from '@questgen/db/upload-limits';

export const sourceModeSchema = z.enum(['file', 'document', 'web']);

export const MAX_WEB_QUERY_CHARS = 200;
export const MIN_WEB_QUERY_CHARS = 3;

export const CURRICULUM_OPTIONS = ['K-13', 'Kurikulum Merdeka'] as const;
export const GRADE_OPTIONS = ['SD', 'SMP', 'SMA', 'SMK'] as const;
export const CLASS_GRADE_OPTIONS: Record<string, readonly string[]> = {
  SD: ['I', 'II', 'III', 'IV', 'V', 'VI'],
  SMP: ['VII', 'VIII', 'IX'],
  SMA: ['X', 'XI', 'XII'],
};

const MAX_CLASS_GRADE_CHARS = 50;

export function isFreeTextClassGrade(grade?: string): boolean {
  return grade === 'SMK';
}

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
    curriculum: z.enum(CURRICULUM_OPTIONS).optional(),
    grade: z.enum(GRADE_OPTIONS).optional(),
    classGrade: z.string().min(1).optional(),
  })
  .refine(
    (d) => [d.file, d.documentId, d.webQuery].filter(Boolean).length === 1,
    {
      message: 'Pilih salah satu sumber: file, dokumen, atau riset web',
      path: ['source'],
    },
  )
  .refine((d) => !d.webQuery || d.curriculum, {
    message: 'Kurikulum wajib diisi untuk riset web',
    path: ['curriculum'],
  })
  .refine((d) => !d.webQuery || d.grade, {
    message: 'Jenjang wajib diisi untuk riset web',
    path: ['grade'],
  })
  .refine((d) => !d.webQuery || d.classGrade, {
    message: 'Kelas wajib diisi untuk riset web',
    path: ['classGrade'],
  })
  .refine(
    (d) =>
      !isFreeTextClassGrade(d.grade) || (d.classGrade?.trim().length ?? 0) >= 2,
    {
      message: 'Kelas wajib diisi (contoh: X TKJ 1)',
      path: ['classGrade'],
    },
  )
  .refine(
    (d) =>
      !isFreeTextClassGrade(d.grade) ||
      (d.classGrade?.trim().length ?? 0) <= MAX_CLASS_GRADE_CHARS,
    {
      message: `Kelas maksimal ${MAX_CLASS_GRADE_CHARS} karakter`,
      path: ['classGrade'],
    },
  );

export type NewSessionFormValues = z.infer<typeof newSessionFormSchema>;

export function totalCount(counts: { count: number }[]): number {
  return counts.reduce((sum, q) => sum + q.count, 0);
}
