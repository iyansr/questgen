export { GenerationWorkflow } from '@/modules/processing/generation.workflow';
export { MockGenerationWorkflow } from '@/testing/mock-generation-workflow';
export { app } from './app';

import { app } from './app';

export default {
  fetch: app.fetch,
};
