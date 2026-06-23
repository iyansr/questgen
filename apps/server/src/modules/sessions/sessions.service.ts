import type { createDb } from '@questgen/db';
import { documents, questionSets, questions } from '@questgen/db/schema';
import { env } from '@questgen/env/server';
import { and, count, desc, eq, ilike, type SQL } from 'drizzle-orm';

import {
	MAX_FILE_SIZE_BYTES,
	MAX_FILE_SIZE_MB,
	MAX_WEB_QUERY_CHARS,
	MIN_WEB_QUERY_CHARS,
} from '@/shared/lib/upload-limits';

import {
	type QuestionTypeCount,
	type SessionStatus,
	totalCount,
} from './sessions.schema';

const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export class SessionValidationError extends Error {
	constructor(
		message: string,
		public readonly status: 400 | 404 | 500 = 400,
	) {
		super(message);
		this.name = 'SessionValidationError';
	}
}

export type CreateSessionInput = {
	topic: string;
	questionTypeCounts: QuestionTypeCount[];
	file?: File;
	documentId?: string;
	webQuery?: string;
	curriculum?: string;
	grade?: string;
	classGrade?: string;
};

export type CreateSessionResult = {
	id: string;
};

export async function createSession(
	db: ReturnType<typeof createDb>,
	userId: string,
	input: CreateSessionInput,
): Promise<CreateSessionResult> {
	const {
		topic,
		questionTypeCounts,
		file,
		documentId,
		webQuery,
		curriculum,
		grade,
		classGrade,
	} = input;
	const count = totalCount(questionTypeCounts);

	if (documentId) {
		return createSessionFromDocument(db, userId, {
			documentId,
			topic,
			questionTypeCounts,
			count,
			curriculum,
			grade,
			classGrade,
		});
	}

	if (webQuery) {
		return createSessionFromWebQuery(db, userId, {
			webQuery,
			topic,
			questionTypeCounts,
			count,
			curriculum,
			grade,
			classGrade,
		});
	}

	if (!file) {
		throw new SessionValidationError('Provide a file, documentId, or webQuery');
	}

	if (
		!ALLOWED_MIME_TYPES.includes(
			file.type as (typeof ALLOWED_MIME_TYPES)[number],
		)
	) {
		throw new SessionValidationError(
			'Invalid file type. Only PDF and DOCX are supported.',
		);
	}

	if (file.size > MAX_FILE_SIZE_BYTES) {
		throw new SessionValidationError(
			`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
		);
	}

	const fileType: 'pdf' | 'docx' =
		file.type === 'application/pdf' ? 'pdf' : 'docx';

	let fileBuffer: ArrayBuffer | null = null;
	if (fileType === 'pdf') {
		fileBuffer = await file.arrayBuffer();
	}

	const fileKey = `${userId}/${Date.now()}-${file.name}`;

	try {
		await env.DOCUMENTS_BUCKET.put(fileKey, fileBuffer ?? file.stream(), {
			httpMetadata: { contentType: file.type },
		});
	} catch (err) {
		console.error('Failed to upload file to R2:', err);
		throw new SessionValidationError('Failed to upload file', 500);
	}

	const [doc] = await db
		.insert(documents)
		.values({
			userId,
			filename: file.name,
			fileUrl: fileKey,
			fileType,
			status: 'processing',
		})
		.returning({ id: documents.id });

	if (!doc) {
		await env.DOCUMENTS_BUCKET.delete(fileKey);
		throw new SessionValidationError('Failed to create document', 500);
	}

	const [session] = await db
		.insert(questionSets)
		.values({
			userId,
			documentId: doc.id,
			title: topic,
			status: 'pending',
			config: {
				topic,
				questionTypeCounts,
				count,
				curriculum,
				grade,
				classGrade,
			},
		})
		.returning({ id: questionSets.id });

	if (!session) {
		await env.DOCUMENTS_BUCKET.delete(fileKey);
		throw new SessionValidationError('Failed to create session', 500);
	}

	await env.GENERATION_WORKFLOW.create({
		id: session.id,
		params: {
			type: 'PROCESS_DOCUMENT',
			documentId: doc.id,
			fileKey,
			fileType,
			sessionId: session.id,
			config: {
				topic,
				questionTypeCounts,
				count,
				curriculum,
				grade,
				classGrade,
			},
		},
	});

	return { id: session.id };
}

type CreateSessionFromWebQueryInput = {
	webQuery: string;
	topic: string;
	questionTypeCounts: QuestionTypeCount[];
	count: number;
	curriculum?: string;
	grade?: string;
	classGrade?: string;
};

async function createSessionFromWebQuery(
	db: ReturnType<typeof createDb>,
	userId: string,
	input: CreateSessionFromWebQueryInput,
): Promise<CreateSessionResult> {
	const {
		webQuery,
		topic,
		questionTypeCounts,
		count,
		curriculum,
		grade,
		classGrade,
	} = input;

	const trimmed = webQuery.trim();
	if (
		trimmed.length < MIN_WEB_QUERY_CHARS ||
		trimmed.length > MAX_WEB_QUERY_CHARS
	) {
		throw new SessionValidationError(
			`Web query must be ${MIN_WEB_QUERY_CHARS}-${MAX_WEB_QUERY_CHARS} characters`,
		);
	}

	const [session] = await db
		.insert(questionSets)
		.values({
			userId,
			documentId: null,
			title: topic,
			status: 'pending',
			config: {
				topic,
				questionTypeCounts,
				count,
				webQuery: trimmed,
				curriculum,
				grade,
				classGrade,
			},
		})
		.returning({ id: questionSets.id });

	if (!session)
		throw new SessionValidationError('Failed to create session', 500);

	await env.GENERATION_WORKFLOW.create({
		id: session.id,
		params: {
			type: 'RESEARCH_WEB',
			sessionId: session.id,
			query: trimmed,
			config: {
				topic,
				questionTypeCounts,
				count,
				curriculum,
				grade,
				classGrade,
			},
		},
	});

	return { id: session.id };
}

type CreateSessionFromDocumentInput = {
	documentId: string;
	topic: string;
	questionTypeCounts: QuestionTypeCount[];
	count: number;
	curriculum?: string;
	grade?: string;
	classGrade?: string;
};

async function createSessionFromDocument(
	db: ReturnType<typeof createDb>,
	userId: string,
	input: CreateSessionFromDocumentInput,
): Promise<CreateSessionResult> {
	const {
		documentId,
		topic,
		questionTypeCounts,
		count,
		curriculum,
		grade,
		classGrade,
	} = input;

	const [doc] = await db
		.select({ id: documents.id, filename: documents.filename })
		.from(documents)
		.where(
			and(
				eq(documents.id, documentId),
				eq(documents.userId, userId),
				eq(documents.status, 'ready'),
			),
		)
		.limit(1);

	if (!doc) {
		throw new SessionValidationError('Document not found or not ready', 404);
	}

	const [session] = await db
		.insert(questionSets)
		.values({
			userId,
			documentId: doc.id,
			title: topic,
			status: 'pending',
			config: {
				topic,
				questionTypeCounts,
				count,
				curriculum,
				grade,
				classGrade,
			},
		})
		.returning({ id: questionSets.id });

	if (!session) {
		throw new SessionValidationError('Failed to create session', 500);
	}

	await env.GENERATION_WORKFLOW.create({
		id: session.id,
		params: {
			type: 'GENERATE_QUESTIONS',
			sessionId: session.id,
			documentId: doc.id,
			config: {
				topic,
				questionTypeCounts,
				count,
				curriculum,
				grade,
				classGrade,
			},
		},
	});

	return { id: session.id };
}

export type SessionWithQuestions = Awaited<
	ReturnType<typeof getSessionWithQuestions>
>;

export async function getSessionWithQuestions(
	db: ReturnType<typeof createDb>,
	userId: string,
	id: string,
) {
	const [session] = await db
		.select()
		.from(questionSets)
		.where(and(eq(questionSets.id, id), eq(questionSets.userId, userId)));

	if (!session) {
		throw new SessionValidationError('Session not found', 404);
	}

	const sessionQuestions = await db
		.select()
		.from(questions)
		.where(eq(questions.setId, id))
		.orderBy(questions.order);

	return { ...session, questions: sessionQuestions };
}

export type SessionListItem = {
	id: string;
	userId: string;
	documentId: string | null;
	title: string;
	status: string;
	config: unknown;
	errorMessage: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type SessionListFilters = {
	status?: SessionStatus;
	search?: string;
};

export type SessionListResult = {
	items: SessionListItem[];
	total: number;
	page: number;
	limit: number;
};

export async function listSessions(
	db: ReturnType<typeof createDb>,
	userId: string,
	page: number,
	limit: number,
	filters: SessionListFilters = {},
): Promise<SessionListResult> {
	const offset = (page - 1) * limit;

	const conditions: SQL[] = [eq(questionSets.userId, userId)];
	if (filters.status) {
		conditions.push(eq(questionSets.status, filters.status));
	}
	if (filters.search) {
		conditions.push(ilike(questionSets.title, `%${filters.search}%`));
	}
	const whereClause = and(...conditions);

	const [totalRow] = await db
		.select({ total: count() })
		.from(questionSets)
		.where(whereClause);

	const items = await db
		.select()
		.from(questionSets)
		.where(whereClause)
		.orderBy(desc(questionSets.createdAt))
		.limit(limit)
		.offset(offset);

	return {
		items: items as SessionListItem[],
		total: totalRow?.total ?? 0,
		page,
		limit,
	};
}
