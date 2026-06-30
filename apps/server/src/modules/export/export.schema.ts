import { z } from 'zod';

export const DEFAULT_DOCUMENT_TITLE = 'ULANGAN HARIAN';

export const exportPdfSchema = z.object({
  documentTitle: z.string().min(1).max(200).default(DEFAULT_DOCUMENT_TITLE),
  schoolName: z.string().max(200).optional(),
  subject: z.string().min(1).max(200),
  classLabel: z.string().max(100).optional(),
  semester: z.string().max(100).optional(),
});

export type ExportPdfInput = z.infer<typeof exportPdfSchema>;

export const exportDocxSchema = exportPdfSchema;
export type ExportDocxInput = ExportPdfInput;

export function defaultSemester(date = new Date()): string {
  const month = date.getMonth();
  return month >= 6 || month <= 0 ? 'Semester Ganjil' : 'Semester Genap';
}

export function slugifyFilename(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'soal'
  );
}
