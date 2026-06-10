import { getOrCreateCollection } from './chroma';
import type { ImageRef } from './chunker';
import { embedText } from './embeddings';

export interface RetrievedContext {
	text: string;
	imageRefs: ImageRef[];
}

export interface RetrievedChunkMeta {
	id: string;
	text: string;
	score: number;
	imageRefs: ImageRef[];
}

export interface RetrievedContextWithMeta {
	items: RetrievedChunkMeta[];
}

export async function retrieveContext(
	topic: string,
	scopeId: string,
	topK = 5,
): Promise<RetrievedContext> {
	const queryEmbedding = await embedText(topic);
	const collection = await getOrCreateCollection();

	const results = await collection.query({
		queryEmbeddings: [queryEmbedding],
		nResults: topK,
		where: { scopeId },
	});

	const text = (results.documents[0] ?? [])
		.filter((d): d is string => d !== null)
		.join('\n\n');

	const imageRefsMap = new Map<string, ImageRef>();
	for (const meta of results.metadatas[0] ?? []) {
		if (!meta) continue;
		const raw = meta.imageRefs as string | undefined;
		if (!raw) continue;
		const refs = JSON.parse(raw) as ImageRef[];
		for (const ref of refs) {
			if (!imageRefsMap.has(ref.id)) {
				imageRefsMap.set(ref.id, ref);
			}
		}
	}

	return { text, imageRefs: Array.from(imageRefsMap.values()) };
}

export async function retrieveContextWithMeta(
	topic: string,
	scopeId: string,
	topK = 5,
): Promise<RetrievedContextWithMeta> {
	const queryEmbedding = await embedText(topic);
	const collection = await getOrCreateCollection();

	const results = await collection.query({
		queryEmbeddings: [queryEmbedding],
		nResults: topK,
		where: { scopeId },
	});

	const ids = results.ids[0] ?? [];
	const docs = results.documents[0] ?? [];
	const distances = results.distances[0] ?? [];
	const metadatas = results.metadatas[0] ?? [];

	const items: RetrievedChunkMeta[] = [];
	for (let i = 0; i < ids.length; i++) {
		const doc = docs[i];
		if (!doc) continue;

		const meta = metadatas[i];
		const imageRefs: ImageRef[] = [];
		if (meta) {
			const raw = meta.imageRefs as string | undefined;
			if (raw) {
				const refs = JSON.parse(raw) as ImageRef[];
				for (const ref of refs) {
					imageRefs.push(ref);
				}
			}
		}

		items.push({
			id: ids[i]!,
			text: doc,
			score: distances[i] ?? 1,
			imageRefs,
		});
	}

	return { items };
}
