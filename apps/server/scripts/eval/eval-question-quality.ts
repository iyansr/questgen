/**
 * Real-workflow question quality eval harness.
 *
 * Flow:
 *  1. Login (or register) local user
 *  2. Ingest each samples/sample-N/materials.pdf once (PROCESS_DOCUMENT)
 *  3. For each prompt variant: create session via documentId (GENERATE_QUESTIONS)
 *  4. Score structural + LLM judge vs samples/gold
 *  5. Append samples/eval/results.jsonl
 *
 * Usage:
 *   pnpm --filter server eval:quality
 *   pnpm --filter server eval:quality -- --variant v0-baseline --samples 1,2,3
 *   pnpm --filter server eval:quality -- --skip-ingest   # reuse state.json documentIds
 *
 * Requires: Postgres, Chroma, wrangler dev on :3000, API keys in .dev.vars
 */

import { createHash } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

import {
  type GoldQuestion,
  structuralSimilarity,
} from './fingerprint.js';
import { llmSanitySpotCheck, llmStyleJudge } from './llm-judge.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(scriptDir, '../..');
const repoRoot = resolve(serverRoot, '../..');

config({ path: join(serverRoot, '.env') });

const BASE_URL = process.env.EVAL_BASE_URL ?? 'http://localhost:3000';
const EVAL_EMAIL = process.env.EVAL_EMAIL ?? 'eval-quality@questgen.local';
const EVAL_PASSWORD = process.env.EVAL_PASSWORD ?? 'eval-password-123';
const EVAL_NAME = process.env.EVAL_NAME ?? 'Eval Quality';
const POLL_MS = Number(process.env.EVAL_POLL_MS ?? 3000);
const INGEST_TIMEOUT_MS = Number(process.env.EVAL_INGEST_TIMEOUT_MS ?? 900_000);
const GEN_TIMEOUT_MS = Number(process.env.EVAL_GEN_TIMEOUT_MS ?? 600_000);

const SAMPLE_META: Record<
  string,
  {
    topic: string;
    counts: Array<{ type: string; count: number }>;
  }
> = {
  '1': {
    topic: 'Sistem Reproduksi pada Manusia',
    counts: [{ type: 'multiple_choice', count: 10 }],
  },
  '2': {
    topic: 'Sistem Perkembangbiakan Tumbuhan dan Hewan',
    counts: [{ type: 'multiple_choice', count: 7 }],
  },
  '3': {
    topic: 'Pewarisan Sifat pada Makhluk Hidup',
    counts: [
      { type: 'multiple_choice', count: 10 },
      { type: 'short_answer', count: 3 },
      { type: 'essay', count: 2 },
    ],
  },
};

type SessionDetail = {
  id: string;
  status: string;
  documentId?: string | null;
  errorMessage?: string | null;
  questions?: Array<{
    questionText: string;
    questionType: string;
    options?: Array<{ label: string; text: string }> | null;
    correctAnswer?: string | null;
    suggestedAnswer?: string | null;
    order?: number;
  }>;
};

type EvalState = {
  token?: string;
  documents: Record<
    string,
    { documentId: string; ingestSessionId: string; topic: string }
  >;
};

function parseArgs(argv: string[]) {
  const out = {
    variant: 'v0-baseline',
    samples: ['1', '2', '3'],
    skipIngest: false,
    skipJudge: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--variant') out.variant = argv[++i] ?? out.variant;
    else if (a === '--samples')
      out.samples = (argv[++i] ?? '1,2,3').split(',').map((s) => s.trim());
    else if (a === '--skip-ingest') out.skipIngest = true;
    else if (a === '--skip-judge') out.skipJudge = true;
  }
  return out;
}

async function api(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);
  return fetch(`${BASE_URL}${path}`, { ...init, headers });
}

async function ensureToken(state: EvalState): Promise<string> {
  if (state.token) {
    const probe = await api('/api/sessions?page=1&limit=1', {
      token: state.token,
    });
    if (probe.ok) return state.token;
  }

  const login = await api('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EVAL_EMAIL, password: EVAL_PASSWORD }),
  });
  if (login.ok) {
    const body = (await login.json()) as { token: string };
    state.token = body.token;
    return body.token;
  }

  const reg = await api('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EVAL_EMAIL,
      password: EVAL_PASSWORD,
      name: EVAL_NAME,
    }),
  });
  if (!reg.ok) {
    const text = await reg.text();
    throw new Error(`Register failed: ${reg.status} ${text}`);
  }
  const body = (await reg.json()) as { token: string };
  state.token = body.token;
  return body.token;
}

