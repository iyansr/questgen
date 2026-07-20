/**
 * Order-invariant tone helpers for comparing assessment stems.
 * Shared by eval harness and unit tests.
 */

/**
 * Normalize Indonesian assessment stems for cheap lexical overlap.
 * Treats "Apa yang dimaksud X", "Apa pengertian X", "X adalah ...." as related.
 */
export function normalizeStemForTone(stem: string): string {
  return stem
    .toLowerCase()
    .replace(/[….]+$/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(
      /\b(apa yang dimaksud dengan|apa yang dimaksud|apa pengertian|pengertian|yang dimaksud|disebut|adalah|merupakan|bagaimanakah|bagaimana|manakah|berikut ini|perhatikan|berdasarkan|tentang|dari|pada|dengan|dalam|untuk|yang|dan|atau|suatu|sebuah|seorang)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

export function lexicalToneSimilarity(a: string, b: string): number {
  const ta = new Set(
    normalizeStemForTone(a)
      .split(' ')
      .filter((w) => w.length > 2),
  );
  const tb = new Set(
    normalizeStemForTone(b)
      .split(' ')
      .filter((w) => w.length > 2),
  );
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter += 1;
  const union = ta.size + tb.size - inter;
  return Math.round((100 * inter) / Math.max(union, 1));
}
