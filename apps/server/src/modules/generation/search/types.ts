import type { ImageRef } from '@/modules/processing/chunker';

export type SubQuery = { query: string; rationale?: string };

export type RetrievedChunk = {
  id: string;
  text: string;
  score: number;
  imageRefs: ImageRef[];
};

export type PerQueryTrace = {
  query: string;
  chunkIds: string[];
  scores: number[];
};

export type MultiQueryResult = {
  chunks: RetrievedChunk[];
  imageRefs: ImageRef[];
  perQueryTrace: PerQueryTrace[];
  coverage: {
    uniqueChunkCount: number;
    avgScore: number;
    minScore: number;
  };
};

export type RetrievalTrace = {
  topic: string;
  source: 'document' | 'web';
  expandedQueries: SubQuery[];
  perQuery: Array<{
    query: string;
    chunkIds: string[];
    scores: number[];
  }>;
  uniqueChunkIds: string[];
  imageRefIds: string[];
  coverage: { uniqueChunkCount: number; avgScore: number; minScore: number };
  startedAt: string;
  completedAt: string;
};
