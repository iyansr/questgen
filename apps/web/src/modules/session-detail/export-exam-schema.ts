export const DEFAULT_DOCUMENT_TITLE = 'ULANGAN HARIAN';

export type ExportExamInput = {
  documentTitle: string;
  schoolName?: string;
  subject: string;
  classLabel?: string;
  semester?: string;
};

export type ExportPdfInput = ExportExamInput;

export function defaultSemester(date = new Date()): string {
  const month = date.getMonth();
  return month >= 6 || month <= 0 ? 'Semester Ganjil' : 'Semester Genap';
}

export function buildClassLabel(
  grade?: string,
  classGrade?: string,
): string | undefined {
  if (classGrade) return `Kelas ${classGrade}`;
  return grade;
}
