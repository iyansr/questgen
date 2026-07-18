/** Evenly spaced indices across `[0, total)`. */
export function pickStratifiedIndices(total: number, n: number): number[] {
  if (total <= 0 || n <= 0) return [];
  if (n >= total) return Array.from({ length: total }, (_, i) => i);
  if (n === 1) return [Math.floor((total - 1) / 2)];

  const indices = new Set<number>();
  for (let i = 0; i < n; i++) {
    indices.add(Math.round((i * (total - 1)) / (n - 1)));
  }
  return [...indices].sort((a, b) => a - b);
}
