import { relations } from 'drizzle-orm';
import {
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

import { documents } from './documents';
import { questions } from './questions';
import { users } from './users';

export const questionSetStatusEnum = pgEnum('question_set_status', [
	'pending',
	'generating',
	'completed',
	'failed',
]);

export const questionSets = pgTable('question_sets', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	documentId: uuid('document_id').references(() => documents.id, {
		onDelete: 'set null',
	}),
	title: text('title').notNull(),
	status: questionSetStatusEnum('status').notNull().default('pending'),
	config: jsonb('config').notNull(),
	errorMessage: text('error_message'),
	createdAt: timestamp('created_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const questionSetsRelations = relations(
	questionSets,
	({ one, many }) => ({
		user: one(users, {
			fields: [questionSets.userId],
			references: [users.id],
		}),
		document: one(documents, {
			fields: [questionSets.documentId],
			references: [documents.id],
		}),
		questions: many(questions),
	}),
);
