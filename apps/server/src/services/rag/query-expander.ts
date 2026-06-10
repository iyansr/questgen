import { generateText, Output } from 'ai';
import { z } from 'zod';

import { openrouter } from '../../lib/openrouter';
import type { QuestionTypeCount } from '../../schemas/sessions.schema';
import type { SubQuery } from './types';

const EXPANSION_MODEL = openrouter('openai/gpt-4o-mini');

const expansionSchema = z.object({
	queries: z
		.array(
			z.object({
				query: z.string().min(3).max(120),
				rationale: z.string().max(200),
			}),
		)
		.min(2)
		.max(5),
});

export async function expandQueries(
	topic: string,
	questionTypeCounts: QuestionTypeCount[],
	source: 'document' | 'web',
): Promise<SubQuery[]> {
	const types = questionTypeCounts.map((q) => q.type).join(', ');
	const sourceGuidance =
		source === 'web'
			? `The source is web search results (noisy, heterogeneous). Bias queries toward:
- background / definition queries (web corpora may not have fine-grained structure)
- explicitly diverse facets (definitions, examples, applications, common misconceptions)`
			: `The source is a structured document. Bias queries toward:
- fine-grained sub-topics and section-specific terms
- terms that are likely to appear verbatim in the document`;

	const { output } = await generateText({
		model: EXPANSION_MODEL,
		output: Output.object({ schema: expansionSchema }),
		system: `You generate diverse search queries for a RAG system that retrieves chunks to write assessment questions.
- Each query should target a different facet of the topic.
- Phrase queries as a student would phrase a question, not as a keyword string.
- Keep queries short and specific.
- ALL queries and rationales MUST be written in Bahasa Indonesia.`,
		prompt: `Topic: "${topic}"
Question types to generate: ${types}

${sourceGuidance}

Generate 3-5 diverse sub-queries that, taken together, would cover the topic well enough to write ${questionTypeCounts.reduce((s, q) => s + q.count, 0)} questions.

IMPORTANT: Write all queries and rationales in Bahasa Indonesia.`,
		experimental_telemetry: {
			isEnabled: true,
			functionId: 'rag-query-expansion',
			metadata: { source },
		},
	});

	return output.queries;
}
