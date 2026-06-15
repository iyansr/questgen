import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { env } from '@questgen/env/server';
import { embed, embedMany } from 'ai';

import { MODELS } from '../config/models';

const openrouter = createOpenRouter({
	apiKey: env.OPENROUTER_API_KEY,
});

const embeddingModel = openrouter.textEmbeddingModel(MODELS.EMBEDDING);

export async function embedText(text: string): Promise<number[]> {
	const { embedding } = await embed({
		model: embeddingModel,
		value: text,
		experimental_telemetry: {
			isEnabled: true,
			functionId: 'embed-text',
		},
	});
	return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
	const { embeddings } = await embedMany({
		model: embeddingModel,
		values: texts,
		experimental_telemetry: {
			isEnabled: true,
			functionId: 'embed-batch',
		},
	});
	return embeddings;
}
