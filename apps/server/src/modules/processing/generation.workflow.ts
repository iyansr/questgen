import {
	assertDocumentReady,
	type DocumentJob,
	markDocumentStatus,
	markSessionStatus,
	runDocumentPipeline,
	runGeneration,
	runTitleGeneration,
} from './document-processor';
import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from 'cloudflare:workers';

const PIPELINE_RETRIES = {
	retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' },
	timeout: '15 minutes',
} as const;

const GENERATION_RETRIES = {
	retries: { limit: 2, delay: '15 seconds', backoff: 'exponential' },
	timeout: '15 minutes',
} as const;

const TITLE_RETRIES = {
	retries: { limit: 1, delay: '5 seconds', backoff: 'exponential' },
	timeout: '2 minutes',
} as const;

/**
 * Durable generation pipeline. Each step.do() checkpoints its result, so a
 * restart, redeploy, or crash resumes from the last completed step instead of
 * re-running from scratch. Replaces the previous fire-and-forget queue consumer.
 */
export class GenerationWorkflow extends WorkflowEntrypoint<Env, DocumentJob> {
	async run(event: WorkflowEvent<DocumentJob>, step: WorkflowStep) {
		const job = event.payload;

		try {
			if (job.type === 'PROCESS_DOCUMENT') {
				await step.do('process-document', PIPELINE_RETRIES, () =>
					runDocumentPipeline(job),
				);
			} else if (job.type === 'GENERATE_QUESTIONS') {
				await step.do('assert-document-ready', () =>
					assertDocumentReady(job.documentId),
				);
			}

			await step.do('mark-generating', () =>
				markSessionStatus(job.sessionId, 'generating'),
			);

			await step.do('generate-questions', GENERATION_RETRIES, () =>
				runGeneration(job),
			);

			// Best-effort: derive a short title from the generated questions. A
			// failure here must not fail the session — the temporary topic-based
			// title stays in place — so swallow errors after retries.
			await step.do('generate-title', TITLE_RETRIES, () =>
				runTitleGeneration(job).catch((error) => {
					console.error('Title generation failed:', error);
				}),
			);

			await step.do('mark-completed', () =>
				markSessionStatus(job.sessionId, 'completed'),
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';

			// Best-effort terminal-state bookkeeping. Runs only after all step
			// retries are exhausted, so the session/document no longer spin.
			await step.do('mark-failed', () =>
				markSessionStatus(job.sessionId, 'failed', errorMessage),
			);
			if (job.type === 'PROCESS_DOCUMENT') {
				await step.do('mark-document-failed', () =>
					markDocumentStatus(job.documentId, 'failed', errorMessage),
				);
			}

			throw error;
		}
	}
}
