import { generateText, stepCountIs, tool } from 'ai';
import z from 'zod';

import type { ImageRef } from '@/modules/processing/chunker';
import type { RetrievedChunkMeta } from '@/modules/processing/rag';
import { retrieveContextWithMeta } from '@/modules/processing/rag';
import { openrouter } from '@/shared/ai/openrouter';
import { GENERATION_PARAMS, MODELS } from '@/shared/config/models';
import { withRetry } from '@/shared/lib/retry';

import { buildQuantitativeResearchAddon } from '../prompts/subject-guidance';
import { resolveSourceMaterial } from './resolve-source-material';

const MAX_DISTANCE = 0.6;
const DEFAULT_TOP_K = 12;
const CHUNK_TEXT_LIMIT = 3000;
const COMPILE_BUDGET = 100_000;

export type DocumentSearchResult = {
  sourceMaterial: string;
  imageRefs: ImageRef[];
  trace: {
    queries: string[];
    chunks: RetrievedChunkMeta[];
    coverage: { uniqueChunkCount: number; avgScore: number; minScore: number };
  };
};

function buildChunkExcerpts(chunks: RetrievedChunkMeta[]): string[] {
  const excerpts: string[] = [];
  let used = 0;

  for (const chunk of chunks) {
    const imageNote = chunk.imageRefs.length
      ? `\nImages: ${chunk.imageRefs.map((r) => `[${r.id}] ${r.caption || ''}`.trim()).join('; ')}`
      : '';
    const body = chunk.text.slice(0, CHUNK_TEXT_LIMIT);
    const excerpt = `${body}${imageNote}`;
    if (used + excerpt.length > COMPILE_BUDGET) break;
    excerpts.push(excerpt);
    used += excerpt.length;
  }

  return excerpts;
}

export async function documentSearch({
  topic,
  scopeId,
  sessionId,
  curriculum,
  grade,
  classGrade,
}: {
  topic: string;
  scopeId: string;
  sessionId: string;
  curriculum: string;
  grade: string;
  classGrade: string;
}): Promise<DocumentSearchResult> {
  const allChunks = new Map<string, RetrievedChunkMeta>();
  const queries: string[] = [];

  const levelParts = [
    curriculum && `curriculum "${curriculum}"`,
    grade && `grade "${grade}"`,
    classGrade && `class "${classGrade}"`,
  ].filter(Boolean);
  const levelHint =
    levelParts.length > 0
      ? `Adapt the research to ${levelParts.join(', ')}.`
      : 'Adapt the research to the educational level implied by the document content.';

  const quantitativeResearch = buildQuantitativeResearchAddon(topic);

  // Phase A: search only — do not rely on final text (often empty after tool-calls).
  await generateText({
    model: openrouter(MODELS.RETRIEVAL),
    temperature: GENERATION_PARAMS.RESEARCH.temperature,
    topP: GENERATION_PARAMS.RESEARCH.topP,
    tools: {
      searchDocument: tool({
        description:
          'Search the uploaded document for relevant chunks about a specific aspect of the topic. Returns document excerpts with relevance scores.',
        inputSchema: z.object({
          query: z
            .string()
            .describe(
              'A focused search query targeting a specific aspect of the topic, phrased as a student would ask',
            ),
          topK: z
            .number()
            .min(3)
            .max(20)
            .default(DEFAULT_TOP_K)
            .describe('Number of chunks to retrieve'),
        }),
        execute: async ({ query, topK }) => {
          queries.push(query);
          const result = await withRetry(() =>
            retrieveContextWithMeta(query, scopeId, topK ?? DEFAULT_TOP_K),
          );

          for (const item of result.items) {
            const existing = allChunks.get(item.id);
            if (!existing || item.score < existing.score) {
              allChunks.set(item.id, item);
            }
          }

          const relevant = result.items.filter((i) => i.score <= MAX_DISTANCE);
          const chunks =
            relevant.length >= 3 ? relevant : result.items.slice(0, 3);

          return {
            chunks: chunks.map((c) => ({
              text: c.text.slice(0, CHUNK_TEXT_LIMIT),
              score: c.score,
              imageRefs: c.imageRefs.map((ref) => ({
                id: ref.id,
                caption: ref.caption,
              })),
            })),
            chunkCount: chunks.length,
          };
        },
      }),
    },
    stopWhen: stepCountIs(3),
    system: `\
You are a thorough document research assistant gathering material from an uploaded document for question generation.

<instruction>
Your task: Search the uploaded document for all information related to the topic "${topic}" as thoroughly as possible using the searchDocument tool.

${levelHint}

Cover via searches:
- Core concepts and definitions from the document
- Key examples and applications mentioned in the document
- Important facts, terminology, and principles that could be tested
- Specific details, numbers, and definitions from the document
</instruction>

<strategy>
1. Break the topic into 3-5 key aspects or sub-topics
2. Search each aspect with specific, targeted queries phrased as a student would ask
3. Search for: definitions, key concepts, examples, applications, important facts
4. Use different phrasings and synonyms to maximize coverage
5. Call searchDocument in parallel when exploring multiple aspects
${quantitativeResearch}
</strategy>

Do NOT write a final research document. Only use the searchDocument tool.`,
    prompt: `Search the document for information about "${topic}". Search multiple aspects thoroughly using searchDocument. Do not write a summary.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'document-research-search',
      metadata: { sessionId, topic, scopeId },
    },
  });

  const chunks = Array.from(allChunks.values()).sort(
    (a, b) => a.score - b.score,
  );

  const imageRefsMap = new Map<string, ImageRef>();
  for (const c of chunks) {
    for (const ref of c.imageRefs) {
      if (!imageRefsMap.has(ref.id)) imageRefsMap.set(ref.id, ref);
    }
  }

  const coverage = {
    uniqueChunkCount: chunks.length,
    avgScore: chunks.length
      ? chunks.reduce((s, c) => s + c.score, 0) / chunks.length
      : 1,
    minScore: chunks.length ? (chunks[0]?.score ?? 1) : 1,
  };

  const excerpts = buildChunkExcerpts(chunks);
  let compiled = '';

  // Phase B: forced compile from stashed chunks (no tools).
  if (excerpts.length > 0) {
    const { text } = await generateText({
      model: openrouter(MODELS.RETRIEVAL),
      temperature: GENERATION_PARAMS.RESEARCH.temperature,
      topP: GENERATION_PARAMS.RESEARCH.topP,
      system: `\
You are a thorough document research assistant compiling detailed reference material from retrieved document excerpts for question generation.

<instruction>
Topic: "${topic}"
${levelHint}

Compile a comprehensive markdown document from the excerpts below. Use ONLY information present in the excerpts — never invent facts.
</instruction>

<format>
- Use clear headings (##) for each major aspect
- Include specific facts, numbers, dates, and terminology from the excerpts
- Organize for educational question writing
- Preserve important details that could be tested
- When excerpts mention Images with IDs, reference them inline using their ID (e.g. "see image [img_abc123]")
</format>

Output ONLY the compiled markdown research document. Do not include preamble.`,
      prompt: `Compile research material about "${topic}" from these excerpts:\n\n${excerpts.map((e, i) => `### Excerpt ${i + 1}\n${e}`).join('\n\n')}`,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'document-research-compile',
        metadata: { sessionId, topic, scopeId },
      },
    });
    compiled = text;
  }

  return {
    sourceMaterial: resolveSourceMaterial(compiled, excerpts),
    imageRefs: Array.from(imageRefsMap.values()),
    trace: { queries, chunks, coverage },
  };
}
