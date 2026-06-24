import fontkit from '@pdf-lib/fontkit';
import type { PDFDocument } from 'pdf-lib';

import type { FontSet } from './exam-layout';
import boldBytes from './fonts/NotoSerif-Bold.ttf';
import boldItalicBytes from './fonts/NotoSerif-BoldItalic.ttf';
import italicBytes from './fonts/NotoSerif-Italic.ttf';
import regularBytes from './fonts/NotoSerif-Regular.ttf';

function toUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

export async function embedExamFonts(doc: PDFDocument): Promise<FontSet> {
  doc.registerFontkit(fontkit);

  const [regular, bold, italic, boldItalic] = await Promise.all([
    doc.embedFont(toUint8Array(regularBytes)),
    doc.embedFont(toUint8Array(boldBytes)),
    doc.embedFont(toUint8Array(italicBytes)),
    doc.embedFont(toUint8Array(boldItalicBytes)),
  ]);

  return { regular, bold, italic, boldItalic };
}
