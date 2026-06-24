import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { env } from '@questgen/env/server';

export const openai = createOpenAICompatible({
  baseURL: 'https://opencode.ai/zen/go/v1',
  apiKey: env.OPENCODE_API_KEY,
  name: 'opencode-go',
});
