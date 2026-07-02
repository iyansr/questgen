import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers';

/**
 * No-op workflow for blackbox tests. Accepts create() calls without running
 * LLM/OCR pipelines. Session state is seeded via test fixtures instead.
 */
export class MockGenerationWorkflow extends WorkflowEntrypoint<Env, unknown> {
  async run(_event: WorkflowEvent<unknown>, _step: WorkflowStep) {
    // Intentionally empty — generation is not exercised in CI blackbox tests.
  }
}