async function pollSession(
  token: string,
  id: string,
  timeoutMs: number,
): Promise<SessionDetail> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await api(`/api/sessions/${id}`, { token });
    if (!res.ok) {
      throw new Error(`GET session ${id} failed: ${res.status}`);
    }
    const data = (await res.json()) as SessionDetail;
    if (data.status === 'completed' || data.status === 'failed') {
      return data;
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error(`Timeout waiting for session ${id}`);
}

function loadState(path: string): EvalState {
  if (!existsSync(path)) return { documents: {} };
  return JSON.parse(readFileSync(path, 'utf8')) as EvalState;
}

function saveState(path: string, state: EvalState) {
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf8');
}

function loadGold(sampleId: string): {
  topic: string;
  questions: GoldQuestion[];
} {
  const path = join(repoRoot, 'samples/gold', `sample-${sampleId}.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as {
    topic: string;
    questions: GoldQuestion[];
  };
}

async function ingestSample(
  token: string,
  sampleId: string,
): Promise<{ documentId: string; sessionId: string; ms: number }> {
  const meta = SAMPLE_META[sampleId];
  if (!meta) throw new Error(`Unknown sample ${sampleId}`);
  const filePath = join(
    repoRoot,
    'samples',
    `sample-${sampleId}`,
    'materials.pdf',
  );
  const bytes = readFileSync(filePath);
  const file = new File([bytes], 'materials.pdf', { type: 'application/pdf' });
  const fd = new FormData();
  fd.set('topic', meta.topic);
  fd.set('questionTypeCounts', JSON.stringify(meta.counts));
  fd.set('curriculum', 'Kurikulum Merdeka');
  fd.set('grade', 'SMP');
  fd.set('classGrade', 'IX');
  fd.set('includeImages', 'true');
  fd.set('file', file);

  const t0 = Date.now();
  const res = await api('/api/sessions', {
    method: 'POST',
    token,
    body: fd,
  });
  if (!res.ok) {
    throw new Error(`Ingest POST failed: ${res.status} ${await res.text()}`);
  }
  const { id } = (await res.json()) as { id: string };
  console.log(`[ingest sample-${sampleId}] session=${id} waiting…`);
  const done = await pollSession(token, id, INGEST_TIMEOUT_MS);
  if (done.status !== 'completed') {
    throw new Error(
      `Ingest failed: ${done.status} ${done.errorMessage ?? ''}`.trim(),
    );
  }
  if (!done.documentId) {
    throw new Error('Ingest completed but documentId missing');
  }
  return {
    documentId: done.documentId,
    sessionId: id,
    ms: Date.now() - t0,
  };
}

async function generateFromDocument(
  token: string,
  sampleId: string,
  documentId: string,
): Promise<{ session: SessionDetail; ms: number }> {
  const meta = SAMPLE_META[sampleId];
  if (!meta) throw new Error(`Unknown sample ${sampleId}`);
  const fd = new FormData();
  fd.set('topic', meta.topic);
  fd.set('questionTypeCounts', JSON.stringify(meta.counts));
  fd.set('curriculum', 'Kurikulum Merdeka');
  fd.set('grade', 'SMP');
  fd.set('classGrade', 'IX');
  fd.set('includeImages', 'true');
  fd.set('documentId', documentId);

  const t0 = Date.now();
  const res = await api('/api/sessions', {
    method: 'POST',
    token,
    body: fd,
  });
  if (!res.ok) {
    throw new Error(`Generate POST failed: ${res.status} ${await res.text()}`);
  }
  const { id } = (await res.json()) as { id: string };
  console.log(`[gen sample-${sampleId}] session=${id} waiting…`);
  const done = await pollSession(token, id, GEN_TIMEOUT_MS);
  return { session: done, ms: Date.now() - t0 };
}

function toGoldShape(
  questions: NonNullable<SessionDetail['questions']>,
): GoldQuestion[] {
  return questions.map((q, i) => ({
    number: q.order ?? i + 1,
    questionType: q.questionType,
    questionText: q.questionText,
    options: q.options ?? null,
    correctAnswer: q.correctAnswer ?? null,
  }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const evalDir = join(repoRoot, 'samples/eval');
  mkdirSync(evalDir, { recursive: true });
  const statePath = join(evalDir, 'state.json');
  const resultsPath = join(evalDir, 'results.jsonl');
  const runsDir = join(evalDir, 'runs');
  mkdirSync(runsDir, { recursive: true });

  const state = loadState(statePath);
  const token = await ensureToken(state);
  saveState(statePath, state);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey && !args.skipJudge) {
    console.warn('OPENROUTER_API_KEY missing — use --skip-judge');
  }

  const rows: unknown[] = [];

  for (const sampleId of args.samples) {
    const meta = SAMPLE_META[sampleId];
    if (!meta) {
      console.warn(`Skip unknown sample ${sampleId}`);
      continue;
    }

    let doc = state.documents[sampleId];
    if (!args.skipIngest || !doc?.documentId) {
      console.log(`\n=== Ingest sample-${sampleId}: ${meta.topic} ===`);
      const ingested = await ingestSample(token, sampleId);
      doc = {
        documentId: ingested.documentId,
        ingestSessionId: ingested.sessionId,
        topic: meta.topic,
      };
      state.documents[sampleId] = doc;
      saveState(statePath, state);
      console.log(
        `documentId=${doc.documentId} ingestMs=${ingested.ms} (first run includes OCR+gen)`,
      );
    } else {
      console.log(
        `\n=== Reuse document sample-${sampleId}: ${doc.documentId} ===`,
      );
    }

    console.log(`=== Generate variant=${args.variant} sample-${sampleId} ===`);
    const { session, ms } = await generateFromDocument(
      token,
      sampleId,
      doc.documentId,
    );

    if (session.status !== 'completed') {
      const row = {
        ts: new Date().toISOString(),
        variant: args.variant,
        sampleId: `sample-${sampleId}`,
        topic: meta.topic,
        status: session.status,
        error: session.errorMessage,
        latencyMs: ms,
      };
      appendFileSync(resultsPath, `${JSON.stringify(row)}\n`);
      rows.push(row);
      console.error('Generation failed', row);
      continue;
    }

    const gold = loadGold(sampleId);
    const generated = toGoldShape(session.questions ?? []);
    const structural = structuralSimilarity(gold.questions, generated);

    let judgeScore: number | null = null;
    let judgeRationale = '';
    let sanityRate: number | null = null;
    let sanityNotes = '';

    if (!args.skipJudge && apiKey) {
      const judge = await llmStyleJudge({
        topic: meta.topic,
        goldStems: gold.questions.map((q) => q.questionText),
        generatedStems: generated.map((q) => q.questionText),
        apiKey,
      });
      judgeScore = judge.score;
      judgeRationale = judge.rationale;

      const spot = generated
        .slice()
        .sort(
          (a, b) =>
            createHash('sha1')
              .update(a.questionText)
              .digest('hex')
              .localeCompare(
                createHash('sha1').update(b.questionText).digest('hex'),
              ),
        )
        .slice(0, 3);
      const sanity = await llmSanitySpotCheck({
        topic: meta.topic,
        sourceMaterialHint: meta.topic,
        items: spot,
        apiKey,
      });
      sanityRate = sanity.answerableRate;
      sanityNotes = sanity.notes;
    }

    const patternScore =
      judgeScore == null
        ? structural.score
        : Math.round((structural.score * 0.55 + judgeScore * 0.45) * 10) / 10;

    const runPayload = {
      variant: args.variant,
      sampleId: `sample-${sampleId}`,
      topic: meta.topic,
      sessionId: session.id,
      documentId: doc.documentId,
      latencyMs: ms,
      questions: generated,
      structural,
      judgeScore,
      judgeRationale,
      sanityRate,
      sanityNotes,
      patternScore,
    };
    const runPath = join(
      runsDir,
      `${args.variant}-sample-${sampleId}-${session.id}.json`,
    );
    writeFileSync(runPath, JSON.stringify(runPayload, null, 2), 'utf8');

    const row = {
      ts: new Date().toISOString(),
      variant: args.variant,
      sampleId: `sample-${sampleId}`,
      topic: meta.topic,
      status: 'completed',
      sessionId: session.id,
      documentId: doc.documentId,
      nGenerated: generated.length,
      nGold: gold.questions.length,
      structuralScore: structural.score,
      judgeScore,
      patternScore,
      latencyMs: ms,
      runPath: runPath.replace(`${repoRoot}/`, ''),
      judgeRationale,
      sanityRate,
    };
    appendFileSync(resultsPath, `${JSON.stringify(row)}\n`);
    rows.push(row);
    console.log(
      `score structural=${structural.score} judge=${judgeScore} pattern=${patternScore} latencyMs=${ms}`,
    );
  }

  console.log('\n=== Done ===');
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
