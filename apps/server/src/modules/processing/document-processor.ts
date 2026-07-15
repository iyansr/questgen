import { createDb } from '@questgen/db';
import type { DocumentFileType } from '@questgen/db/document-types';
import { documents, questionSets } from '@questgen/db/schema';
import { env } from '@questgen/env/server';
import { eq } from 'drizzle-orm';

import {
  type GenerationConfig,
  generateQuestionsInBackground,
} from '@/modules/generation/generation.service';
import { generateSessionTitle } from '@/modules/generation/title.service';
import { canUseR2PresignedOcr, isLocalOcrMode } from '@/shared/lib/ocr-mode';
import { flushTracing, initTracing } from '@/shared/lib/tracing';
import { MAX_PDF_PAGES } from '@/shared/lib/upload-limits';

import { captionImages } from './captioner';
import { getOrCreateCollection } from './chroma';
import { chunkText } from './chunker';
import { embedTexts } from './embeddings';
import { uploadImageToR2 } from './images';
import { processDocument as ocrProcess } from './ocr';
import { createR2PresignedGetUrl } from './r2-presigned-url';
import { NonRetryableError } from 'cloudflare:workflows';

/**
 * Config as carried in the workflow payload: everything except `source`, which
 * each job type injects at generation time. `count` is a denormalized total
 * persisted alongside the session config.
 */
type JobConfig = Omit<GenerationConfig, 'source'> & { count?: number };

type ProcessDocumentJob = {
  type: 'PROCESS_DOCUMENT';
  documentId: string;
  fileKey: string;
  fileType: DocumentFileType;
  sessionId: string;
  config: JobConfig;
};

type GenerateQuestionsJob = {
  type: 'GENERATE_QUESTIONS';
  sessionId: string;
  documentId: string;
  config: JobConfig;
};

type ResearchWebJob = {
  type: 'RESEARCH_WEB';
  sessionId: string;
  query: string;
  config: JobConfig;
};

export type DocumentJob =
  | ProcessDocumentJob
  | GenerateQuestionsJob
  | ResearchWebJob;

export async function markSessionStatus(
  sessionId: string,
  status: 'generating' | 'completed' | 'failed',
  errorMessage?: string,
): Promise<void> {
  const db = createDb();
  await db
    .update(questionSets)
    .set({ status, errorMessage, updatedAt: new Date() })
    .where(eq(questionSets.id, sessionId));
}

export async function markDocumentStatus(
  documentId: string,
  status: 'ready' | 'failed',
  errorMessage?: string,
): Promise<void> {
  const db = createDb();
  await db
    .update(documents)
    .set({ status, errorMessage, updatedAt: new Date() })
    .where(eq(documents.id, documentId));
}

/**
 * Asserts a document has finished OCR/embedding and is ready to generate from.
 * Throws a NonRetryableError because a missing or non-ready document is a
 * permanent condition — retrying the step would never succeed.
 */
export async function assertDocumentReady(documentId: string): Promise<void> {
  const db = createDb();
  const [doc] = await db
    .select({ id: documents.id, status: documents.status })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);

  if (!doc) {
    throw new NonRetryableError(`Document not found: ${documentId}`);
  }
  if (doc.status !== 'ready') {
    throw new NonRetryableError(
      `Document is not ready: ${documentId} (${doc.status})`,
    );
  }
}

/**
 * OCR → image upload → captioning → chunk → embed → vector upsert.
 * Side effects only (R2, Chroma, documents table); returns nothing so it stays
 * well under the 1 MiB Workflow step-return limit. Marks the document `ready`
 * on success. Generation runs as a separate step afterwards.
 */
export async function runDocumentPipeline(
  job: ProcessDocumentJob,
): Promise<void> {
  const { documentId, fileKey } = job;

  initTracing();
  try {
    const useR2PresignedOcr = !isLocalOcrMode() && canUseR2PresignedOcr();
    const filename = fileKey.split('/').pop() ?? fileKey;

    let ocrResult: Awaited<ReturnType<typeof ocrProcess>>;

    if (useR2PresignedOcr) {
      const head = await env.DOCUMENTS_BUCKET.head(fileKey);
      if (!head) {
        throw new Error(`File not found in R2: ${fileKey}`);
      }

      const documentUrl = await createR2PresignedGetUrl(fileKey);
      ocrResult = await ocrProcess({ mode: 'url', documentUrl });
    } else {
      const file = await env.DOCUMENTS_BUCKET.get(fileKey);
      if (!file) {
        throw new Error(`File not found in R2: ${fileKey}`);
      }

      const fileBytes = await file.arrayBuffer();
      ocrResult = await ocrProcess({ mode: 'bytes', fileBytes, filename });
    }

    if (ocrResult.pageCount > MAX_PDF_PAGES) {
      throw new NonRetryableError(
        `Document too long. Maximum is ${MAX_PDF_PAGES} pages.`,
      );
    }

    const uploadedImages = await Promise.all(
      ocrResult.images.map((img) =>
        uploadImageToR2(documentId, img.id, img.base64),
      ),
    );

    const captions = await captionImages(
      ocrResult.images.map((img) => ({ id: img.id, base64: img.base64 })),
    );

    const chunkerImages = uploadedImages.map((img, i) => ({
      id: img.id,
      r2Url: img.publicUrl,
      caption: captions.get(img.id) ?? '',
      pageIndex: ocrResult.images[i]?.pageIndex ?? 0,
    }));
    const chunks = await chunkText(ocrResult.markdown, chunkerImages);

    const embeddings = await embedTexts(chunks.map((c) => c.text));

    const collection = await getOrCreateCollection();
    await collection.upsert({
      ids: chunks.map((c) => `${documentId}-${c.index}`),
      embeddings,
      documents: chunks.map((c) => c.text),
      metadatas: chunks.map((c) => ({
        scopeId: documentId,
        chunkIndex: c.index,
        imageRefs: JSON.stringify(c.imageRefs),
      })),
    });

    await markDocumentStatus(documentId, 'ready');
  } finally {
    await flushTracing();
  }
}

/**
 * The atomic generation step: retrieval (document/web) + streamed LLM
 * generation + batched insert into the questions table. Cannot be resumed
 * mid-stream, so it re-runs in full on retry — the insert is idempotent via
 * onConflictDoNothing on [setId, order].
 */
export async function runGeneration(job: DocumentJob): Promise<void> {
  initTracing();
  try {
    if (job.type === 'RESEARCH_WEB') {
      await generateQuestionsInBackground(job.sessionId, job.sessionId, {
        ...job.config,
        topic: job.query || job.config.topic,
        source: 'web',
      });
    } else {
      await generateQuestionsInBackground(job.sessionId, job.documentId, {
        ...job.config,
        source: 'document',
      });
    }
  } finally {
    await flushTracing();
  }
}

/**
 * Generates a short title from the produced questions and persists it. Runs
 * after generation completes, replacing the temporary topic-based title.
 */
export async function runTitleGeneration(job: DocumentJob): Promise<void> {
  const topic =
    job.type === 'RESEARCH_WEB'
      ? job.query || job.config.topic
      : job.config.topic;

  initTracing();
  try {
    await generateSessionTitle(job.sessionId, {
      topic,
      curriculum: job.config.curriculum,
      grade: job.config.grade,
      classGrade: job.config.classGrade,
    });
  } finally {
    await flushTracing();
  }
}
