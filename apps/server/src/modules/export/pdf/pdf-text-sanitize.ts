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

function isFontEncodable(font: PDFFont, text: string, size: number): boolean {
  if (!text) return true;
  try {
    font.widthOfTextAtSize(text, size);
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

/** @deprecated Use latexToUnicode */
export const latexToPlainText = latexToUnicode;
