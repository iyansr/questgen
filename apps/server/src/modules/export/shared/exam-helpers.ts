import type { ExportPdfInput } from '../export.schema';

export function buildSubtitle(options: ExportPdfInput): string {
  return [options.subject, options.classLabel, options.semester]
    .filter((part) => part && part.trim().length > 0)
    .join(' · ');
}

export function isMultipleChoice(type: string): boolean {
  return type === 'multiple_choice' || type === 'true_false';
}

export type QuestionOption = {
  label: string;
  text: string;
};
