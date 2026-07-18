import { generateText, Output } from 'ai';
import { z } from 'zod';

import { openrouter } from '@/shared/ai/openrouter';
import { GENERATION_PARAMS, MODELS } from '@/shared/config/models';

const MIN_HEADING_LEAVES = 3;
const MAX_QUERIES = 12;
const MAX_GAP_QUERIES = 6;
const GAP_EXCERPT_BUDGET = 24_000;
const GAP_EXCERPT_LIMIT = 800;

const queriesSchema = z.object({
  queries: z.array(z.string()).min(1).max(MAX_QUERIES),
});

const gapQueriesSchema = z.object({
  queries: z.array(z.string()).max(MAX_GAP_QUERIES),
});

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Extract `#` / `##` headings; prefer `##` leaves; drop topic-parent `#` titles. */
export function extractHeadingLeaves(
  texts: string[],
  topic?: string,
): string[] {
  const h1: string[] = [];
  const h2: string[] = [];

  for (const text of texts) {
    for (const line of text.split('\n')) {
      const match = /^(#{1,2})\s+(.+?)\s*$/.exec(line.trim());
      if (!match?.[1] || !match[2]) continue;
      const title = match[2].replace(/\s*#+\s*$/, '').trim();
      if (!title) continue;
      if (match[1].length === 1) h1.push(title);
      else h2.push(title);
    }
  }

  const topicNorm = topic ? normalizeKey(topic) : '';
  const isTopicParent = (title: string) => {
    if (!topicNorm) return false;
    const n = normalizeKey(title);
    return (
      n === topicNorm || n.includes(topicNorm) || topicNorm.includes(n)
    );
  };

  const leaves = dedupeQueries(h2, MAX_QUERIES * 2);
  if (leaves.length >= MIN_HEADING_LEAVES) return leaves;

  return dedupeQueries(
    [...leaves, ...h1.filter((t) => !isTopicParent(t))],
    MAX_QUERIES * 2,
  );
}

/** Exact + near-duplicate collapse; cap at `max`. */
export function dedupeQueries(queries: string[], max = MAX_QUERIES): string[] {
  const out: string[] = [];
  const keys: string[] = [];

  for (const raw of queries) {
    const q = raw.trim().replace(/\s+/g, ' ');
    if (!q) continue;
    const key = normalizeKey(q);
    if (keys.some((k) => k === key || k.includes(key) || key.includes(k))) {
      continue;
    }
    keys.push(key);
    out.push(q);
    if (out.length >= max) break;
  }

  return out;
}

/** Append new queries that do not overlap existing ones. */
export function mergeQueries(
  existing: string[],
  incoming: string[],
  max = MAX_QUERIES + MAX_GAP_QUERIES,
): string[] {
  return dedupeQueries([...existing, ...incoming], max);
}

function levelHint(
  curriculum: string,
  grade: string,
  classGrade: string,
): string {
  const parts = [
    curriculum && `curriculum "${curriculum}"`,
    grade && `grade "${grade}"`,
    classGrade && `class "${classGrade}"`,
  ].filter(Boolean);
  return parts.length > 0
    ? `Educational level: ${parts.join(', ')}.`
    : 'Infer educational level from the document samples when present.';
}

function formatSamples(samples: string[]): string {
  if (samples.length === 0) return '(no document samples available)';
  return samples
    .map((s, i) => `### Sample ${i + 1}\n${s}`)
    .join('\n\n');
}

async function llmExpandQueries({
  topic,
  curriculum,
  grade,
  classGrade,
  samples,
  sessionId,
  scopeId,
}: {
  topic: string;
  curriculum: string;
  grade: string;
  classGrade: string;
  samples: string[];
  sessionId: string;
  scopeId: string;
}): Promise<string[]> {
  const hasSamples = samples.length > 0;
  const { output } = await generateText({
    model: openrouter(MODELS.RETRIEVAL),
    temperature: GENERATION_PARAMS.RESEARCH.temperature,
    topP: GENERATION_PARAMS.RESEARCH.topP,
    output: Output.object({ schema: queriesSchema }),
    system: `\
You invent focused document search queries for covering a broad educational topic.

Rules:
- Return 4–12 short search queries, each targeting ONE distinct sub-aspect
- Prefer aspects clearly evidenced in the document samples
- When samples are thin or missing, add curriculum-plausible siblings for the topic and level — but never invent aspects contradicted by samples
- Do NOT repeat the whole topic as every query
- Phrases should work as embedding search queries (noun phrases or short student questions)
- Deduplicate near-duplicates`,
    prompt: `\
Topic: "${topic}"
${levelHint(curriculum, grade, classGrade)}

Document samples:
${formatSamples(samples)}

${hasSamples ? 'Extract and expand subtopics from the samples first.' : 'No samples — expand from topic and educational level only.'}
Return JSON with a "queries" array.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'document-research-expand',
      metadata: { sessionId, topic, scopeId },
    },
  });

  return dedupeQueries(output?.queries ?? [], MAX_QUERIES);
}

async function llmFilterHeadingQueries({
  topic,
  leaves,
  curriculum,
  grade,
  classGrade,
  sessionId,
  scopeId,
}: {
  topic: string;
  leaves: string[];
  curriculum: string;
  grade: string;
  classGrade: string;
  sessionId: string;
  scopeId: string;
}): Promise<string[]> {
  const { output } = await generateText({
    model: openrouter(MODELS.RETRIEVAL),
    temperature: GENERATION_PARAMS.RESEARCH.temperature,
    topP: GENERATION_PARAMS.RESEARCH.topP,
    output: Output.object({ schema: queriesSchema }),
    system: `\
You select the most relevant document section headings for covering a topic.
Return 4–12 short search queries derived from the heading list (you may lightly normalize wording).
Prefer leaf sections under the topic; drop unrelated chapters.`,
    prompt: `\
Topic: "${topic}"
${levelHint(curriculum, grade, classGrade)}

Headings:
${leaves.map((h) => `- ${h}`).join('\n')}

Return JSON with a "queries" array of selected/normalized search queries.`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'document-research-expand',
      metadata: { sessionId, topic, scopeId, mode: 'heading-filter' },
    },
  });

  return dedupeQueries(output?.queries ?? leaves.slice(0, MAX_QUERIES), MAX_QUERIES);
}

/**
 * Doc-first subtopic queries: headings when available, else sample themes + light curriculum fill.
 */
export async function buildSubtopicQueries({
  topic,
  curriculum,
  grade,
  classGrade,
  samples,
  sessionId,
  scopeId,
}: {
  topic: string;
  curriculum: string;
  grade: string;
  classGrade: string;
  samples: string[];
  sessionId: string;
  scopeId: string;
}): Promise<string[]> {
  const leaves = extractHeadingLeaves(samples, topic);

  if (leaves.length >= MIN_HEADING_LEAVES) {
    if (leaves.length > MAX_QUERIES) {
      return llmFilterHeadingQueries({
        topic,
        leaves,
        curriculum,
        grade,
        classGrade,
        sessionId,
        scopeId,
      });
    }
    return dedupeQueries(leaves, MAX_QUERIES);
  }

  return llmExpandQueries({
    topic,
    curriculum,
    grade,
    classGrade,
    samples,
    sessionId,
    scopeId,
  });
}

function packGapExcerpts(texts: string[]): string {
  const parts: string[] = [];
  let used = 0;
  for (let i = 0; i < texts.length; i++) {
    const body = texts[i]!.slice(0, GAP_EXCERPT_LIMIT);
    if (used + body.length > GAP_EXCERPT_BUDGET) break;
    parts.push(`### Retrieved ${i + 1}\n${body}`);
    used += body.length;
  }
  return parts.join('\n\n') || '(no retrieved excerpts)';
}

/**
 * One gap-fill round: missing aspects not covered by first retrieve.
 * Returns only new queries (caller merges). Empty when nothing missing.
 */
export async function gapFillSubtopicQueries({
  topic,
  curriculum,
  grade,
  classGrade,
  existingQueries,
  sampleTexts,
  retrievedTexts,
  sessionId,
  scopeId,
}: {
  topic: string;
  curriculum: string;
  grade: string;
  classGrade: string;
  existingQueries: string[];
  sampleTexts: string[];
  retrievedTexts: string[];
  sessionId: string;
  scopeId: string;
}): Promise<string[]> {
  const { output } = await generateText({
    model: openrouter(MODELS.RETRIEVAL),
    temperature: GENERATION_PARAMS.RESEARCH.temperature,
    topP: GENERATION_PARAMS.RESEARCH.topP,
    output: Output.object({ schema: gapQueriesSchema }),
    system: `\
You find gaps in document retrieval coverage for educational question generation.

Return 0–${MAX_GAP_QUERIES} NEW short search queries for aspects that:
- appear in the document samples OR are clearly part of the topic at this educational level, AND
- are missing or only weakly present in the retrieved excerpts

Do not repeat or paraphrase the existing queries. If coverage looks complete, return an empty queries array.`,
    prompt: `\
Topic: "${topic}"
${levelHint(curriculum, grade, classGrade)}

Existing search queries:
${existingQueries.map((q) => `- ${q}`).join('\n')}

Document samples (for what the doc may contain):
${formatSamples(sampleTexts)}

Retrieved excerpts so far:
${packGapExcerpts(retrievedTexts)}

Return JSON with a "queries" array (possibly empty).`,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'document-research-gap-fill',
      metadata: { sessionId, topic, scopeId },
    },
  });

  return dedupeQueries(output?.queries ?? [], MAX_GAP_QUERIES);
}
