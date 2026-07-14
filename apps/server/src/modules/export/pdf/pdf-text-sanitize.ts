import type { PDFFont } from 'pdf-lib';

import { latexToUnicode } from '../shared/latex-unicode';

export { latexToUnicode };

const FALLBACK_CHAR_REPLACEMENTS: Record<string, string> = {
  '\u2212': '-',
  '\u2013': '-',
  '\u2014': '-',
};

function replacementFor(char: string): string | null {
  if (FALLBACK_CHAR_REPLACEMENTS[char]) {
    return FALLBACK_CHAR_REPLACEMENTS[char] ?? null;
  }

  const decomposed = char.normalize('NFD');
  if (decomposed !== char) {
    const base = decomposed.replace(/\p{M}/gu, '');
    if (base && base !== char) return base;
  }

  return null;
}

// TrueType fonts embedded via fontkit don't throw on unsupported codepoints
// (pdf-lib/fontkit silently maps them to the `.notdef` glyph, i.e. a tofu
// box), unlike pdf-lib's base-14 standard fonts. Reach into the fontkit
// font when available so missing glyphs are actually detected.
type FontkitFont = { hasGlyphForCodePoint?: (codePoint: number) => boolean };

function getFontkitFont(font: PDFFont): FontkitFont | null {
  const embedder = (font as unknown as { embedder?: { font?: FontkitFont } })
    .embedder;
  return embedder?.font ?? null;
}

function isFontEncodable(font: PDFFont, char: string, size: number): boolean {
  if (!char) return true;

  const fontkitFont = getFontkitFont(font);
  if (fontkitFont?.hasGlyphForCodePoint) {
    const codePoint = char.codePointAt(0);
    return (
      codePoint !== undefined && fontkitFont.hasGlyphForCodePoint(codePoint)
    );
  }

  try {
    font.widthOfTextAtSize(char, size);
    return true;
  } catch {
    return false;
  }
}

export function sanitizePdfText(
  text: string,
  font: PDFFont,
  size = 11,
): string {
  let result = '';

  for (const char of text) {
    if (char === '\n' || char === '\t') {
      result += char;
      continue;
    }

    if (isFontEncodable(font, char, size)) {
      result += char;
      continue;
    }

    const replacement = replacementFor(char);
    if (replacement && isFontEncodable(font, replacement, size)) {
      result += replacement;
      continue;
    }

    if (char === ' ') {
      result += ' ';
    }
  }

  return result;
}

export type TextSegment = { text: string; font: PDFFont };

/**
 * Splits text into font-tagged segments, drawing math/Greek symbols the
 * body font lacks (e.g. NotoSerif has no √, ≠, ≤, ∑, …) with `mathFont`
 * instead — a Symbol standard font covers exactly that repertoire.
 */
export function resolveTextSegments(
  text: string,
  font: PDFFont,
  mathFont: PDFFont,
  size = 11,
): TextSegment[] {
  const segments: TextSegment[] = [];

  const push = (char: string, useFont: PDFFont) => {
    const last = segments[segments.length - 1];
    if (last && last.font === useFont) {
      last.text += char;
    } else {
      segments.push({ text: char, font: useFont });
    }
  };

  for (const char of text) {
    if (char === '\n' || char === '\t' || isFontEncodable(font, char, size)) {
      push(char, font);
      continue;
    }

    if (isFontEncodable(mathFont, char, size)) {
      push(char, mathFont);
      continue;
    }

    const replacement = replacementFor(char);
    if (replacement && isFontEncodable(font, replacement, size)) {
      push(replacement, font);
      continue;
    }

    if (char === ' ') {
      push(' ', font);
    }
  }

  return segments;
}

/** @deprecated Use latexToUnicode */
export const latexToPlainText = latexToUnicode;
