/**
 * Cheap OpenRouter LLM judge for style/pedagogy similarity vs gold.
 */

export type JudgeResult = {
  score: number;
  rationale: string;
};

const JUDGE_MODEL =
  process.env.QUESTGEN_JUDGE_MODEL ?? 'openai/gpt-4.1-mini';

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
Consider: stem templates (disebut, pernyataan benar, pasangan fungsi, ciri-ciri, skenario singkat, urutan, aplikasi Mendel), ending with "....", 4-option MCQ feel, distractor near-miss style, formal textbook Indonesian, cognitive mix.
Ignore image-dependent items if SET B lacks images.
Return ONLY JSON: {"score": <0-100 integer>, "rationale": "<one short sentence>"}`;

  const user = `Topic: ${args.topic}

SET A (human textbook exercises):
${goldList}

SET B (model-generated):
${genList}

Score SET B pattern similarity to SET A (0=totally different style, 100=indistinguishable pattern).`;

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
        { role: 'system', content: system },
        { role: 'user', content: user },
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
  let parsed: { score?: number; rationale?: string };
  try {
    parsed = JSON.parse(content) as { score?: number; rationale?: string };
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    parsed = m
      ? (JSON.parse(m[0]) as { score?: number; rationale?: string })
      : {};
  }

  const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));
  return { score, rationale: parsed.rationale ?? '' };
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

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    return { answerableRate: 0, notes: `sanity failed: ${res.status}` };
  }

  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content ?? '{}';
  let parsed: { answerable?: boolean[]; notes?: string };
  try {
    parsed = JSON.parse(content) as { answerable?: boolean[]; notes?: string };
  } catch {
    parsed = {};
  }
  const arr = parsed.answerable ?? [];
  const ok = arr.filter(Boolean).length;
  return {
    answerableRate: arr.length ? Math.round((100 * ok) / arr.length) : 0,
    notes: parsed.notes ?? '',
  };
}
