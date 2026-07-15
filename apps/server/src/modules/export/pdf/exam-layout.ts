import {
  type PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  rgb,
} from 'pdf-lib';

import type { TextStyle } from '../shared/markdown-blocks';
import {
  resolveTextSegments,
  sanitizePdfText,
  type TextSegment,
} from './pdf-text-sanitize';

export const PAGE_WIDTH = 595.28;
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 71;
export const FOOTER_HEIGHT = 28;
export const LINE_HEIGHT = 1.35;
export const QUESTION_IMAGE_MAX_WIDTH_PT = 300;
export const QUESTION_IMAGE_MAX_HEIGHT_PT = 220;

export type FontSet = {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
  /** Fallback font for math/Greek symbols the body font can't encode. */
  math: PDFFont;
};

export function fontForStyle(fonts: FontSet, style: TextStyle): PDFFont {
  switch (style) {
    case 'bold':
      return fonts.bold;
    case 'italic':
      return fonts.italic;
    case 'boldItalic':
      return fonts.boldItalic;
    default:
      return fonts.regular;
  }
}

export class ExamLayout {
  private doc: PDFDocument;
  private fonts: FontSet;
  private page: PDFPage;
  private y: number;
  private pageIndex = 0;
  private readonly contentWidth: number;
  private readonly onNewPage?: (page: PDFPage, pageIndex: number) => void;

  constructor(
    doc: PDFDocument,
    fonts: FontSet,
    onNewPage?: (page: PDFPage, pageIndex: number) => void,
  ) {
    this.doc = doc;
    this.fonts = fonts;
    this.onNewPage = onNewPage;
    this.contentWidth = PAGE_WIDTH - MARGIN * 2;
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageIndex = 1;
    this.y = PAGE_HEIGHT - MARGIN;
    this.onNewPage?.(this.page, this.pageIndex);
  }

  get currentPage(): PDFPage {
    return this.page;
  }

  get currentY(): number {
    return this.y;
  }

  get pages(): PDFPage[] {
    return this.doc.getPages();
  }

  ensureSpace(height: number): void {
    if (this.y - height < MARGIN + FOOTER_HEIGHT) {
      this.newPage();
    }
  }

  newPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.pageIndex += 1;
    this.y = PAGE_HEIGHT - MARGIN;
    this.onNewPage?.(this.page, this.pageIndex);
  }

  moveY(amount: number): void {
    this.y -= amount;
  }

  drawLine(
    text: string,
    options: {
      size?: number;
      style?: TextStyle;
      align?: 'left' | 'center' | 'right';
      indent?: number;
      maxWidth?: number;
    } = {},
  ): void {
    const size = options.size ?? 11;
    const style = options.style ?? 'normal';
    const font = fontForStyle(this.fonts, style);
    const indent = options.indent ?? 0;
    const maxWidth = options.maxWidth ?? this.contentWidth - indent;
    const lineHeight = size * LINE_HEIGHT;

    const segments = resolveTextSegments(text, font, this.fonts.math, size);
    const lines = wrapSegments(segments, size, maxWidth);
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      const width = lineWidth(line, size);
      let x = MARGIN + indent;
      if (options.align === 'center') {
        x = MARGIN + (this.contentWidth - width) / 2;
      } else if (options.align === 'right') {
        x = MARGIN + this.contentWidth - width;
      }
      x = this.drawSegments(line, x, size);
      this.y -= lineHeight;
    }
  }

  private drawSegments(
    segments: TextSegment[],
    startX: number,
    size: number,
  ): number {
    let x = startX;
    for (const segment of segments) {
      this.page.drawText(segment.text, {
        x,
        y: this.y,
        size,
        font: segment.font,
        color: rgb(0, 0, 0),
      });
      x += segment.font.widthOfTextAtSize(segment.text, size);
    }
    return x;
  }

  drawRuns(
    runs: { text: string; style: TextStyle }[],
    options: {
      size?: number;
      indent?: number;
      maxWidth?: number;
    } = {},
  ): void {
    const size = options.size ?? 11;
    const indent = options.indent ?? 0;
    const maxWidth = options.maxWidth ?? this.contentWidth - indent;
    const lineHeight = size * LINE_HEIGHT;

    const segments = runs.flatMap((run) =>
      resolveTextSegments(
        run.text,
        fontForStyle(this.fonts, run.style),
        this.fonts.math,
        size,
      ),
    );
    const lines = wrapSegments(segments, size, maxWidth);

    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.drawSegments(line, MARGIN + indent, size);
      this.y -= lineHeight;
    }
  }

  drawImage(
    image: PDFImage,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      indent?: number;
      paddingAfter?: number;
    } = {},
  ): void {
    const indent = options.indent ?? 0;
    const availableWidth = this.contentWidth - indent;
    const maxWidth =
      options.maxWidth ??
      Math.min(availableWidth * 0.72, QUESTION_IMAGE_MAX_WIDTH_PT);
    const maxHeight = options.maxHeight ?? QUESTION_IMAGE_MAX_HEIGHT_PT;
    const paddingAfter = options.paddingAfter ?? 8;
    const dims = image.scale(1);
    const scale = Math.min(maxWidth / dims.width, maxHeight / dims.height, 1);
    const width = dims.width * scale;
    const height = dims.height * scale;

    this.ensureSpace(height + paddingAfter);
    this.page.drawImage(image, {
      x: MARGIN + indent,
      y: this.y - height,
      width,
      height,
    });
    this.y -= height + paddingAfter;
  }

  drawSpacer(height: number): void {
    this.ensureSpace(height);
    this.y -= height;
  }

  drawHorizontalRule(): void {
    this.ensureSpace(12);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.5,
      color: rgb(0.2, 0.2, 0.2),
    });
    this.y -= 12;
  }

  drawDottedField(
    label: string,
    fieldWidth: number,
    options: { size?: number; x?: number; advanceY?: boolean } = {},
  ): void {
    const size = options.size ?? 11;
    const font = this.fonts.regular;
    const x = options.x ?? MARGIN;
    const lineHeight = size * LINE_HEIGHT;
    const advanceY = options.advanceY ?? true;

    this.ensureSpace(lineHeight);
    const safeLabel = sanitizePdfText(label, font, size);
    this.page.drawText(safeLabel, {
      x,
      y: this.y,
      size,
      font,
      color: rgb(0, 0, 0),
    });

    const labelWidth = font.widthOfTextAtSize(safeLabel, size);
    const dotStart = x + labelWidth + 4;
    // fieldWidth = total slot from x (label + dots), not dot-only width
    const dotEnd = x + fieldWidth;
    const dotY = this.y - size * 0.15;

    this.page.drawLine({
      start: { x: dotStart, y: dotY },
      end: { x: dotEnd, y: dotY },
      thickness: 0.5,
      dashArray: [1.5, 2.5],
      color: rgb(0.35, 0.35, 0.35),
    });

    if (advanceY) {
      this.y -= lineHeight;
    }
  }

  drawDottedFieldPair(
    leftLabel: string,
    rightLabel: string,
    options: { size?: number } = {},
  ): void {
    const size = options.size ?? 11;
    const contentWidth = PAGE_WIDTH - MARGIN * 2;
    const gap = 24;
    const fieldWidth = (contentWidth - gap) / 2;

    this.drawDottedField(leftLabel, fieldWidth, { size, advanceY: false });
    this.drawDottedField(rightLabel, fieldWidth, {
      size,
      x: MARGIN + fieldWidth + gap,
      advanceY: true,
    });
  }
}

