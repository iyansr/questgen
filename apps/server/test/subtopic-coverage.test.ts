import { describe, expect, it } from 'vitest';

import {
  dedupeQueries,
  extractHeadingLeaves,
  mergeQueries,
} from '@/modules/generation/search/expand-subtopic-queries';
import { pickStratifiedIndices } from '@/modules/processing/stratified-sample';

describe('pickStratifiedIndices', () => {
  it('returns empty for non-positive inputs', () => {
    expect(pickStratifiedIndices(0, 5)).toEqual([]);
    expect(pickStratifiedIndices(10, 0)).toEqual([]);
  });

  it('returns all indices when n >= total', () => {
    expect(pickStratifiedIndices(4, 10)).toEqual([0, 1, 2, 3]);
  });

  it('returns middle index when n is 1', () => {
    expect(pickStratifiedIndices(5, 1)).toEqual([2]);
  });

  it('spreads evenly across the range', () => {
    expect(pickStratifiedIndices(10, 3)).toEqual([0, 5, 9]);
    expect(pickStratifiedIndices(100, 4)).toEqual([0, 33, 66, 99]);
  });
});

describe('extractHeadingLeaves', () => {
  it('prefers ## leaves when enough exist', () => {
    const text = `\
# Bab 1 Sistem Reproduksi pada Manusia
## Pembelahan Mitosis
## Pembelahan Meiosis
## Organ Reproduksi pada Laki-Laki
## Oogenesis
`;
    const leaves = extractHeadingLeaves([text], 'Sistem Reproduksi pada Manusia');
    expect(leaves).toContain('Pembelahan Mitosis');
    expect(leaves).toContain('Oogenesis');
    expect(leaves).not.toContain('Bab 1 Sistem Reproduksi pada Manusia');
  });

  it('returns empty for flat text without headings', () => {
    expect(
      extractHeadingLeaves(['Mitosis is cell division. Meiosis produces gametes.']),
    ).toEqual([]);
  });

  it('falls back to non-topic # headings when few ##', () => {
    const text = `\
# Pendahuluan
# Glosarium
## Hanya satu
`;
    const leaves = extractHeadingLeaves([text], 'Sistem Reproduksi');
    expect(leaves).toContain('Hanya satu');
    expect(leaves).toContain('Pendahuluan');
    expect(leaves).toContain('Glosarium');
  });
});

describe('dedupeQueries / mergeQueries', () => {
  it('dedupes exact and near-duplicate queries', () => {
    expect(
      dedupeQueries([
        'pembelahan mitosis',
        'Pembelahan Mitosis',
        'pembelahan mitosis pada manusia',
        'oogenesis',
      ]),
    ).toEqual(['pembelahan mitosis', 'oogenesis']);
  });

  it('caps at max', () => {
    expect(dedupeQueries(['a', 'b', 'c', 'd'], 2)).toEqual(['a', 'b']);
  });

  it('merges without repeating existing', () => {
    expect(
      mergeQueries(['mitosis', 'meiosis'], ['meiosis', 'oogenesis', 'mitosis']),
    ).toEqual(['mitosis', 'meiosis', 'oogenesis']);
  });
});
