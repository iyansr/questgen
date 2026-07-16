import type { questions } from '@questgen/db/schema';
import {
  AlignmentType,
  BorderStyle,
  Footer,
  ImageRun,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TabStopPosition,
  TabStopType,
  TextRun,
  WidthType,
} from 'docx';

import type { ExportDocxInput } from '../export.schema';
import {
  buildSubtitle,
  isMultipleChoice,
  type QuestionOption,
} from '../shared/exam-helpers';
import { loadQuestionImage } from '../shared/image-loader';
import {
  type ContentBlock,
  markdownToBlocks,
  type TextRun as MdTextRun,
} from '../shared/markdown-blocks';
import {
  BODY_SIZE,
  FONT_FAMILY,
  FOOTER_SIZE,
  OPTION_INDENT,
  QUESTION_INDENT,
  scaleImageDimensions,
  TITLE_SIZE,
} from './docx-layout';
import { runsToDocx, textToDocx } from './runs-to-docx';

type QuestionRow = typeof questions.$inferSelect;

function spacer(after = 120): Paragraph {
  return new Paragraph({ spacing: { after } });
}

function horizontalRule(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    },
    spacing: { after: 160 },
  });
}

function dottedFieldParagraph(label: string): Paragraph {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.DOTTED, size: 4, color: '595959' },
    },
    spacing: { after: 200 },
    children: [textToDocx(label)],
  });
}

const TABLE_BORDER = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
} as const;

function markdownTableToDocx(
  header: MdTextRun[][],
  rows: MdTextRun[][][],
  size: number,
): Table {
  const colCount = Math.max(header.length, ...rows.map((r) => r.length), 1);
  const colPct = Math.floor(100 / colCount);

  const cellBorders = {
    top: TABLE_BORDER,
    bottom: TABLE_BORDER,
    left: TABLE_BORDER,
    right: TABLE_BORDER,
  };

  const makeCell = (runs: MdTextRun[], bold: boolean) =>
    new TableCell({
      width: { size: colPct, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      children: [
        new Paragraph({
          children:
            runs.length > 0
              ? runsToDocx(
                  bold
                    ? runs.map((r) =>
                        r.style === 'normal' ? { ...r, style: 'bold' } : r,
                      )
                    : runs,
                  size,
                )
              : [textToDocx('', { size })],
        }),
      ],
    });

  const makeRow = (cells: MdTextRun[][], isHeader: boolean) =>
    new TableRow({
      children: Array.from({ length: colCount }, (_, i) =>
        makeCell(cells[i] ?? [], isHeader),
      ),
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [makeRow(header, true), ...rows.map((r) => makeRow(r, false))],
  });
}

function blocksToParagraphs(
  blocks: ContentBlock[],
  options: { indent?: number; size?: number } = {},
): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const indent = options.indent;
  const size = options.size ?? BODY_SIZE;

  for (const block of blocks) {
    if (block.type === 'paragraph') {
      out.push(
        new Paragraph({
          indent: indent ? { left: indent } : undefined,
          spacing: { after: 80 },
          children: runsToDocx(block.runs, size),
        }),
      );
    } else if (block.type === 'list') {
      block.items.forEach((item, index) => {
        const prefix = block.ordered ? `${index + 1}. ` : '• ';
        out.push(
          new Paragraph({
            indent: indent ? { left: indent + 240 } : { left: 240 },
            spacing: { after: 80 },
            children: [textToDocx(prefix), ...runsToDocx(item, size)],
          }),
        );
      });
    } else if (block.type === 'table') {
      out.push(markdownTableToDocx(block.header, block.rows, size));
      out.push(spacer(120));
    }
  }

  return out;
}

export function buildExamHeaderChildren(
  options: ExportDocxInput,
): (Paragraph | Table)[] {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        textToDocx(options.documentTitle, { size: TITLE_SIZE, bold: true }),
      ],
    }),
  ];

  const subtitle = buildSubtitle(options);
  if (subtitle) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [textToDocx(subtitle)],
      }),
    );
  }

  children.push(horizontalRule(), spacer(160));

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: {
                  style: BorderStyle.DOTTED,
                  size: 4,
                  color: '595959',
                },
              },
              children: [new Paragraph({ children: [textToDocx('Nama :')] })],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: {
                  style: BorderStyle.DOTTED,
                  size: 4,
                  color: '595959',
                },
              },
              children: [new Paragraph({ children: [textToDocx('Kelas :')] })],
            }),
          ],
        }),
      ],
    }),
    dottedFieldParagraph('Hari/Tanggal :'),
    horizontalRule(),
    spacer(200),
  );

  return children;
}

