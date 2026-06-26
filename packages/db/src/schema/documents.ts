import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { DOCUMENT_FILE_TYPES } from '../document-types';
import { questionSets } from './question-sets';
import { users } from './users';

export const fileTypeEnum = pgEnum('file_type', DOCUMENT_FILE_TYPES);

export const documentStatusEnum = pgEnum('document_status', [
  'processing',
  'ready',
  'failed',
]);

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: fileTypeEnum('file_type').notNull(),
  status: documentStatusEnum('status').notNull().default('processing'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  questionSets: many(questionSets),
}));
