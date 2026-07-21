import {
  lexicalToneSimilarity,
  normalizeStemForTone,
} from '../../src/modules/generation/eval/tone.js';

export type JudgeResult = {
  score: number;
  rationale: string;
};

export type ToneMatchPair = {
  goldIndex: number;
  goldStem: string;
  bestGenIndex: number | null;
  bestGenStem: string | null;
  score: number;
  note: string;
};

export type ToneMatchResult = {
  /** Mean best-match tone/intent score (0–100), order-invariant. */
  score: number;
  /** Share of gold items with best match ≥ threshold (default 50). */
  coverageRate: number;
  pairs: ToneMatchPair[];
  rationale: string;
};

export { lexicalToneSimilarity, normalizeStemForTone };

const JUDGE_MODEL =
  process.env.QUESTGEN_JUDGE_MODEL ?? 'openai/gpt-4.1-mini';

async function openRouterJson(args: {
  apiKey: string;
  system: string;
  user: string;
}): Promise<Record<string, unknown>> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'questgen-eval',
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: args.system },
        { role: 'user', content: args.user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM judge failed: ${res.status} ${text}`);
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as Record<string, unknown>) : {};
  }
}

export async function llmStyleJudge(args: {
  topic: string;
  goldStems: string[];
  generatedStems: string[];
  apiKey: string;
}): Promise<JudgeResult> {
  const goldList = args.goldStems
    .slice(0, 12)
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');
  const genList = args.generatedStems
    .slice(0, 12)
    .map((s, i) => `${i + 1}. ${s}`)
    .join('\n');

  const system = `You are an Indonesian education assessment expert (SMP/SMA Uji Kompetensi).
Score how similar SET B is to SET A in QUESTION PATTERN / STYLE only (not whether answers match).
Consider: stem templates, ending with "....", 4-option MCQ feel, distractor near-miss style, formal textbook Indonesian, cognitive mix.
Ignore image-dependent items if SET B lacks images.
Return ONLY JSON: {"score": <0-100 integer>, "rationale": "<one short sentence>"}`;

  const user = `Topic: ${args.topic}

SET A (human textbook exercises):
${goldList}

SET B (model-generated):
${genList}

Score SET B pattern similarity to SET A (0=totally different style, 100=indistinguishable pattern).`;

  const parsed = await openRouterJson({
    apiKey: args.apiKey,
    system,
    user,
  });
  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  return { score, rationale: String(parsed.rationale ?? '') };
}

/**
 * Order-invariant tone/intent matching.
 * For each human gold stem, find the best AI stem that asks a similar thing
 * in a similar assessment tone (paraphrase OK; number/order ignored).
 *
 * Example: gold "Apa yang dimaksud dengan buku?" may match
 * "Pengertian buku adalah ...." or "Apa pengertian buku ....".
 */
export async function llmToneMatchJudge(args: {
  topic: string;
  goldStems: string[];
  generatedStems: string[];
  apiKey: string;
  coverageThreshold?: number;
}): Promise<ToneMatchResult> {
  const threshold = args.coverageThreshold ?? 50;
  const goldStems = args.goldStems.slice(0, 15);
  const generatedStems = args.generatedStems.slice(0, 15);

  if (goldStems.length === 0 || generatedStems.length === 0) {
    return {
      score: 0,
      coverageRate: 0,
      pairs: [],
      rationale: 'empty sets',
    };
  }

  const goldList = goldStems.map((s, i) => `G${i}: ${s}`).join('\n');
  const genList = generatedStems.map((s, i) => `A${i}: ${s}`).join('\n');

  const system = `You compare Indonesian school-assessment questions.
For EACH human gold item (G*), pick the SINGLE best AI item (A*) that is closest in:
- assessment INTENT (same concept / skill being tested), and
- TONE / phrasing family (definition ask ≈ "apa yang dimaksud" ≈ "apa pengertian" ≈ "X adalah/disebut ...."),
even if wording differs and even if they appear at different numbers/positions.
Score 0–100 per pair:
- 80–100: clear paraphrase / same ask in similar tone
- 50–79: related concept, somewhat similar tone
- 20–49: weak topical overlap only
- 0–19: no reasonable match
Order does NOT matter. Do NOT require identical wording.
Return JSON:
{"matches":[{"goldIndex":0,"bestGenIndex":3,"score":78,"note":"both ask definition of X"}],"rationale":"short"}
bestGenIndex may be null if nothing is remotely related (then score 0).`;

  const user = `Topic: ${args.topic}

HUMAN GOLD:
${goldList}

AI GENERATED:
${genList}

Match every G* to at most one best A*. Multiple G* may map to the same A* if needed.`;

  const lexicalPairs = (): ToneMatchPair[] =>
    goldStems.map((g, gi) => {
      let best = 0;
      let bestJ: number | null = null;
      for (let j = 0; j < generatedStems.length; j++) {
        const s = lexicalToneSimilarity(g, generatedStems[j] ?? '');
        if (s > best) {
          best = s;
          bestJ = j;
        }
      }
      return {
        goldIndex: gi,
        goldStem: g,
        bestGenIndex: bestJ,
        bestGenStem: bestJ == null ? null : (generatedStems[bestJ] ?? null),
        score: best,
        note: 'lexical-fallback',
      };
    });

  let parsed: {
    matches?: Array<{
      goldIndex?: number;
      bestGenIndex?: number | null;
      score?: number;
      note?: string;
    }>;
    rationale?: string;
  };

  try {
    parsed = (await openRouterJson({
      apiKey: args.apiKey,
      system,
      user,
    })) as typeof parsed;
  } catch (err) {
    const pairs = lexicalPairs();
    const score =
      pairs.reduce((a, p) => a + p.score, 0) / Math.max(pairs.length, 1);
    return {
      score: Math.round(score * 10) / 10,
      coverageRate: Math.round(
        (100 * pairs.filter((p) => p.score >= threshold).length) /
          Math.max(pairs.length, 1),
      ),
      pairs,
      rationale: `LLM tone match failed (${err instanceof Error ? err.message : String(err)}); used lexical fallback`,
    };
  }

  const byGold = new Map<number, ToneMatchPair>();
  for (const m of parsed.matches ?? []) {
    const gi = Number(m.goldIndex);
    if (!Number.isFinite(gi) || gi < 0 || gi >= goldStems.length) continue;
    const bestGenIndex =
      m.bestGenIndex == null ? null : Number(m.bestGenIndex);
    const safeIdx =
      bestGenIndex != null &&
      Number.isFinite(bestGenIndex) &&
      bestGenIndex >= 0 &&
      bestGenIndex < generatedStems.length
        ? bestGenIndex
        : null;
    const llmScore = Math.max(0, Math.min(100, Number(m.score) || 0));
    const lex =
      safeIdx == null
        ? 0
        : lexicalToneSimilarity(
            goldStems[gi] ?? '',
            generatedStems[safeIdx] ?? '',
          );
    const score = Math.round(llmScore * 0.85 + lex * 0.15);
    byGold.set(gi, {
      goldIndex: gi,
      goldStem: goldStems[gi] ?? '',
      bestGenIndex: safeIdx,
      bestGenStem: safeIdx == null ? null : (generatedStems[safeIdx] ?? null),
      score,
      note: String(m.note ?? ''),
    });
  }

  const pairs: ToneMatchPair[] = [];
  for (let gi = 0; gi < goldStems.length; gi++) {
    const existing = byGold.get(gi);
    if (existing) {
      pairs.push(existing);
      continue;
    }
    let best = 0;
    let bestJ: number | null = null;
    for (let j = 0; j < generatedStems.length; j++) {
      const s = lexicalToneSimilarity(
        goldStems[gi] ?? '',
        generatedStems[j] ?? '',
      );
      if (s > best) {
        best = s;
        bestJ = j;
      }
    }
    pairs.push({
      goldIndex: gi,
      goldStem: goldStems[gi] ?? '',
      bestGenIndex: bestJ,
      bestGenStem: bestJ == null ? null : (generatedStems[bestJ] ?? null),
      score: best,
      note: 'lexical-fill',
    });
  }

  const score =
    Math.round(
      (pairs.reduce((a, p) => a + p.score, 0) / Math.max(pairs.length, 1)) * 10,
    ) / 10;
  const coverageRate = Math.round(
    (100 * pairs.filter((p) => p.score >= threshold).length) /
      Math.max(pairs.length, 1),
  );

  return {
    score,
    coverageRate,
    pairs,
    rationale: String(parsed.rationale ?? ''),
  };
}

export async function llmSanitySpotCheck(args: {
  topic: string;
  sourceMaterialHint: string;
  items: Array<{ questionText: string; correctAnswer?: string | null }>;
  apiKey: string;
}): Promise<{ answerableRate: number; notes: string }> {
  if (args.items.length === 0) {
    return { answerableRate: 0, notes: 'no items' };
  }

  const list = args.items
    .map(
      (it, i) =>
        `${i + 1}. Q: ${it.questionText}\n   A: ${it.correctAnswer ?? '(none)'}`,
    )
    .join('\n');

  const system = `Judge whether each question is answerable from typical SMP textbook material on the topic (not whether the answer is correct). Return JSON {"answerable":[true/false,...],"notes":"short"}.`;
  const user = `Topic: ${args.topic}
Material hint: ${args.sourceMaterialHint.slice(0, 500)}

Items:
${list}`;

  try {
    const parsed = await openRouterJson({
      apiKey: args.apiKey,
      system,
      user,
    });
    const arr = (parsed.answerable as boolean[] | undefined) ?? [];
    const ok = arr.filter(Boolean).length;
    return {
      answerableRate: arr.length ? Math.round((100 * ok) / arr.length) : 0,
      notes: String(parsed.notes ?? ''),
    };
  } catch {
    return { answerableRate: 0, notes: 'sanity failed' };
  }
}
