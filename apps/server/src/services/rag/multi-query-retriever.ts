import type { ImageRef } from '../../lib/chunker';
import { retrieveContextWithMeta } from '../../lib/rag';
import type {
	MultiQueryResult,
	PerQueryTrace,
	RetrievedChunk,
	SubQuery,
} from './types';

const TOPK = {
	document: { min: 8, max: 20 },
	web: { min: 5, max: 12 },
} as const;

const MAX_DISTANCE = {
	document: 0.6,
	web: 0.7,
} as const;

const MIN_KEEP = 4;

export async function retrieveMultiQuery(
	subQueries: SubQuery[],
	scopeId: string,
	total: number,
	source: 'document' | 'web',
): Promise<MultiQueryResult> {
	const { min, max } = TOPK[source];
	const perQuery = Math.min(
		Math.max(Math.ceil((total * 2) / subQueries.length), min),
		max,
	);

	const perQueryRaw = await Promise.all(
		subQueries.map((q) => retrieveContextWithMeta(q.query, scopeId, perQuery)),
	);

	const perQueryTrace: PerQueryTrace[] = subQueries.map((q, i) => {
		const items = perQueryRaw[i]?.items;
		return {
			query: q.query,
			chunkIds: items.map((it) => it.id),
			scores: items.map((it) => it.score),
		};
	});

	const byId = new Map<string, RetrievedChunk>();
	for (const { items } of perQueryRaw) {
		for (const item of items) {
			const existing = byId.get(item.id);
			if (!existing || item.score < existing.score) {
				byId.set(item.id, item);
			}
		}
	}

	const sorted = Array.from(byId.values()).sort((a, b) => a.score - b.score);
	const threshold = MAX_DISTANCE[source];
	const filtered = sorted.filter((c) => c.score <= threshold);
	const chunks =
		filtered.length >= MIN_KEEP ? filtered : sorted.slice(0, MIN_KEEP);

	const imageRefsMap = new Map<string, ImageRef>();
	for (const c of chunks) {
		for (const ref of c.imageRefs) {
			if (!imageRefsMap.has(ref.id)) imageRefsMap.set(ref.id, ref);
		}
	}

	const coverage = {
		uniqueChunkCount: chunks.length,
		avgScore: chunks.length
			? chunks.reduce((s, c) => s + c.score, 0) / chunks.length
			: 1,
		minScore: chunks.length ? chunks[0]?.score : 1,
	};

	return {
		chunks,
		imageRefs: Array.from(imageRefsMap.values()),
		perQueryTrace,
		coverage,
	};
}