function lineWidth(line: TextSegment[], size: number): number {
  return line.reduce(
    (sum, segment) => sum + segment.font.widthOfTextAtSize(segment.text, size),
    0,
  );
}

/**
 * Word-wraps font-tagged segments (as produced by `resolveTextSegments`)
 * into lines, merging adjacent same-font pieces so a symbol mid-word
 * (e.g. the √ in "a√2") doesn't force an extra draw call per character.
 */
function wrapSegments(
  segments: TextSegment[],
  size: number,
  maxWidth: number,
): TextSegment[][] {
  const lines: TextSegment[][] = [[]];
  let currentWidth = 0;

  const pushPart = (text: string, font: PDFFont) => {
    if (!text) return;
    const partWidth = font.widthOfTextAtSize(text, size);
    if (
      currentWidth + partWidth > maxWidth &&
      currentWidth > 0 &&
      !/^\s+$/.test(text)
    ) {
      lines.push([]);
      currentWidth = 0;
    }
    const activeLine = lines[lines.length - 1] ?? [];
    const last = activeLine[activeLine.length - 1];
    if (last && last.font === font) {
      last.text += text;
    } else {
      activeLine.push({ text, font });
    }
    currentWidth += partWidth;
  };

  for (const segment of segments) {
    for (const part of segment.text.split(/(\s+)/)) {
      pushPart(part, segment.font);
    }
  }

  return lines.filter((line) => line.length > 0);
}

export function drawPageFooter(
  pages: PDFPage[],
  fonts: FontSet,
  schoolName?: string,
): void {
  const total = pages.length;
  const size = 9;
  const footerY = MARGIN / 2 + 4;
  const kopLabel = schoolName?.trim()
    ? sanitizePdfText(schoolName.trim(), fonts.regular, size)
    : null;

  pages.forEach((page, index) => {
    page.drawLine({
      start: { x: MARGIN, y: MARGIN - 4 },
      end: { x: PAGE_WIDTH - MARGIN, y: MARGIN - 4 },
      thickness: 0.5,
      color: rgb(0.75, 0.75, 0.75),
    });

    const leftLabel = sanitizePdfText(
      `A4  |  ${index + 1} dari ${total}`,
      fonts.regular,
      size,
    );
    page.drawText(leftLabel, {
      x: MARGIN,
      y: footerY,
      size,
      font: fonts.regular,
      color: rgb(0.45, 0.45, 0.45),
    });

    if (kopLabel) {
      const kopWidth = fonts.regular.widthOfTextAtSize(kopLabel, size);
      page.drawText(kopLabel, {
        x: PAGE_WIDTH - MARGIN - kopWidth,
        y: footerY,
        size,
        font: fonts.regular,
        color: rgb(0.45, 0.45, 0.45),
      });
    }
  });
}
