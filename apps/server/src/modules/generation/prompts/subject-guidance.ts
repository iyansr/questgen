/** Topics that benefit from computation-heavy question sets (math & numeric science). */
const QUANTITATIVE_TOPIC_RE =
  /\b(matematika|aljabar|geometri|trigonometri|kalkulus|statistik|statistika|peluang|probabilitas|bangun\s+datar|bangun\s+ruang|segitiga|lingkaran|persegi|jajar\s+genjang|belah\s+ketupat|layang|trapesium|pecahan|desimal|persen|bilangan|pola\s+bilangan|koordinat|kartesius|relasi|operasi|persamaan|pertidaksamaan|fungsi|grafik|luas|keliling|volume|sudut|pythagoras|teorema|fisika|kimia|stoikiometri|hitung|rumus)\b/i;

/**
 * Optional science-flavoured extras (biology / IPA). Does NOT gate the main
 * conceptual guidance — any non-quantitative topic gets general assessment rules.
 */
const CONCEPTUAL_SCIENCE_TOPIC_RE =
  /\b(reproduksi|perkembangbiakan|pewarisan|genetik|genotipe|fenotipe|mendel|kromosom|dna|sel|organ|sistem\s+(pencernaan|pernapasan|peredaran|gerak|saraf|reproduksi|ekskresi)|fotosintesis|ekosistem|biologi|bioteknologi|makhluk\s+hidup|tumbuhan|hewan|hormon|fertilisasi|oogenesis|spermatogenesis|vegetatif|generatif|mutasi|heredit[ae]s|tekanan\s+zat|kemagnetan|magnet|partikel\s+penyusun|gerak\s+benda|usaha\s+dan\s+pesawat|pesawat\s+sederhana|struktur\s+dan\s+fungsi|ipa\b(?!.*\b(hitung|rumus|matematika)\b))\b/i;

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

function buildQuantitativeGuidance(level: string, target: string): string {
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

/**
 * Subject-agnostic Uji Kompetensi / textbook-assessment rules for ANY
 * non-quantitative topic (IPA, IPS, PPKn, Bahasa, Sejarah, Agama, seni, …).
 */
function buildConceptualGuidance(level: string, topic: string): string {
  const scienceExtra = isConceptualScienceTopic(topic)
    ? `\
Science-flavoured extras (only when the material supports them):
- Pairing organ/part ↔ function, ciri-ciri → identify, process order, and light numeric application (e.g. haploid/diploid) are welcome
- Near-miss distractors may swap related curriculum terms (wrong organ, hormone pair, process stage)
`
    : '';

  return `\
General assessment / Uji Kompetensi rules (${level}) — apply for this topic regardless of subject:
- Write in formal textbook Indonesian appropriate for ${level}. Prefer stems that end with "...." (four dots) before the options.
- Match the subject's natural exercise voice (PPKn/IPS/Bahasa/Sejarah/IPA/etc.) using ONLY facts from the source material — do not force science metaphors onto non-science topics.
- Rotate stem templates across the set (do not reuse the same pattern consecutively). Prefer a mix drawn from what the material allows:
  1) Definition / naming: "… disebut ...." / "… adalah ...."
  2) Correct statement: "Pernyataan yang benar mengenai … adalah ...."
  3) Matching / pairing: "Pasangan … yang tepat adalah ...." (terms↔meanings, events↔years, articles↔contents, causes↔effects — as relevant)
  4) Characteristic / evidence list → conclude: "Perhatikan ciri/data berikut! … Hal tersebut menunjukkan ...."
  5) Short scenario grounded in the material (named student or "Seorang …") with one clear ask
  6) Order / steps / chronology: "Urutan … yang benar adalah ...."
  7) Light application or interpretation (map a rule to a case, read a short table/quote) when the source supports it
- Distractors must be plausible near-misses from the SAME topic and material — not unrelated jokes, not other subjects.
- For multiple_choice: exactly 4 options A–D; keep option length style consistent within a question (all short terms OR all short statements).
- Cognitive mix: roughly ≤40% pure recall / vocabulary; the rest comprehension or light application. Cap stems that are only "Apa itu X?" / "Apa nama X?".
- Ground every stem in the source material; never invent facts, laws, ayat, dates, or figures. If the material has no images, do not write image-dependent stems.
- Avoid AI filler tone, rhetorical flourishes, "mari kita", and English loanword spam. Sound like a printed Kurikulum Merdeka exercise sheet for this subject.
${scienceExtra}`;
}

/**
 * Extra system-prompt rules by topic type.
 * - Quantitative → math/calc rules
 * - Otherwise → general conceptual assessment rules (any subject)
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

  if (isQuantitativeTopic(topic)) {
    return buildQuantitativeGuidance(level, computationTarget(grade));
  }

  return buildConceptualGuidance(level, topic);
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

/**
 * Extra research strategy for non-quantitative topics (any subject).
 * Kept name for call-site compatibility; applies beyond IPA.
 */
export function buildConceptualResearchAddon(topic: string): string {
  if (isQuantitativeTopic(topic)) return '';

  const scienceBit = isConceptualScienceTopic(topic)
    ? `\
- Sequences / tahapan and cause–effect pairs when present (e.g. processes, cycles)
- Light application examples grounded in the material`
    : `\
- Cases, examples, chronology, or rule→application pairs when present in the material`;

  return `\
For this topic, ALSO retrieve:
- Definitions paired with contrasts, roles/functions, and key distinctions (bukan hanya daftar istilah)
- Assessment-ready facts: pernyataan benar/salah, ciri-ciri, pasangan konsep, contoh penerapan yang sering diuji
${scienceBit}`;
}
