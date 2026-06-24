import { env } from '@questgen/env/server';

export const MODELS = {
  GENERATION: env.QUESTGEN_GENERATION_MODEL ?? 'deepseek/deepseek-v4-flash',
  RESEARCH: env.QUESTGEN_RESEARCH_MODEL ?? 'deepseek/deepseek-v4-flash',
  RETRIEVAL: env.QUESTGEN_RETRIEVAL_MODEL ?? 'deepseek/deepseek-v4-flash',
  CAPTIONING: env.QUESTGEN_CAPTIONING_MODEL ?? 'deepseek/deepseek-v4-flash',
  TITLE: env.QUESTGEN_TITLE_MODEL ?? 'deepseek/deepseek-v4-flash',
  EMBEDDING: env.QUESTGEN_EMBEDDING_MODEL ?? 'openai/text-embedding-3-small',
} as const;

export const GENERATION_PARAMS = {
  GENERATION: {
    temperature: 0.7,
    topP: 0.9,
  },
  RESEARCH: {
    temperature: 0.3,
    topP: 0.9,
  },
} as const;
