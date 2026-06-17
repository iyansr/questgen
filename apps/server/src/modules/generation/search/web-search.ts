import { generateText, stepCountIs, tool } from 'ai';
import z from 'zod';

import type { ImageRef } from '@/modules/processing/chunker';
import { openai } from '@/shared/ai/openai';
import { researchWeb } from '@/shared/ai/tavily';
import { GENERATION_PARAMS, MODELS } from '@/shared/config/models';
import { withRetry } from '@/shared/lib/retry';

const MARKDOWN_LIMIT = 150_000;

export type WebSearchResult = {
	sourceMaterial: string;
	imageRefs: ImageRef[];
};

export async function webSearch({
	topic,
	sessionId,
	grade,
	classGrade,
	curriculum,
}: {
	topic: string;
	sessionId: string;
	curriculum: string;
	grade: string;
	classGrade: string;
}): Promise<WebSearchResult> {
	const allImageRefs = new Map<string, ImageRef>();
	const { text } = await generateText({
		model: openai(MODELS.RESEARCH),
		temperature: GENERATION_PARAMS.RESEARCH.temperature,
		topP: GENERATION_PARAMS.RESEARCH.topP,
		tools: {
			searchWeb: tool({
				description:
					'Search the web for detailed information about a specific aspect of a topic. Returns comprehensive markdown content from multiple sources.',
				inputSchema: z.object({
					query: z
						.string()
						.describe(
							'A focused search query targeting a specific aspect of the topic',
						),
				}),
				execute: async ({ query }) => {
					const result = await withRetry(() => researchWeb(query, sessionId));

					for (const ref of result.images) {
						if (!allImageRefs.has(ref.id)) allImageRefs.set(ref.id, ref);
					}

					const truncated = result.markdown.length > MARKDOWN_LIMIT;
					if (truncated) {
						console.warn(
							`Web research truncated: ${result.markdown.length} > ${MARKDOWN_LIMIT}`,
						);
					}
					const markdown = truncated
						? result.markdown.slice(0, MARKDOWN_LIMIT)
						: result.markdown;

					return {
						markdown,
						sourceCount: result.sections.length,
						images: result.images.map((ref) => ({
							id: ref.id,
							caption: ref.caption,
						})),
					};
				},
			}),
		},
		stopWhen: stepCountIs(3),
		system: `\
You are a thorough research assistant compiling detailed reference material for question generation.

<instruction>
Your task: Research the topic "${topic}" as thoroughly as possible using the searchWeb tool.

Focus on content appropriate for ${grade} students in ${classGrade} following the ${curriculum} curriculum.

Ensure the research covers:
- Core concepts and definitions aligned with the curriculum
- Age-appropriate examples and applications
- Common misconceptions at this educational level
- Key facts, terminology, and principles that could be tested
</instruction>

<class_detail>
- Grade: ${grade}
- Class: ${classGrade}
- Curriculum: ${curriculum}
</class_detail>


<strategy>
1. Break the topic into 3-5 key aspects or sub-topics
2. Search each aspect with specific, targeted queries
3. Search for: definitions, key concepts, examples, applications, common misconceptions, and important facts
</strategy>

<format>
After gathering information, compile a comprehensive markdown document that:
- Uses clear headings (##) for each major aspect
- Includes specific facts, numbers, dates, and terminology
- Is well-organized for educational question writing
- Preserves important details that could be tested

CRITICAL — IMAGE PRESERVATION RULES:
When the searchWeb tool returns images, you MUST include them inline in your document using this EXACT format on its own line:
\`\`\`
![IMAGE:caption](https://the-exact-image-url-from-search-results)
\`\`\`
- Use the EXACT URL from the searchWeb result images — never invent or modify the URL
- NEVER write descriptive placeholder text like "[Gambar: ...]" or "[Image: ...]" instead of the actual image URL
- NEVER invent image descriptions; always use the caption from the search result
- If a search returns multiple images, include each one with its own ![]() line near the relevant content
- If a search returns zero images, do not include any image references for that search
</format>

Output ONLY the compiled markdown research document. Do not include preamble.`,
		prompt: `Research the topic "${topic}" in detail. Search multiple aspects thoroughly, then compile all findings into a single comprehensive markdown document.`,
		experimental_telemetry: {
			isEnabled: true,
			functionId: 'web-research',
			metadata: { sessionId, topic },
		},
	});

	return {
		sourceMaterial: text,
		imageRefs: Array.from(allImageRefs.values()),
	};
}
