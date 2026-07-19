/** Topics that benefit from computation-heavy question sets (math & numeric science). */
const QUANTITATIVE_TOPIC_RE =
  /\b(matematika|aljabar|geometri|trigonometri|kalkulus|statistik|peluang|probabilitas|bangun\s+datar|bangun\s+ruang|segitiga|lingkaran|persegi|jajar\s+genjang|belah\s+ketupat|layang|trapesium|pecahan|desimal|persen|bilangan|operasi|persamaan|pertidaksamaan|fungsi|grafik|luas|keliling|volume|sudut|pythagoras|teorema|fisika|kimia|stoikiometri|hitung|rumus)\b/i;

/**
 * Conceptual IPA / life-science topics (biology, ecology, genetics without
 * heavy calculation focus). Checked before quantitative when both could match.
 */
const CONCEPTUAL_SCIENCE_TOPIC_RE =
  /\b(reproduksi|perkembangbiakan|pewarisan|genetik|genotipe|fenotipe|mendel|kromosom|dna|sel|organ|sistem\s+(pencernaan|pernapasan|peredaran|gerak|saraf|reproduksi|ekskresi)|fotosintesis|ekosistem|biologi|makhluk\s+hidup|tumbuhan|hewan|hormon|fertilisasi|oogenesis|spermatogenesis|vegetatif|generatif|mutasi|heredit[ae]s|ipa\b(?!.*\b(hitung|rumus|matematika)\b))\b/i;

export function isQuantitativeTopic(topic: string): boolean {
  if (isConceptualScienceTopic(topic)) return false;
  return QUANTITATIVE_TOPIC_RE.test(topic);
}

export function isConceptualScienceTopic(topic: string): boolean {
  return CONCEPTUAL_SCIENCE_TOPIC_RE.test(topic);
}

function computationTarget(grade?: string): string {
  switch (grade) {
    case 'SD':
      return 'at least 60%';
    case 'SMP':
      return 'at least 70%';
    case 'SMA':
    case 'SMK':
      return 'at least 75%';
    default:
      return 'at least two thirds';
  }
}

function buildQuantitativeGuidance(
  level: string,
  target: string,
): string {
  return `\
Quantitative topic rules (${level}):
- This is a mathematics or numeric-science topic. Prioritize problem-solving over recall of definitions.
- ${target} of questions MUST require a calculation, numeric answer, formula application, or solving with concrete values (lengths, angles, areas, ratios, etc.). Students should need to compute or substitute numbers — not only pick a verbal description.
- Prefer stems that give givens and ask for a result: "Diketahui …", "Jika … berapakah …", "Hitung …", "Panjang … adalah … cm. Tentukan …". Include units (cm, cm², °) and realistic values for ${level}.
- When a formula applies (e.g. Pythagoras, luas, keliling lingkaran), present numeric givens and test application — do not only ask what the formula means or when it holds.
- For multiple_choice with numeric answers, make all four options numbers (or short expressions like "13 cm", "$1 : 1 : \\sqrt{2}$") with plausible distractors from common mistakes (wrong operation, forgotten √, π slip, unit mix-up).
- Format all symbolic math in LaTeX $...$: stems like "Himpunan penyelesaian dari $\\sqrt{x^2 - 16} = \\sqrt{x + 4}$ adalah ...", options like "$\\{-4, 5\\}$", explanations like "Prasyarat: $x^2 - 16 \\geq 0$ dan $x + 4 \\geq 0$".
- Cap pure definition / vocabulary / "which statement is true" questions at roughly 20% of the set. Avoid stems like "Apa nama …", "Apa sifat …", "Apa perbedaan …", "Manakah pernyataan yang merupakan …", or research about student misconceptions unless the material has no numeric content at all.
- Still vary subtopics and difficulty within ${level}; use different givens, shapes, and operations across questions.`;
}

function buildConceptualScienceGuidance(level: string): string {
  return `\
Conceptual science / IPA rules (${level}) — match Indonesian textbook Uji Kompetensi style:
- Write in formal textbook Indonesian appropriate for ${level}. Prefer stems that end with "...." (four dots) before the options.
- Rotate stem templates across the set (do not use the same pattern for consecutive items). Prefer a mix of:
  1) Definition / naming: "… disebut ...."
  2) Function pairing: "Pasangan antara … dan fungsinya yang benar adalah ...."
  3) Correct statement: "Pernyataan yang benar mengenai … adalah ...."
  4) Characteristic list → diagnose: "Perhatikan ciri … berikut! … Ciri-ciri tersebut dimiliki oleh …."
  5) Short named scenario (Dayu, Siti, Andi, or "Seorang …") with one clear cause/effect ask
  6) Process / order: "Urutan … yang benar adalah ...." or "… secara berturut-turut adalah ...."
  7) Light application grounded in the material (counts, diploid/haploid, genotype/phenotype, hormone sequence) when the source supports it
- Distractors must be near-miss curriculum terms from the SAME topic (wrong organ, swapped hormone pair, haploid↔diploid, related process) — not random unrelated words and not absurd jokes.
- For multiple_choice: exactly 4 options A–D; keep option length style consistent within a question (all short terms OR all short statements).
- Cognitive mix: roughly ≤40% pure recall definitions; the rest comprehension / light application. Cap stems that are only "Apa itu X?" / "Apa nama X?".
- Ground every stem in the source material; never invent facts. If the material has no images, do not write image-dependent stems.
- Avoid AI filler tone, rhetorical flourishes, and English loanword spam. Sound like a Kurikulum Merdeka IPA exercise sheet.`;
}

/**
 * Extra system-prompt rules for math / quantitative or conceptual IPA topics.
 * Empty string when neither heuristic matches.
 */
export function buildSubjectGuidance(
  topic: string,
  grade?: string,
  classGrade?: string,
): string {
  const level =
    grade && classGrade
      ? `${grade} kelas ${classGrade}`
      : (grade ?? 'the target level');

  if (isConceptualScienceTopic(topic)) {
    return buildConceptualScienceGuidance(level);
  }

  if (!isQuantitativeTopic(topic)) return '';

  return buildQuantitativeGuidance(level, computationTarget(grade));
}

/** Extra research strategy for web/document retrieval on quantitative topics. */
export function buildQuantitativeResearchAddon(topic: string): string {
  if (!isQuantitativeTopic(topic)) return '';

  return `\
For this quantitative topic, ALSO search for:
- Formulas, rumus, and step-by-step calculation rules from the curriculum
- Worked examples and practice problems with numeric values (contoh soal, latihan, soal cerita)
- Typical measurements, ratios, and standard exercises students solve at this level
- When definitions appear, pair them with numeric applications students can compute`;
}

/** Extra research strategy for conceptual IPA topics. */
export function buildConceptualResearchAddon(topic: string): string {
  if (!isConceptualScienceTopic(topic)) return '';

  return `\
For this conceptual science topic, ALSO retrieve:
- Definitions paired with functions, processes, and contrasts (bukan hanya daftar istilah)
- Sequences / tahapan (e.g. oogenesis, fertilisasi, perkecambahan) and cause–effect pairs
- Assessment-ready facts: ciri-ciri, pasangan organ–fungsi, pernyataan benar/salah yang sering diuji
- Light application examples (kromosom haploid/diploid, genotipe→fenotipe) when present in the material`;
}
