import { describe, expect, it } from 'vitest';

import { latexToUnicode } from '@/modules/export/shared/latex-unicode';
import { markdownToBlocks, plainTextFromMarkdown } from '@/modules/export/shared/markdown-blocks';

describe('latexToUnicode', () => {
  it('renders fractions as (num)/(den) instead of concatenating digits', () => {
    expect(latexToUnicode('\\frac{3}{5}')).toBe('(3)/(5)');
    expect(latexToUnicode('-\\frac{3}{5}')).toBe('-(3)/(5)');
  });

  it('renders superscripts as unicode instead of dropping the caret', () => {
    expect(latexToUnicode('x^2-2x-8')).toBe('x²-2x-8');
  });

  it('renders roots and set notation without mangling braces', () => {
    expect(latexToUnicode('\\sqrt{3-5x}')).toBe('√(3-5x)');
    expect(
      latexToUnicode(
        '\\{x \\mid x \\ge -\\frac{3}{5}, x \\in \\mathbb{R}\\}',
      ),
    ).toBe('{x ∣ x ≥ -(3)/(5), x ∈ ℝ}');
  });
});

describe('markdownToBlocks export math', () => {
  it('preserves math from inline LaTeX spans', () => {
    const text =
      'Domain dari $f(x)=\\sqrt{3-5x}$ adalah ...';
    expect(plainTextFromMarkdown(text)).toContain('√(3-5x)');

    const option =
      '$\\{x \\mid x \\ge -\\frac{3}{5}, x \\in \\mathbb{R}\\}$';
    expect(plainTextFromMarkdown(option)).toBe(
      '{x ∣ x ≥ -(3)/(5), x ∈ ℝ}',
    );
  });

  it('returns structured runs for mixed prose and math', () => {
    const blocks = markdownToBlocks('Nilai $x^2$ dan $\\frac{1}{2}$.');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: 'paragraph' });
    if (blocks[0]?.type !== 'paragraph') return;

    expect(blocks[0].runs.map((run) => run.text).join('')).toBe(
      'Nilai x² dan (1)/(2).',
    );
  });
});
