import { createDb } from '@questgen/db';
import { documents, questionSets, questions } from '@questgen/db/schema';
import { env } from 'cloudflare:workers';

import { registerUser } from './auth';
import { readJson } from './http';

const DEFAULT_CONFIG = {
  topic: 'Aljabar Linear',
  questionTypeCounts: [{ type: 'multiple_choice' as const, count: 1 }],
  count: 1,
};

const DEFAULT_OPTIONS = [
  { label: 'A', text: '3' },
  { label: 'B', text: '4' },
  { label: 'C', text: '5' },
  { label: 'D', text: '6' },
];

export type CompletedSessionFixture = {
  token: string;
  userId: string;
  sessionId: string;
  questionId: string;
  title: string;
};

export async function seedCompletedSession(
  email: string,
  opts: { title?: string; questionText?: string } = {},
): Promise<CompletedSessionFixture> {
  const { body } = await registerUser(email);
  const userId = body.user.id;
  const title = opts.title ?? 'Aljabar Linear';
  const db = createDb();

  const [session] = await db
    .insert(questionSets)
    .values({
      userId,
      title,
      status: 'completed',
      config: { ...DEFAULT_CONFIG, topic: title },
    })
    .returning({ id: questionSets.id });

  if (!session) {
    throw new Error('Failed to seed session');
  }

  const [question] = await db
    .insert(questions)
    .values({
      setId: session.id,
      questionText: opts.questionText ?? 'Berapakah 2 + 2?',
      questionType: 'multiple_choice',
      correctAnswer: 'B',
      options: DEFAULT_OPTIONS,
      order: 0,
    })
    .returning({ id: questions.id });

  if (!question) {
    throw new Error('Failed to seed question');
  }

  return {
    token: body.token,
    userId,
    sessionId: session.id,
    questionId: question.id,
    title,
  };
}

export async function seedEmptyCompletedSession(email: string) {
  const { body } = await registerUser(email);
  const db = createDb();

  const [session] = await db
    .insert(questionSets)
    .values({
      userId: body.user.id,
      title: 'Kosong',
      status: 'completed',
      config: DEFAULT_CONFIG,
    })
    .returning({ id: questionSets.id });

  if (!session) {
    throw new Error('Failed to seed empty session');
  }

  return { token: body.token, sessionId: session.id };
}

export type ReadyDocumentFixture = {
  token: string;
  userId: string;
  documentId: string;
  fileKey: string;
};

export async function seedReadyDocument(
  email: string,
  content: Uint8Array | string = '%PDF-1.4 minimal test',
): Promise<ReadyDocumentFixture> {
  const { body } = await registerUser(email);
  const userId = body.user.id;
  const fileKey = `${userId}/fixtures/test-doc.pdf`;
  const bytes =
    typeof content === 'string' ? new TextEncoder().encode(content) : content;

  await env.DOCUMENTS_BUCKET.put(fileKey, bytes, {
    httpMetadata: { contentType: 'application/pdf' },
  });

  const db = createDb();
  const [doc] = await db
    .insert(documents)
    .values({
      userId,
      filename: 'test-doc.pdf',
      fileUrl: fileKey,
      fileType: 'pdf',
      status: 'ready',
    })
    .returning({ id: documents.id });

  if (!doc) {
    throw new Error('Failed to seed document');
  }

  return {
    token: body.token,
    userId,
    documentId: doc.id,
    fileKey,
  };
}

export async function seedProcessingDocument(email: string) {
  const { body } = await registerUser(email);
  const db = createDb();

  const [doc] = await db
    .insert(documents)
    .values({
      userId: body.user.id,
      filename: 'processing.pdf',
      fileUrl: `${body.user.id}/processing.pdf`,
      fileType: 'pdf',
      status: 'processing',
    })
    .returning({ id: documents.id });

  if (!doc) {
    throw new Error('Failed to seed processing document');
  }

  return { token: body.token, documentId: doc.id };
}

export async function seedDocumentMissingR2(email: string) {
  const { body } = await registerUser(email);
  const db = createDb();
  const fileKey = `${body.user.id}/missing-in-r2.pdf`;

  const [doc] = await db
    .insert(documents)
    .values({
      userId: body.user.id,
      filename: 'missing.pdf',
      fileUrl: fileKey,
      fileType: 'pdf',
      status: 'ready',
    })
    .returning({ id: documents.id });

  if (!doc) {
    throw new Error('Failed to seed document');
  }

  return { token: body.token, documentId: doc.id };
}

export async function putR2Image(key: string, bytes = new Uint8Array([137, 80, 78, 71])) {
  await env.DOCUMENTS_BUCKET.put(key, bytes, {
    httpMetadata: { contentType: 'image/png' },
  });
}

export async function getUserId(token: string): Promise<string> {
  const { api } = await import('./http');
  const res = await api('/api/auth/me', { token });
  const body = await readJson<{ user: { id: string } }>(res);
  return body.user.id;
}
