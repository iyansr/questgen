import type { questions } from '@questgen/db/schema';
import type { PDFImage } from 'pdf-lib';

import type { ExportPdfInput } from '../export.schema';
import {
  buildSubtitle,
  isMultipleChoice,
  type QuestionOption,
} from '../shared/exam-helpers';
import { loadQuestionImage } from '../shared/image-loader';
import { type ContentBlock, markdownToBlocks } from '../shared/markdown-blocks';
import {
  drawPageFooter,
  type ExamLayout,
  type FontSet,
  MARGIN,
  PAGE_WIDTH,
  QUESTION_IMAGE_MAX_HEIGHT_PT,
  QUESTION_IMAGE_MAX_WIDTH_PT,
} from './exam-layout';

type QuestionRow = typeof questions.$inferSelect;

function drawBlocks(
  layout: ExamLayout,
  blocks: ContentBlock[],
  size = 11,
  indent = 0,
): void {
  for (const block of blocks) {
    if (block.type === 'paragraph') {
      layout.drawRuns(block.runs, { size, indent });
    } else if (block.type === 'list') {
      block.items.forEach((item, index) => {
        const prefix = block.ordered ? `${index + 1}. ` : '• ';
        layout.drawRuns([{ text: prefix, style: 'normal' }, ...item], {
          size,
          indent: indent + 12,
        });
      });
    } else if (block.type === 'table') {
      layout.drawTable(block.header, block.rows, { size: size - 1, indent });
    }
  }
}

export function drawExamHeader(
  layout: ExamLayout,
  options: ExportPdfInput,
): void {
  layout.drawLine(options.documentTitle, {
    size: 14,
    style: 'bold',
    align: 'center',
  });
  layout.drawSpacer(6);

  const subtitle = buildSubtitle(options);
  if (subtitle) {
    layout.drawLine(subtitle, { size: 11, align: 'center' });
    layout.drawSpacer(10);
  }

  layout.drawHorizontalRule();
  layout.drawSpacer(8);

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  layout.drawDottedFieldPair('Nama :', 'Kelas :');
  layout.drawDottedField('Hari/Tanggal :', contentWidth);

  layout.drawSpacer(8);
  layout.drawHorizontalRule();
  layout.drawSpacer(10);
}

export async function drawQuestion(
  layout: ExamLayout,
  question: QuestionRow,
  index: number,
  embedImage: (
    bytes: Uint8Array,
    mimeType: 'image/png' | 'image/jpeg',
  ) => Promise<PDFImage | null>,
): Promise<void> {
  const questionIndent = 16;
  const stemBlocks = markdownToBlocks(question.questionText);

  let image: PDFImage | null = null;
  if (question.imageUrl) {
    const loaded = await loadQuestionImage(question.imageUrl);
    if (loaded) {
      image = await embedImage(loaded.bytes, loaded.mimeType);
    }
  }

  layout.ensureSpace(image ? 120 : 40);

  if (image) {
    layout.drawSpacer(6);
    layout.drawLine(`${index + 1}.`, { size: 11, style: 'bold' });
    layout.drawSpacer(8);
    layout.drawImage(image, {
      indent: questionIndent,
      maxWidth: QUESTION_IMAGE_MAX_WIDTH_PT,
      maxHeight: QUESTION_IMAGE_MAX_HEIGHT_PT,
      paddingAfter: 16,
    });
    drawBlocks(layout, stemBlocks, 11, questionIndent);
  } else {
    const firstParagraph = stemBlocks.find((b) => b.type === 'paragraph');
    const restBlocks = stemBlocks.filter((b) => b !== firstParagraph);

    if (firstParagraph?.type === 'paragraph') {
      layout.drawRuns(
        [{ text: `${index + 1}. `, style: 'bold' }, ...firstParagraph.runs],
        { size: 11 },
      );
    } else {
      layout.drawLine(`${index + 1}.`, { size: 11, style: 'bold' });
    }

    drawBlocks(layout, restBlocks, 11);
  }

  layout.drawSpacer(6);

  const options = (question.options as QuestionOption[] | null) ?? [];
  if (isMultipleChoice(question.questionType) && options.length > 0) {
    for (const opt of options) {
      const optBlocks = markdownToBlocks(opt.text);
      const firstOpt = optBlocks.find((b) => b.type === 'paragraph');
      const restOpt = optBlocks.filter((b) => b !== firstOpt);
      const label = opt.label.toLowerCase();

      if (firstOpt?.type === 'paragraph') {
        layout.drawRuns(
          [{ text: `${label}. `, style: 'normal' }, ...firstOpt.runs],
          { size: 11, indent: 16 },
        );
      } else {
        layout.drawLine(`${label}.`, { size: 11, indent: 16 });
      }

      drawBlocks(layout, restOpt, 11);
      layout.drawSpacer(4);
    }
  }

  layout.drawSpacer(image ? 16 : 12);
}

export function finalizePageFooter(
  pages: import('pdf-lib').PDFPage[],
  fonts: FontSet,
  schoolName?: string,
): void {
  drawPageFooter(pages, fonts, schoolName);
}
