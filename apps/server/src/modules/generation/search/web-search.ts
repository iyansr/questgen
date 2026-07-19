import { generateText, stepCountIs, tool } from 'ai';
import z from 'zod';

import type { ImageRef } from '@/modules/processing/chunker';
import { openrouter } from '@/shared/ai/openrouter';
import { researchWeb } from '@/shared/ai/tavily';
import { GENERATION_PARAMS, MODELS } from '@/shared/config/models';
import { withRetry } from '@/shared/lib/retry';

import {
  buildConceptualResearchAddon,
  buildQuantitativeResearchAddon,
} from '../prompts/subject-guidance';
import { resolveSourceMaterial } from './resolve-source-material';

const MARKDOWN_LIMIT = 150_000;
const COMPILE_BUDGET = 100_000;

export type WebSearchResult = {
  sourceMaterial: string;
  imageRefs: ImageRef[];
};

function budgetSections(sections: string[]): string[] {
  const out: string[] = [];
  let used = 0;
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    if (used + trimmed.length > COMPILE_BUDGET) {
      const room = COMPILE_BUDGET - used;
      if (room > 500) out.push(trimmed.slice(0, room));
      break;
    }
    out.push(trimmed);
    used += trimmed.length;
  }
  return out;
}

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
  const sections: string[] = [];
  const topicResearchAddon = [
    buildQuantitativeResearchAddon(topic),
    buildConceptualResearchAddon(topic),
  ]
    .filter(Boolean)
    .join('\n');

  // Phase A: search only — stash markdown; do not rely on final text.
  await generateText({
    model: openrouter(MODELS.RESEARCH),
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

          sections.push(markdown);

          return {
            markdown,
            sourceCount: result.sections.length,
            images: result.images.map((ref) => ({
              id: ref.id,
              caption: ref.caption,
              url: ref.url,
            })),
          };
        },
      }),
    },
    stopWhen: stepCountIs(3),
    system: `\
You are a thorough research assistant gathering material for question generation.

<instruction>
Your task: Research the topic "${topic}" as thoroughly as possible using the searchWeb tool.

Focus on content appropriate for ${grade} students in ${classGrade} following the ${curriculum} curriculum.

Cover via searches:
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
4. Call searchWeb in parallel when exploring multiple aspects
${topicResearchAddon}
</strategy>

Do NOT write a final research document. Only use the searchWeb tool.`,
    prompt: `Research the topic "${topic}" in detail. Search multiple aspects thoroughly using searchWeb. Do not write a summary.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'web-research-search',
      metadata: { sessionId, topic },
    },
  });

  const excerpts = budgetSections(sections);
  const imageList = Array.from(allImageRefs.values());
  let compiled = '';

  // Phase B: forced compile from stashed sections (no tools).
  if (excerpts.length > 0) {
    const imageCatalog = imageList.length
      ? imageList
          .map((ref) => `- ${ref.url} | caption: ${ref.caption || '(none)'}`)
          .join('\n')
      : '(no images)';

    const { text } = await generateText({
      model: openrouter(MODELS.RESEARCH),
      temperature: GENERATION_PARAMS.RESEARCH.temperature,
      topP: GENERATION_PARAMS.RESEARCH.topP,
      system: `\
You are a thorough research assistant compiling detailed reference material for question generation.

<instruction>
Topic: "${topic}"
Focus on content appropriate for ${grade} students in ${classGrade} following the ${curriculum} curriculum.

Compile a comprehensive markdown document from the search sections below.
</instruction>

<format>
- Use clear headings (##) for each major aspect
- Include specific facts, numbers, dates, and terminology
- Organize for educational question writing
- Preserve important details that could be tested

CRITICAL — IMAGE PRESERVATION RULES:
When including images, use this EXACT format on its own line:
\`\`\`
![IMAGE:caption](https://the-exact-image-url-from-search-results)
\`\`\`
- Use the EXACT URL from the available images list — never invent or modify the URL
- NEVER write descriptive placeholder text like "[Gambar: ...]" or "[Image: ...]" instead of the actual image URL
- NEVER invent image descriptions; always use the caption from the list
- Place each image near relevant content
- If the list is empty, do not include any image references
</format>

<available_images>
${imageCatalog}
</available_images>

Output ONLY the compiled markdown research document. Do not include preamble.`,
      prompt: `Compile research material about "${topic}" from these search sections:\n\n${excerpts.map((e, i) => `### Section ${i + 1}\n${e}`).join('\n\n')}`,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'web-research-compile',
        metadata: { sessionId, topic },
      },
    });
    compiled = text;
  }

  return {
    sourceMaterial: resolveSourceMaterial(compiled, excerpts),
    imageRefs: imageList,
  };
}
