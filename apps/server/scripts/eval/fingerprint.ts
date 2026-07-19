/**
 * Deterministic pattern fingerprint for Uji Kompetensi–style questions.
 * Used to compare generated sets against human gold exercises.
 */

export type GoldOption = { label: string; text: string };

export type GoldQuestion = {
  number?: number;
  questionType: string;
  questionText: string;
  options?: GoldOption[] | null;
  correctAnswer?: string | null;
  section?: string;
};

export type TemplateTag =
  | 'disebut'
  | 'pernyataan_benar'
  | 'pasangan'
  | 'ciri_ciri'
  | 'skenario'
  | 'urutan'
  | 'hitung_kromosom'
  | 'proses'
  | 'tujuan'
  | 'image_leadin'
  | 'other';

export type CognitiveBucket = 'recall' | 'comprehend' | 'apply';

export type QuestionFingerprint = {
  templateTags: TemplateTag[];
  cognitive: CognitiveBucket;
  stemEndsEllipsis: boolean;
  hasFourOptions: boolean;
  optionShape: 'short_terms' | 'long_statements' | 'mixed' | 'none';
  hasNumberedList: boolean;
  hasImageLeadin: boolean;
  indonesianMarkers: number;
};

export type SetFingerprint = {
  n: number;
  templateHist: Record<TemplateTag, number>;
  cognitiveHist: Record<CognitiveBucket, number>;
  stemEllipsisRate: number;
  fourOptionRate: number;
  optionShapeHist: Record<string, number>;
  numberedListRate: number;
  imageLeadinRate: number;
  avgIndonesianMarkers: number;
};

const TEMPLATE_RULES: Array<{ tag: TemplateTag; re: RegExp }> = [
  { tag: 'disebut', re: /\bdisebut\b/i },
  {
    tag: 'pernyataan_benar',
    re: /pernyataan yang benar|yang benar (adalah|mengenai|terkait)|manakah.*benar/i,
  },
  { tag: 'pasangan', re: /pasangan antara|pasangan.*fungsi|berikut ini yang benar adalah/i },
  { tag: 'ciri_ciri', re: /perhatikan ciri|ciri[- ]ciri|ciri penyakit|ciri atau sifat/i },
  {
    tag: 'skenario',
    re: /\b(dayu|siti|andi|budi|seorang|apabila|jika)\b.*\b(adalah|terjadi|disebabkan|penyebab)\b/i,
  },
  { tag: 'urutan', re: /urutan|berturut-turut|tahapan.*benar|secara berurutan/i },
  {
    tag: 'hitung_kromosom',
    re: /jumlah kromosom|kromosom pada|bersifat (haploid|diploid)|genotipe|fenotipe|punnett|tabel punnet/i,
  },
  { tag: 'proses', re: /proses|peristiwa yang terjadi|langsung terbentuk setelah/i },
  { tag: 'tujuan', re: /bertujuan|tujuan dari|untuk \.\.\.|perlakuan khusus.*agar/i },
  {
    tag: 'image_leadin',
    re: /perhatikan (gambar|ciri)|gambar berikut|berikut menunjukkan|amati|cermati (diagram|gambar)/i,
  },
];

const INDO_MARKERS = [
  /\bdisebut\b/i,
  /\badalah\b/i,
  /\bberikut\b/i,
  /\byang benar\b/i,
  /\bperhatikan\b/i,
  /\bjika\b/i,
  /\bapabila\b/i,
  /\bseorang\b/i,
  /\bfungsi\b/i,
  /\bproses\b/i,
  /\.{2,4}\s*$/,
];

export function tagQuestion(q: GoldQuestion): QuestionFingerprint {
  const stem = q.questionText ?? '';
  const tags: TemplateTag[] = [];
  for (const rule of TEMPLATE_RULES) {
    if (rule.re.test(stem)) tags.push(rule.tag);
  }
  if (tags.length === 0) tags.push('other');

  const options = q.options ?? null;
  const hasFourOptions = Array.isArray(options) && options.length === 4;
  let optionShape: QuestionFingerprint['optionShape'] = 'none';
  if (hasFourOptions && options) {
    const lengths = options.map((o) => o.text.trim().split(/\s+/).length);
    const short = lengths.filter((n) => n <= 4).length;
    const long = lengths.filter((n) => n >= 8).length;
    if (short >= 3) optionShape = 'short_terms';
    else if (long >= 3) optionShape = 'long_statements';
    else optionShape = 'mixed';
  }

  const hasNumberedList = /\(\d\)|\b\d\.\s+[A-ZÀ-ú]/.test(stem) || /ciri[- ]ciri|berikut ini!/i.test(stem);
  const hasImageLeadin = /perhatikan gambar|gambar berikut|berikut menunjukkan|amati|cermati/i.test(
    stem,
  );
  const stemEndsEllipsis = /\.{2,4}\s*$|…\s*$/.test(stem.trim());

  let cognitive: CognitiveBucket = 'recall';
  if (
    tags.includes('hitung_kromosom') ||
    tags.includes('skenario') ||
    tags.includes('urutan') ||
    /tentukan|hitung|kombinasi|silangkan|punnet/i.test(stem)
  ) {
    cognitive = 'apply';
  } else if (
    tags.includes('pernyataan_benar') ||
    tags.includes('pasangan') ||
    tags.includes('ciri_ciri') ||
    tags.includes('proses')
  ) {
    cognitive = 'comprehend';
  }

  const indonesianMarkers = INDO_MARKERS.reduce(
    (n, re) => n + (re.test(stem) ? 1 : 0),
    0,
  );

  return {
    templateTags: tags,
    cognitive,
    stemEndsEllipsis,
    hasFourOptions,
    optionShape,
    hasNumberedList,
    hasImageLeadin,
    indonesianMarkers,
  };
}

