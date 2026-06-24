import { getOrCreateCollection } from './chroma';
import type { ImageRef } from './chunker';
import { embedText } from './embeddings';

export interface RetrievedChunkMeta {
  id: string;
  text: string;
  score: number;
  imageRefs: ImageRef[];
}

export interface RetrievedContextWithMeta {
  items: RetrievedChunkMeta[];
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
