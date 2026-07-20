/**
 * Re-score existing eval runs with order-invariant tone matching.
 * Does NOT call generation — only judges saved gold vs generated stems.
 *
 * Usage:
 *   pnpm --filter server eval:rescore
 *   pnpm --filter server eval:rescore -- --runs samples/eval/runs/v1-ipa-stems-sample-1-*.json
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

import { llmToneMatchJudge } from './llm-judge.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const serverRoot = resolve(scriptDir, '../..');
const repoRoot = resolve(serverRoot, '../..');
config({ path: join(serverRoot, '.env') });

type RunFile = {
  variant: string;
  sampleId: string;
  topic: string;
  questions: Array<{ questionText: string }>;
  structural?: { score: number };
  judgeScore?: number | null;
  patternScore?: number;
  [key: string]: unknown;
};

type GoldFile = {
  topic: string;
  questions: Array<{ questionText: string }>;
};

function parseArgs(argv: string[]) {
  const out = { runsGlob: '' as string, limit: 0 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--runs') out.runsGlob = argv[++i] ?? '';
    else if (a === '--limit') out.limit = Number(argv[++i] ?? 0);
  }
  return out;
}

function listRunFiles(filter: string): string[] {
  const dir = join(repoRoot, 'samples/eval/runs');
  if (!existsSync(dir)) return [];
  let files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(dir, f))
    .sort();
  if (filter) {
    const name = filter.split('/').pop() ?? filter;
    const prefix = name.replace(/\*$/, '').replace(/\.json$/, '');
    files = files.filter((f) => f.includes(prefix) || f.endsWith(name));
  }
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY required');
    process.exit(1);
  }

  const outDir = join(repoRoot, 'samples/eval');
  mkdirSync(outDir, { recursive: true });
  const outJsonl = join(outDir, 'tone-rescore.jsonl');

  let files = listRunFiles(args.runsGlob);
  if (args.limit > 0) files = files.slice(0, args.limit);
  if (files.length === 0) {
    console.error('No run files found');
    process.exit(1);
  }

  const rows: unknown[] = [];
  for (const file of files) {
    const run = JSON.parse(readFileSync(file, 'utf8')) as RunFile;
    const sampleNum = String(run.sampleId).replace(/^sample-/, '');
    const goldPath = join(repoRoot, 'samples/gold', `sample-${sampleNum}.json`);
    if (!existsSync(goldPath)) {
      console.warn(`skip ${file}: missing gold ${goldPath}`);
      continue;
    }
    const gold = JSON.parse(readFileSync(goldPath, 'utf8')) as GoldFile;
    const tone = await llmToneMatchJudge({
      topic: run.topic || gold.topic,
      goldStems: gold.questions.map((q) => q.questionText),
      generatedStems: (run.questions ?? []).map((q) => q.questionText),
      apiKey,
    });

    const structuralScore = Number(run.structural?.score ?? 0);
    const judgeScore =
      run.judgeScore == null ? structuralScore : Number(run.judgeScore);
    const similarityScore =
      Math.round(
        (structuralScore * 0.25 + judgeScore * 0.25 + tone.score * 0.5) * 10,
      ) / 10;

    run.toneMatchScore = tone.score;
    run.toneCoverageRate = tone.coverageRate;
    run.toneRationale = tone.rationale;
    run.tonePairs = tone.pairs;
    run.similarityScore = similarityScore;
    run.patternScore = similarityScore;
    writeFileSync(file, JSON.stringify(run, null, 2), 'utf8');

    const row = {
      ts: new Date().toISOString(),
      runFile: file.replace(`${repoRoot}/`, ''),
      variant: run.variant,
      sampleId: run.sampleId,
      topic: run.topic,
      structuralScore,
      judgeScore,
      toneMatchScore: tone.score,
      toneCoverageRate: tone.coverageRate,
      similarityScore,
      rationale: tone.rationale,
      examplePairs: tone.pairs.slice(0, 3).map((p) => ({
        gold: p.goldStem.slice(0, 100),
        ai: (p.bestGenStem ?? '').slice(0, 100),
        score: p.score,
        note: p.note,
      })),
    };
    appendFileSync(outJsonl, `${JSON.stringify(row)}\n`);
    rows.push(row);
    console.log(
      `${run.sampleId} ${run.variant}: tone=${tone.score} cover=${tone.coverageRate}% similarity=${similarityScore}`,
    );
  }

  console.log('\n=== Rescore done ===');
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