const ALL_TAGS: TemplateTag[] = [
  'disebut',
  'pernyataan_benar',
  'pasangan',
  'ciri_ciri',
  'skenario',
  'urutan',
  'hitung_kromosom',
  'proses',
  'tujuan',
  'image_leadin',
  'other',
];

function emptyHist(): Record<TemplateTag, number> {
  return Object.fromEntries(ALL_TAGS.map((t) => [t, 0])) as Record<
    TemplateTag,
    number
  >;
}

export function fingerprintSet(questions: GoldQuestion[]): SetFingerprint {
  const fps = questions.map(tagQuestion);
  const n = Math.max(fps.length, 1);
  const templateHist = emptyHist();
  const cognitiveHist: Record<CognitiveBucket, number> = {
    recall: 0,
    comprehend: 0,
    apply: 0,
  };
  const optionShapeHist: Record<string, number> = {
    short_terms: 0,
    long_statements: 0,
    mixed: 0,
    none: 0,
  };

  let stemEllipsis = 0;
  let fourOpt = 0;
  let numbered = 0;
  let image = 0;
  let indo = 0;

  for (const fp of fps) {
    for (const tag of fp.templateTags) templateHist[tag] += 1;
    cognitiveHist[fp.cognitive] += 1;
    optionShapeHist[fp.optionShape] = (optionShapeHist[fp.optionShape] ?? 0) + 1;
    if (fp.stemEndsEllipsis) stemEllipsis += 1;
    if (fp.hasFourOptions) fourOpt += 1;
    if (fp.hasNumberedList) numbered += 1;
    if (fp.hasImageLeadin) image += 1;
    indo += fp.indonesianMarkers;
  }

  return {
    n: fps.length,
    templateHist,
    cognitiveHist,
    stemEllipsisRate: stemEllipsis / n,
    fourOptionRate: fourOpt / n,
    optionShapeHist,
    numberedListRate: numbered / n,
    imageLeadinRate: image / n,
    avgIndonesianMarkers: indo / n,
  };
}

/** L1 distance between normalized histograms → similarity 0–100. */
function histSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
  nA: number,
  nB: number,
): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dist = 0;
  for (const k of keys) {
    const pa = (a[k] ?? 0) / Math.max(nA, 1);
    const pb = (b[k] ?? 0) / Math.max(nB, 1);
    dist += Math.abs(pa - pb);
  }
  // dist in [0, 2] → similarity
  return Math.max(0, 100 * (1 - dist / 2));
}

export type StructuralScoreDetail = {
  score: number;
  templateSim: number;
  cognitiveSim: number;
  stemEllipsisSim: number;
  fourOptionSim: number;
  optionShapeSim: number;
  indoSim: number;
  gold: SetFingerprint;
  generated: SetFingerprint;
};

export function structuralSimilarity(
  goldQuestions: GoldQuestion[],
  generatedQuestions: GoldQuestion[],
): StructuralScoreDetail {
  const gold = fingerprintSet(goldQuestions);
  const generated = fingerprintSet(generatedQuestions);

  const templateSim = histSimilarity(
    gold.templateHist,
    generated.templateHist,
    gold.n,
    generated.n,
  );
  const cognitiveSim = histSimilarity(
    gold.cognitiveHist,
    generated.cognitiveHist,
    gold.n,
    generated.n,
  );
  const optionShapeSim = histSimilarity(
    gold.optionShapeHist,
    generated.optionShapeHist,
    gold.n,
    generated.n,
  );

  const stemEllipsisSim =
    100 * (1 - Math.abs(gold.stemEllipsisRate - generated.stemEllipsisRate));
  const fourOptionSim =
    100 * (1 - Math.abs(gold.fourOptionRate - generated.fourOptionRate));
  const indoSim =
    100 *
    (1 -
      Math.min(
        1,
        Math.abs(gold.avgIndonesianMarkers - generated.avgIndonesianMarkers) / 6,
      ));

  // Weight text/pattern features higher; de-emphasize image lead-ins for fairness
  const score =
    templateSim * 0.35 +
    cognitiveSim * 0.15 +
    stemEllipsisSim * 0.2 +
    fourOptionSim * 0.15 +
    optionShapeSim * 0.1 +
    indoSim * 0.05;

  return {
    score: Math.round(score * 10) / 10,
    templateSim: Math.round(templateSim * 10) / 10,
    cognitiveSim: Math.round(cognitiveSim * 10) / 10,
    stemEllipsisSim: Math.round(stemEllipsisSim * 10) / 10,
    fourOptionSim: Math.round(fourOptionSim * 10) / 10,
    optionShapeSim: Math.round(optionShapeSim * 10) / 10,
    indoSim: Math.round(indoSim * 10) / 10,
    gold,
    generated,
  };
}
