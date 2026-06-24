import type { createDb } from '@questgen/db';
import { questionSets, questions } from '@questgen/db/schema';
import { env } from '@questgen/env/server';
import { and, eq, inArray } from 'drizzle-orm';

import { buildImagePublicUrl } from '@/shared/lib/images';

import type { QuestionUpdateInput } from './questions.schema';
import { SessionValidationError } from './sessions.service';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const MAX_QUESTION_IMAGE_BYTES = 10 * 1024 * 1024;

type UploadedImageRef = {
  questionId: string;
  key: string;
  publicUrl: string;
};

type ImageAssignment = {
  questionId: string;
  file: File;
};

function randomImageId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export type UpdateQuestionsResult = {
  updated: number;
  imagesUploaded: number;
  imagesRemoved: number;
};

export async function updateQuestions(
  db: ReturnType<typeof createDb>,
  userId: string,
  sessionId: string,
  updates: QuestionUpdateInput[],
  images: ImageAssignment[] = [],
): Promise<UpdateQuestionsResult> {
  if (updates.length === 0 && images.length === 0) {
    throw new SessionValidationError('No updates provided', 400);
  }

  const [session] = await db
    .select({ id: questionSets.id })
    .from(questionSets)
    .where(and(eq(questionSets.id, sessionId), eq(questionSets.userId, userId)))
    .limit(1);

  if (!session) {
    throw new SessionValidationError('Session not found', 404);
  }

  const questionIds = updates.map((u) => u.id);

  const existing = await db
    .select({
      id: questions.id,
      setId: questions.setId,
      imageUrl: questions.imageUrl,
    })
    .from(questions)
    .where(inArray(questions.id, questionIds));

  if (existing.length !== new Set(questionIds).size) {
    throw new SessionValidationError('One or more questions do not exist', 404);
  }

  const wrongSet = existing.find((q) => q.setId !== sessionId);
  if (wrongSet) {
    throw new SessionValidationError(
      'Question does not belong to this session',
      400,
    );
  }

  const validIds = new Set(existing.map((q) => q.id));
  for (const assignment of images) {
    if (!validIds.has(assignment.questionId)) {
      throw new SessionValidationError(
        `Image for unknown question: ${assignment.questionId}`,
        400,
      );
    }
  }

  const uploaded: UploadedImageRef[] = [];
  for (const assignment of images) {
    const file = assignment.file;
    const mime = file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime)) {
      await rollbackUploads(uploaded);
      throw new SessionValidationError(
        `Invalid image type: ${file.type}. Allowed: png, jpeg, webp, gif`,
        400,
      );
    }
    if (file.size > MAX_QUESTION_IMAGE_BYTES) {
      await rollbackUploads(uploaded);
      throw new SessionValidationError(
        `Image too large. Maximum is ${MAX_QUESTION_IMAGE_BYTES / 1024 / 1024}MB.`,
        400,
      );
    }
    const ext = IMAGE_EXTENSIONS[mime] ?? 'bin';
    const imageId = `${randomImageId()}.${ext}`;
    const key = `documents/${sessionId}/images/${imageId}`;
    const body = await file.arrayBuffer();
    try {
      await env.DOCUMENTS_BUCKET.put(key, body, {
        httpMetadata: { contentType: mime },
      });
    } catch (err) {
      console.error('Failed to upload question image to R2:', err);
      await rollbackUploads(uploaded);
      throw new SessionValidationError('Failed to upload image', 500);
    }
    uploaded.push({
      questionId: assignment.questionId,
      key,
      publicUrl: buildImagePublicUrl(key),
    });
  }

  const imageByQuestionId = new Map(uploaded.map((u) => [u.questionId, u]));

  const keysToRemove: string[] = [];
  for (const update of updates) {
    const prev = existing.find((q) => q.id === update.id);
    if (!prev?.imageUrl) continue;
    if (update.removeImage || imageByQuestionId.has(update.id)) {
      const key = extractR2Key(prev.imageUrl);
      if (key) keysToRemove.push(key);
    }
  }

  try {
    await db.transaction(async (tx) => {
      for (let i = 0; i < updates.length; i++) {
        const update = updates[i]!;
        const uploadedRef = imageByQuestionId.get(update.id);
        const nextImageUrl = uploadedRef
          ? uploadedRef.publicUrl
          : update.removeImage
            ? null
            : undefined;

        await tx
          .update(questions)
          .set({
            questionText: update.questionText,
            options: update.options,
            correctAnswer: update.correctAnswer,
            suggestedAnswer: update.suggestedAnswer,
            ...(nextImageUrl !== undefined ? { imageUrl: nextImageUrl } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(eq(questions.id, update.id), eq(questions.setId, sessionId)),
          );
      }
    });
  } catch (err) {
    console.error('Failed to update questions:', err);
    await rollbackUploads(uploaded);
    throw new SessionValidationError('Failed to update questions', 500);
  }

  for (const key of keysToRemove) {
    try {
      await env.DOCUMENTS_BUCKET.delete(key);
    } catch (err) {
      console.warn('Failed to delete old image from R2:', err);
    }
  }

  return {
    updated: updates.length,
    imagesUploaded: uploaded.length,
    imagesRemoved: keysToRemove.length,
  };
}

async function rollbackUploads(uploaded: UploadedImageRef[]) {
  for (const ref of uploaded) {
    try {
      await env.DOCUMENTS_BUCKET.delete(ref.key);
    } catch {}
  }
}

function extractR2Key(publicUrl: string): string | null {
  try {
    const u = new URL(publicUrl);
    let pathname = u.pathname.replace(/^\/+/, '');
    if (pathname.startsWith('files/')) {
      pathname = pathname.slice('files/'.length);
    }
    return pathname || null;
  } catch {
    return null;
  }
}

export async function collectImageAssignments(
  formData: FormData,
  updates: QuestionUpdateInput[],
): Promise<ImageAssignment[]> {
  const assignments: ImageAssignment[] = [];
  const updateIds = new Set(updates.map((u) => u.id));

  for (const [fieldName, value] of formData.entries()) {
    if (!fieldName.startsWith('image_')) continue;
    if (typeof value === 'string') continue;
    const questionId = fieldName.slice('image_'.length);
    if (!updateIds.has(questionId)) continue;
    assignments.push({ questionId, file: value });
  }

  return assignments;
}
