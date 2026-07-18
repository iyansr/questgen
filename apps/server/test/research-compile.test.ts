import { describe, expect, it } from 'vitest';

import {
  MIN_COMPILE_LENGTH,
  resolveSourceMaterial,
} from '@/modules/generation/search/resolve-source-material';

describe('resolveSourceMaterial', () => {
  it('returns usable compile text as-is', () => {
    const compiled = 'A'.repeat(MIN_COMPILE_LENGTH);
    expect(resolveSourceMaterial(compiled, ['ignored excerpt'])).toBe(compiled);
  });

  it('trims usable compile text', () => {
    const compiled = `  ${'B'.repeat(MIN_COMPILE_LENGTH)}  `;
    expect(resolveSourceMaterial(compiled, [])).toBe(
      'B'.repeat(MIN_COMPILE_LENGTH),
    );
  });

  it('stitches excerpts when compile is empty or short', () => {
    const result = resolveSourceMaterial('short', [
      'First chunk about photosynthesis.',
      'Second chunk about chloroplasts.',
    ]);
    expect(result).toContain('## Excerpt 1');
    expect(result).toContain('First chunk about photosynthesis.');
    expect(result).toContain('## Excerpt 2');
    expect(result).toContain('Second chunk about chloroplasts.');
  });

  it('returns empty string when compile is short and no excerpts', () => {
    expect(resolveSourceMaterial('', [])).toBe('');
    expect(resolveSourceMaterial('tiny', ['  ', ''])).toBe('');
  });
});
