/**
 * Build gold fingerprints from samples/gold/*.json
 * Usage: pnpm --filter server exec tsx scripts/eval/build-gold-fingerprints.ts
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  fingerprintSet,
  type GoldQuestion,
  tagQuestion,
} from './fingerprint.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../../../');
const goldDir = join(repoRoot, 'samples/gold');
const outDir = join(repoRoot, 'samples/eval');

mkdirSync(outDir, { recursive: true });

type GoldFile = {
  sampleId: string;
  topic: string;
  questions: GoldQuestion[];
};

const files = readdirSync(goldDir)
  .filter((f) => /^sample-\d+\.json$/.test(f))
  .sort();

const summary: Array<{
  sampleId: string;
  topic: string;
  n: number;
  fingerprint: ReturnType<typeof fingerprintSet>;
  perQuestion: Array<{ number?: number; tags: string[]; cognitive: string }>;
}> = [];

for (const file of files) {
  const data = JSON.parse(
    readFileSync(join(goldDir, file), 'utf8'),
  ) as GoldFile;
  const fp = fingerprintSet(data.questions);
  const perQuestion = data.questions.map((q) => {
    const t = tagQuestion(q);
    return {
      number: q.number,
      tags: t.templateTags,
      cognitive: t.cognitive,
      stemEndsEllipsis: t.stemEndsEllipsis,
      optionShape: t.optionShape,
    };
  });
  summary.push({
    sampleId: data.sampleId,
    topic: data.topic,
    n: data.questions.length,
    fingerprint: fp,
    perQuestion,
  });
  console.log(
    `${data.sampleId}: n=${data.questions.length} templates=`,
    Object.entries(fp.templateHist)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}:${v}`)
      .join(', '),
  );
}

writeFileSync(
  join(outDir, 'gold-fingerprints.json'),
  JSON.stringify(summary, null, 2),
  'utf8',
);
console.log(`Wrote ${join(outDir, 'gold-fingerprints.json')}`);
