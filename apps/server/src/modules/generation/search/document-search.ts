import { generateText } from 'ai';

import type { ImageRef } from '@/modules/processing/chunker';
import type { RetrievedChunkMeta } from '@/modules/processing/rag';
import {
  retrieveContextWithMeta,
  sampleStratifiedChunks,
} from '@/modules/processing/rag';
import { openrouter } from '@/shared/ai/openrouter';
import { GENERATION_PARAMS, MODELS } from '@/shared/config/models';
import { withRetry } from '@/shared/lib/retry';

import {
  buildSubtopicQueries,
  gapFillSubtopicQueries,
  mergeQueries,
} from './expand-subtopic-queries';
import { resolveSourceMaterial } from './resolve-source-material';

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

async function retrieveAndMerge(
  queries: string[],
  scopeId: string,
  allChunks: Map<string, RetrievedChunkMeta>,
): Promise<void> {
  for (const query of queries) {
    const result = await withRetry(() =>
      retrieveContextWithMeta(query, scopeId, DEFAULT_TOP_K),
    );
    for (const item of result.items) {
      const existing = allChunks.get(item.id);
      if (!existing || item.score < existing.score) {
        allChunks.set(item.id, item);
      }
    }
  }
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

  const levelParts = [
    curriculum && `curriculum "${curriculum}"`,
    grade && `grade "${grade}"`,
    classGrade && `class "${classGrade}"`,
  ].filter(Boolean);
  const levelHint =
    levelParts.length > 0
      ? `Adapt the research to ${levelParts.join(', ')}.`
      : 'Adapt the research to the educational level implied by the document content.';

  // Phase A: doc-first expand → retrieve → gap-fill → retrieve
  const samples = await sampleStratifiedChunks(scopeId);
  const round1Queries = await buildSubtopicQueries({
    topic,
    curriculum,
    grade,
    classGrade,
    samples,
    sessionId,
    scopeId,
  });

  await retrieveAndMerge(round1Queries, scopeId, allChunks);

  let queries = [...round1Queries];

  if (allChunks.size > 0) {
    const retrievedTexts = Array.from(allChunks.values())
      .sort((a, b) => a.score - b.score)
      .map((c) => c.text);
    const gapQueries = await gapFillSubtopicQueries({
      topic,
      curriculum,
      grade,
      classGrade,
      existingQueries: queries,
      sampleTexts: samples,
      retrievedTexts,
      sessionId,
      scopeId,
    });
    const newGaps = gapQueries.filter(
      (q) =>
        !queries.some(
          (e) =>
            e.toLowerCase() === q.toLowerCase() ||
            e.toLowerCase().includes(q.toLowerCase()) ||
            q.toLowerCase().includes(e.toLowerCase()),
        ),
    );
    if (newGaps.length > 0) {
      await retrieveAndMerge(newGaps, scopeId, allChunks);
      queries = mergeQueries(queries, newGaps);
    }
  }

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
- Use clear headings (##) for each major aspect / subtopic
- Include specific facts, numbers, dates, and terminology from the excerpts
- Organize for educational question writing so different subtopics are easy to pull into separate questions
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