function readImageDimensions(
  bytes: Uint8Array,
  mimeType: 'image/png' | 'image/jpeg',
): { width: number; height: number } {
  if (mimeType === 'image/png' && bytes.length >= 24) {
    const width =
      (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!;
    const height =
      (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!;
    if (width > 0 && height > 0) {
      return scaleImageDimensions(width, height);
    }
  }

  if (
    mimeType === 'image/jpeg' &&
    bytes.length >= 2 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8
  ) {
    let offset = 2;
    while (offset < bytes.length - 8) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1]!;
      const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
      if (marker === 0xc0 || marker === 0xc2) {
        const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!;
        const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!;
        if (width > 0 && height > 0) {
          return scaleImageDimensions(width, height);
        }
        break;
      }
      offset += 2 + length;
    }
  }

  return { width: 400, height: 293 };
}

export async function buildQuestionChildren(
  question: QuestionRow,
  index: number,
): Promise<(Paragraph | Table)[]> {
  const paragraphs: (Paragraph | Table)[] = [];
  const stemBlocks = markdownToBlocks(question.questionText);

  let loadedImage: Awaited<ReturnType<typeof loadQuestionImage>> = null;
  if (question.imageUrl) {
    loadedImage = await loadQuestionImage(question.imageUrl);
  }

  if (loadedImage) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 160 },
        children: [textToDocx(`${index + 1}.`, { bold: true })],
      }),
    );

    const { width, height } = readImageDimensions(
      loadedImage.bytes,
      loadedImage.mimeType,
    );

    paragraphs.push(
      new Paragraph({
        indent: { left: QUESTION_INDENT },
        spacing: { after: 200 },
        children: [
          new ImageRun({
            type: loadedImage.mimeType === 'image/png' ? 'png' : 'jpg',
            data: loadedImage.bytes,
            transformation: { width, height },
          }),
        ],
      }),
    );

    paragraphs.push(
      ...blocksToParagraphs(stemBlocks, { indent: QUESTION_INDENT }),
    );
  } else {
    const firstParagraph = stemBlocks.find((b) => b.type === 'paragraph');
    const restBlocks = stemBlocks.filter((b) => b !== firstParagraph);

    if (firstParagraph?.type === 'paragraph') {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            textToDocx(`${index + 1}. `, { bold: true }),
            ...runsToDocx(firstParagraph.runs),
          ],
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [textToDocx(`${index + 1}.`, { bold: true })],
        }),
      );
    }

    paragraphs.push(...blocksToParagraphs(restBlocks));
  }

  paragraphs.push(spacer(120));

  const options = (question.options as QuestionOption[] | null) ?? [];
  if (isMultipleChoice(question.questionType) && options.length > 0) {
    for (const opt of options) {
      const optBlocks = markdownToBlocks(opt.text);
      const firstOpt = optBlocks.find((b) => b.type === 'paragraph');
      const restOpt = optBlocks.filter((b) => b !== firstOpt);
      const label = opt.label.toLowerCase();

      if (firstOpt?.type === 'paragraph') {
        paragraphs.push(
          new Paragraph({
            indent: { left: OPTION_INDENT },
            spacing: { after: 80 },
            children: [textToDocx(`${label}. `), ...runsToDocx(firstOpt.runs)],
          }),
        );
      } else {
        paragraphs.push(
          new Paragraph({
            indent: { left: OPTION_INDENT },
            spacing: { after: 80 },
            children: [textToDocx(`${label}.`)],
          }),
        );
      }

      paragraphs.push(...blocksToParagraphs(restOpt));
      paragraphs.push(spacer(80));
    }
  }

  paragraphs.push(spacer(loadedImage ? 240 : 160));
  return paragraphs;
}

export function buildExamFooter(schoolName?: string): Footer {
  const kop = schoolName?.trim();
  const footerChildren: TextRun[] = [
    new TextRun({
      text: 'A4  |  ',
      font: FONT_FAMILY,
      size: FOOTER_SIZE,
      color: '737373',
    }),
    new TextRun({
      children: [PageNumber.CURRENT],
      font: FONT_FAMILY,
      size: FOOTER_SIZE,
      color: '737373',
    }),
    new TextRun({
      text: ' dari ',
      font: FONT_FAMILY,
      size: FOOTER_SIZE,
      color: '737373',
    }),
    new TextRun({
      children: [PageNumber.TOTAL_PAGES],
      font: FONT_FAMILY,
      size: FOOTER_SIZE,
      color: '737373',
    }),
  ];

  if (kop) {
    footerChildren.push(
      new TextRun({ text: '\t', font: FONT_FAMILY, size: FOOTER_SIZE }),
      new TextRun({
        text: kop,
        font: FONT_FAMILY,
        size: FOOTER_SIZE,
        color: '737373',
      }),
    );
  }

  return new Footer({
    children: [
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
        },
        spacing: { before: 80 },
        tabStops: kop
          ? [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }]
          : undefined,
        children: footerChildren,
      }),
    ],
  });
}
