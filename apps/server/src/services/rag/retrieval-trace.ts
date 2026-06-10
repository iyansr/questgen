import type { MultiQueryResult, RetrievalTrace, SubQuery } from './types';

export function buildTrace(input: {
	topic: string;
	source: 'document' | 'web';
	expandedQueries: SubQuery[];
	multiQueryResult: MultiQueryResult;
	startedAt: Date;
}): RetrievalTrace {
	return {
		topic: input.topic,
		source: input.source,
		expandedQueries: input.expandedQueries,
		perQuery: input.multiQueryResult.perQueryTrace,
		uniqueChunkIds: input.multiQueryResult.chunks.map((c) => c.id).slice(0, 50),
		imageRefIds: input.multiQueryResult.imageRefs.map((r) => r.id),
		coverage: input.multiQueryResult.coverage,
		startedAt: input.startedAt.toISOString(),
		completedAt: new Date().toISOString(),
	};
}
