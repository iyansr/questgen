import { generateText, stepCountIs, tool } from 'ai';
import z from 'zod';

import type { ImageRef } from '@/lib/chunker';
import { openrouter } from '@/lib/openrouter';
import { researchWeb } from '@/lib/tavily';

const RESEARCH_MODEL = 'deepseek/deepseek-v4-flash';

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
		model: openrouter(RESEARCH_MODEL, {
			reasoning: {
				effort: 'high',
				enabled: true,
			},
		}),
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
					const result = await researchWeb(query, sessionId);

					for (const ref of result.images) {
						if (!allImageRefs.has(ref.id)) allImageRefs.set(ref.id, ref);
					}

					return {
						markdown: result.markdown.slice(0, 50_000),
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
- When search results include images, reference them inline using their ID (e.g. "see image [https://example.com/image.png]") so the image context is preserved
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
