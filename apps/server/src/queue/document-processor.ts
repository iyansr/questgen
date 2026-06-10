import { createDb } from '@questgen/db';
import { documents, questionSets } from '@questgen/db/schema';
import { env } from '@questgen/env/server';
import { eq } from 'drizzle-orm';

import { captionImages } from '../lib/captioner';
import { getOrCreateCollection } from '../lib/chroma';
import { chunkText } from '../lib/chunker';
import { embedTexts } from '../lib/embeddings';
import { uploadImageToR2 } from '../lib/images';
import { processDocument as ocrProcess } from '../lib/ocr';
import { researchWeb } from '../lib/tavily';
import {
	MAX_CHUNKS,
	MAX_OCR_IMAGES,
	MAX_OCR_MARKDOWN_CHARS,
} from '../lib/upload-limits';
import {
	type GenerationConfig,
	generateQuestionsInBackground,
} from '../services/generation.service';

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
	const { sessionId, query, config } = job;

	try {
		const { sections, images } = await researchWeb(query, sessionId);

		const totalChars = sections.reduce((sum, s) => sum + s.markdown.length, 0);
		if (totalChars > MAX_OCR_MARKDOWN_CHARS) {
			throw new Error(
				`Web research content too large (${totalChars} chars, max ${MAX_OCR_MARKDOWN_CHARS}). Refine your keyword.`,
			);
		}

		const chunkerImages = images.map((img) => ({
			id: img.id,
			r2Url: img.url,
			caption: img.caption,
			pageIndex: 0,
		}));

		const allChunks: Awaited<ReturnType<typeof chunkText>> = [];
		let chunkIndex = 0;
		for (const section of sections) {
			const sectionChunks = await chunkText(section.markdown, chunkerImages);
			for (const c of sectionChunks) {
				allChunks.push({ ...c, index: chunkIndex++ });
			}
		}

		if (allChunks.length > MAX_CHUNKS) {
			throw new Error(
				`Too many chunks (${allChunks.length}, max ${MAX_CHUNKS}).`,
			);
		}

		const embeddings = await embedTexts(allChunks.map((c) => c.text));
		const collection = await getOrCreateCollection();
		await collection.upsert({
			ids: allChunks.map((c) => `web-${sessionId}-${c.index}`),
			embeddings,
			documents: allChunks.map((c) => c.text),
			metadatas: allChunks.map((c) => ({
				scopeId: sessionId,
				chunkIndex: c.index,
				imageRefs: JSON.stringify(c.imageRefs),
			})),
		});

		await generateForScope(sessionId, sessionId, {
			...config,
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

		if (ocrResult.markdown.length > MAX_OCR_MARKDOWN_CHARS) {
			throw new Error(
				`Document content is too large after OCR (${ocrResult.markdown.length} chars, max ${MAX_OCR_MARKDOWN_CHARS}). Please upload a shorter document.`,
			);
		}

		if (ocrResult.images.length > MAX_OCR_IMAGES) {
			throw new Error(
				`Document has too many images (${ocrResult.images.length}, max ${MAX_OCR_IMAGES}). Please upload a document with fewer figures.`,
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

		if (chunks.length > MAX_CHUNKS) {
			throw new Error(
				`Document produced too many chunks (${chunks.length}, max ${MAX_CHUNKS}). Please upload a shorter document.`,
			);
		}

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
