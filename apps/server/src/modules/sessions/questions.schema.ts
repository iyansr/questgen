import { z } from 'zod';

import { QUESTION_TYPES } from './sessions.schema';

const MAX_OPTION_TEXT_CHARS = 500;
const MAX_QUESTION_TEXT_CHARS = 2000;
const MAX_ANSWER_CHARS = 1000;
const MAX_OPTIONS = 12;

const optionSchema = z.object({
  label: z.string().min(1).max(8),
  text: z.string().trim().min(1).max(MAX_OPTION_TEXT_CHARS),
});

const questionUpdateSchema = z
  .object({
    id: z.string().uuid(),
    questionText: z.string().trim().min(1).max(MAX_QUESTION_TEXT_CHARS),
    options: z.array(optionSchema).max(MAX_OPTIONS).nullable(),
    correctAnswer: z.string().trim().min(1).max(MAX_ANSWER_CHARS),
    suggestedAnswer: z.string().trim().max(MAX_ANSWER_CHARS).nullable(),
    removeImage: z.boolean().optional(),
  })
  .refine(
    (q) => {
      if (!q.options) return true;
      const labels = q.options.map((o) => o.label.toUpperCase());
      return labels.includes(q.correctAnswer.trim().toUpperCase());
    },
    {
      message: 'correctAnswer must match one of the option labels',
      path: ['correctAnswer'],
    },
  )
  .refine(
    (q) => {
      if (!q.options) return true;
      const labels = q.options.map((o) => o.label.toUpperCase());
      return new Set(labels).size === labels.length;
    },
    {
      message: 'Option labels must be unique',
      path: ['options'],
    },
  );

const parsedUpdates = z
  .string()
  .transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'updates must be valid JSON',
      });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(questionUpdateSchema)
      .min(1, 'Provide at least one update')
      .max(100, 'Too many updates in a single batch'),
  );

export const updateQuestionsSchema = z.object({
  updates: parsedUpdates,
});

export type QuestionOptionInput = z.infer<typeof optionSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type UpdateQuestionsInput = z.infer<typeof updateQuestionsSchema>;

export const QUESTION_TYPE_VALUES = QUESTION_TYPES;
