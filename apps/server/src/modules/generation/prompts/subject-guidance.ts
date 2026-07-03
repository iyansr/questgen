/** Topics that benefit from computation-heavy question sets (math & numeric science). */
const QUANTITATIVE_TOPIC_RE =
  /\b(matematika|aljabar|geometri|trigonometri|kalkulus|statistik|peluang|probabilitas|bangun\s+datar|bangun\s+ruang|segitiga|lingkaran|persegi|jajar\s+genjang|belah\s+ketupat|layang|trapesium|pecahan|desimal|persen|bilangan|operasi|persamaan|pertidaksamaan|fungsi|grafik|luas|keliling|volume|sudut|pythagoras|teorema|fisika|ipa|kimia|stoikiometri)\b/i;

export function isQuantitativeTopic(topic: string): boolean {
  return QUANTITATIVE_TOPIC_RE.test(topic);
}

function computationTarget(grade?: string): string {
  switch (grade) {
    case 'SD':
      return 'at least 60%';
    case 'SMP':
      return 'at least 70%';
    case 'SMA':
      return 'at least 75%';
    default:
      return 'at least two thirds';
  }
}

/**
 * Extra system-prompt rules for math / quantitative topics. Empty string otherwise.
 */
export function buildSubjectGuidance(
  topic: string,
  grade?: string,
  classGrade?: string,
): string {
  if (!isQuantitativeTopic(topic)) return '';

  const level =
    grade && classGrade
      ? `${grade} kelas ${classGrade}`
      : (grade ?? 'the target level');

  const target = computationTarget(grade);

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
