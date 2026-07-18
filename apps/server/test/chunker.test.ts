import { describe, expect, it } from 'vitest';

import { chunkText } from '@/modules/processing/chunker';

const MULTI_SECTION_DOC = `
# Sistem Reproduksi pada Manusia

## A. Organ Reproduksi pada Perempuan

### Pembelahan Sel

Mitosis dan meiosis pada oogenesis. Sel telur terbentuk melalui tahapan yang kompleks.

## 1. Organ Reproduksi pada Laki-Laki

Alat kelamin laki-laki mencakup testis dan penis. Spermatogenesis menghasilkan spermatozoon.
`.trim();

describe('chunkText heading path', () => {
  it('does not stamp first H2/H3 onto male-section chunks', async () => {
    const chunks = await chunkText(MULTI_SECTION_DOC, [], {
      chunkSize: 800,
      chunkOverlap: 50,
    });

    expect(chunks.length).toBeGreaterThan(0);

    const maleChunks = chunks.filter(
      (c) =>
        c.headingPath.includes('Laki-Laki') ||
        c.text.includes('Spermatogenesis'),
    );
    expect(maleChunks.length).toBeGreaterThan(0);

    for (const chunk of maleChunks) {
      expect(chunk.headingPath).not.toContain(
        'Organ Reproduksi pada Perempuan',
      );
      expect(chunk.headingPath).not.toContain('Pembelahan Sel');
      expect(chunk.text.includes('› ## A. Organ Reproduksi pada Perempuan')).toBe(
        false,
      );
      expect(chunk.headingPath).toContain('Laki-Laki');
    }
  });

  it('uses local H2 path for female-section chunks', async () => {
    const chunks = await chunkText(MULTI_SECTION_DOC, [], {
      chunkSize: 800,
      chunkOverlap: 50,
    });

    const femaleChunks = chunks.filter((c) =>
      c.headingPath.includes('Organ Reproduksi pada Perempuan'),
    );
    expect(femaleChunks.length).toBeGreaterThan(0);
    for (const chunk of femaleChunks) {
      expect(chunk.headingPath).toContain('Organ Reproduksi pada Perempuan');
      expect(chunk.headingPath).toContain('Pembelahan Sel');
      expect(chunk.headingPath).not.toContain('Laki-Laki');
    }
  });

  it('handles empty and heading-less markdown', async () => {
    expect(await chunkText('', [])).toEqual([]);
    expect(await chunkText('   \n\n  ', [])).toEqual([]);

    const plain = await chunkText('Paragraf tanpa heading sama sekali.', []);
    expect(plain.length).toBeGreaterThan(0);
    expect(plain[0]?.headingPath).toBe('');
    expect(plain[0]?.text).toContain('Paragraf tanpa heading');
  });
});
