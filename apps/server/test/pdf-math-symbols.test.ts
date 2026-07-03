import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { embedExamFonts } from '@/modules/export/pdf/pdf-fonts';
import { resolveTextSegments } from '@/modules/export/pdf/pdf-text-sanitize';

// NotoSerif (the exam body font) has no glyphs for these; regression test
// for tofu boxes (e.g. "a√2" rendering as "a[]2") caused by fontkit
// silently mapping unsupported codepoints to `.notdef` instead of throwing.
const MATH_SYMBOLS = ['√', '≠', '≤', '≥', '≈', '∑', '∫', '∂', '∇', '∞'];

describe('PDF math symbol fallback', () => {
  it('renders symbols missing from NotoSerif using the Symbol fallback font, never .notdef', async () => {
    const doc = await PDFDocument.create();
    const fonts = await embedExamFonts(doc);

    for (const symbol of MATH_SYMBOLS) {
      const segments = resolveTextSegments(`a${symbol}2`, fonts.regular, fonts.math);
      const symbolSegment = segments.find((s) => s.text.includes(symbol));

      expect(symbolSegment, `no segment produced for ${symbol}`).toBeDefined();
      expect(symbolSegment?.font).toBe(fonts.math);

      const hex = symbolSegment?.font.encodeText(symbol).toString();
      expect(hex, `${symbol} encoded as .notdef`).not.toBe('<0000>');
    }
  });

  it('still uses the regular font for plain text', async () => {
    const doc = await PDFDocument.create();
    const fonts = await embedExamFonts(doc);

    const segments = resolveTextSegments('a2', fonts.regular, fonts.math);
    expect(segments).toEqual([{ text: 'a2', font: fonts.regular }]);
  });

  it('sanity check: the Symbol standard font is used as the math fallback', async () => {
    const doc = await PDFDocument.create();
    const fonts = await embedExamFonts(doc);
    const symbolFont = await doc.embedFont(StandardFonts.Symbol);
    expect(fonts.math.name).toBe(symbolFont.name);
  });
});
