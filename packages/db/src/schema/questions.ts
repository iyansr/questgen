import { relations } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { questionSets } from './question-sets';

export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice',
  'true_false',
  'short_answer',
  'essay',
]);

export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    setId: uuid('set_id')
      .notNull()
      .references(() => questionSets.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    questionType: questionTypeEnum('question_type').notNull(),
    imageUrl: text('image_url'),
    suggestedAnswer: text('suggested_answer'),
    correctAnswer: text('correct_answer'),
    options: jsonb('options'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('questions_set_order_unique').on(table.setId, table.order),
  ],
);

export const questionsRelations = relations(questions, ({ one }) => ({
  questionSet: one(questionSets, {
    fields: [questions.setId],
    references: [questionSets.id],
  }),
}));
