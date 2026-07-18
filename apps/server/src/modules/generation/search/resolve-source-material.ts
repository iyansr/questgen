/** Minimum usable compile length before falling back to stitching excerpts. */
export const MIN_COMPILE_LENGTH = 80;

/**
 * Prefer LLM-compiled markdown; if empty/short, stitch excerpts so QG never
 * gets an empty sourceMaterial when retrieval actually returned content.
 */
export function resolveSourceMaterial(
  compiled: string,
  excerpts: string[],
): string {
  const trimmed = compiled.trim();
  if (trimmed.length >= MIN_COMPILE_LENGTH) return trimmed;

  const usable = excerpts.map((e) => e.trim()).filter(Boolean);
  if (usable.length === 0) return '';

  return usable.map((text, i) => `## Excerpt ${i + 1}\n\n${text}`).join('\n\n');
}
