import { env } from '@questgen/env/server';
import { ChromaClient, CloudClient } from 'chromadb';

let client: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (client) return client;

  if (env.CHROMA_URL) {
    const url = new URL(env.CHROMA_URL);
    client = new ChromaClient({
      host: url.hostname,
      port: Number(url.port) || (url.protocol === 'https:' ? 443 : 80),
      ssl: url.protocol === 'https:',
      tenant: env.CHROMA_TENANT,
      database: env.CHROMA_DATABASE,
    });
  } else {
    client = new CloudClient({
      apiKey: env.CHROMA_API_KEY,
      tenant: env.CHROMA_TENANT,
      database: env.CHROMA_DATABASE,
    });
  }

  return client;
}

export async function getOrCreateCollection() {
  const client = getChromaClient();
  return client.getOrCreateCollection({
    name: 'document_chunks',
    metadata: { 'hnsw:space': 'cosine' },
  });
}
