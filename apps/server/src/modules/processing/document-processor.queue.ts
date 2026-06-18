import { createDb } from '@questgen/db';
import { documents, questionSets } from '@questgen/db/schema';
import { env } from '@questgen/env/server';
import { eq } from 'drizzle-orm';

import {
	type GenerationConfig,
	generateQuestionsInBackground,
} from '@/modules/generation/generation.service';

import { captionImages } from './captioner';
import { getOrCreateCollection } from './chroma';
import { chunkText } from './chunker';
import { embedTexts } from './embeddings';
import { uploadImageToR2 } from './images';
import { processDocument as ocrProcess } from './ocr';

type ProcessDocumentJob = {
	type: 'PROCESS_DOCUMENT';
	documentId: string;
	fileKey: string;
	fileType: 'pdf' | 'docx';
	sessionId: string;
	config: GenerationConfig;
};

type GenerateQuestionsJob = {
	type: 'GENERATE_QUESTIONS';
	sessionId: string;
	documentId: string;
	config: GenerationConfig;
};

type ResearchWebJob = {
	type: 'RESEARCH_WEB';
	sessionId: string;
	query: string;
	config: GenerationConfig;
};

export type DocumentJob =
	| ProcessDocumentJob
	| GenerateQuestionsJob
	| ResearchWebJob;

async function markSessionStatus(
	sessionId: string,
	status: 'generating' | 'completed' | 'failed',
	errorMessage?: string,
): Promise<void> {
	const db = createDb();
	await db
		.update(questionSets)
		.set({ status, errorMessage })
		.where(eq(questionSets.id, sessionId));
}

async function markDocumentStatus(
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

async function generateForScope(
	sessionId: string,
	scopeId: string,
	config: GenerationConfig,
): Promise<void> {
	await markSessionStatus(sessionId, 'generating');
	await generateQuestionsInBackground(sessionId, scopeId, config);
	await markSessionStatus(sessionId, 'completed');
}

export async function processDocument(
	message: Message<DocumentJob>,
): Promise<void> {
	const job = message.body;

	if (job.type === 'GENERATE_QUESTIONS') {
		await processGenerateQuestions(job);
		return;
	}

	if (job.type === 'RESEARCH_WEB') {
		await processResearchWeb(job);
		return;
	}

	await processProcessDocument(job);
}

async function processGenerateQuestions(
	job: GenerateQuestionsJob,
): Promise<void> {
	const { sessionId, documentId, config } = job;
	const db = createDb();

	try {
		const [doc] = await db
			.select({ id: documents.id, status: documents.status })
			.from(documents)
			.where(eq(documents.id, documentId))
			.limit(1);

		if (!doc) {
			throw new Error(`Document not found: ${documentId}`);
		}

		if (doc.status !== 'ready') {
			throw new Error(`Document is not ready: ${documentId} (${doc.status})`);
		}

		await generateForScope(sessionId, documentId, {
			...config,
			source: 'document',
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		await markSessionStatus(sessionId, 'failed', errorMessage);
		throw error;
	}
}

async function processResearchWeb(job: ResearchWebJob): Promise<void> {
	const { sessionId, config, query } = job;

	try {
		await generateForScope(sessionId, sessionId, {
			...config,
			topic: query || config.topic,
			source: 'web',
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		await markSessionStatus(sessionId, 'failed', errorMessage);
		throw error;
	}
}

async function processProcessDocument(job: ProcessDocumentJob): Promise<void> {
	const { documentId, fileKey, sessionId, config } = job;

	try {
		const file = await env.DOCUMENTS_BUCKET.get(fileKey);
		if (!file) {
			throw new Error(`File not found in R2: ${fileKey}`);
		}

		const fileBytes = await file.arrayBuffer();
		const filename = fileKey.split('/').pop() ?? fileKey;

		const ocrResult = await ocrProcess(fileBytes, filename);

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
		await generateForScope(sessionId, documentId, {
			...config,
			source: 'document',
		});
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : 'Unknown error';
		await markDocumentStatus(documentId, 'failed', errorMessage);
		await markSessionStatus(sessionId, 'failed', errorMessage);
		throw error;
	}
}
