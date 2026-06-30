import { TextRun as DocxTextRun } from 'docx';

import type { TextRun, TextStyle } from '../shared/markdown-blocks';
import { BODY_SIZE, FONT_FAMILY } from './docx-layout';

function styleFlags(style: TextStyle): { bold?: boolean; italics?: boolean } {
  switch (style) {
    case 'bold':
      return { bold: true };
    case 'italic':
      return { italics: true };
    case 'boldItalic':
      return { bold: true, italics: true };
    default:
      return {};
  }
}

export function runsToDocx(
  runs: TextRun[],
  size = BODY_SIZE,
): DocxTextRun[] {
  return runs.map(
    (run) =>
      new DocxTextRun({
        text: run.text,
        font: FONT_FAMILY,
        size,
        ...styleFlags(run.style),
      }),
  );
}

export function textToDocx(
  text: string,
  options: { size?: number; bold?: boolean; italics?: boolean } = {},
): DocxTextRun {
  return new DocxTextRun({
    text,
    font: FONT_FAMILY,
    size: options.size ?? BODY_SIZE,
    bold: options.bold,
    italics: options.italics,
  });
}
