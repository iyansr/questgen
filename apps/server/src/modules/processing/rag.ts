import { getOrCreateCollection } from './chroma';
import type { ImageRef } from './chunker';
import { embedText } from './embeddings';
import { pickStratifiedIndices } from './stratified-sample';

export { pickStratifiedIndices } from './stratified-sample';

export interface RetrievedChunkMeta {
  id: string;
  text: string;
  score: number;
  imageRefs: ImageRef[];
}

export interface RetrievedContextWithMeta {
  items: RetrievedChunkMeta[];
}

export type ScopeChunk = {
  id: string;
  text: string;
  chunkIndex: number;
};

const DEFAULT_SAMPLE_SIZE = 12;
const SAMPLE_TEXT_LIMIT = 1000;

function parseImageRefs(meta: Record<string, unknown> | null): ImageRef[] {
  if (!meta) return [];
  const raw = meta.imageRefs as string | undefined;
  if (!raw) return [];
  return JSON.parse(raw) as ImageRef[];
}

export async function listScopeChunks(scopeId: string): Promise<ScopeChunk[]> {
  const collection = await getOrCreateCollection();
  const results = await collection.get({
    where: { scopeId },
    include: ['documents', 'metadatas'],
  });

  const chunks: ScopeChunk[] = [];
  const ids = results.ids ?? [];
  const docs = results.documents ?? [];
  const metadatas = results.metadatas ?? [];

  for (let i = 0; i < ids.length; i++) {
    const doc = docs[i];
    if (!doc) continue;
    const meta = metadatas[i] as Record<string, unknown> | null;
    const chunkIndex =
      typeof meta?.chunkIndex === 'number'
        ? meta.chunkIndex
        : Number(meta?.chunkIndex ?? i);
    chunks.push({
      id: ids[i]!,
      text: doc,
      chunkIndex: Number.isFinite(chunkIndex) ? chunkIndex : i,
    });
  }

  return chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
}

/** Stratified sample of document chunks (evenly spaced by chunkIndex). */
export async function sampleStratifiedChunks(
  scopeId: string,
  n = DEFAULT_SAMPLE_SIZE,
): Promise<string[]> {
  const chunks = await listScopeChunks(scopeId);
  if (chunks.length === 0) return [];

  const indices = pickStratifiedIndices(chunks.length, n);
  return indices.map((i) => {
    const text = chunks[i]?.text ?? '';
    return text.length > SAMPLE_TEXT_LIMIT
      ? text.slice(0, SAMPLE_TEXT_LIMIT)
      : text;
  });
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

    const meta = metadatas[i] as Record<string, unknown> | null;
    items.push({
      id: ids[i]!,
      text: doc,
      score: distances[i] ?? 1,
      imageRefs: parseImageRefs(meta),
    });
  }

  return { items };
}
