import { PDFDocument } from 'pdf-lib';

import type { SessionWithQuestions } from '@/modules/sessions/sessions.service';

import type { ExportPdfInput } from '../export.schema';
import { ExamLayout, type FontSet } from './exam-layout';
import {
  drawExamHeader,
  drawQuestion,
  finalizePageFooter,
} from './exam-template';
import { embedExamFonts } from './pdf-fonts';

export async function buildExamPdf(
  session: SessionWithQuestions,
  options: ExportPdfInput,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: FontSet = await embedExamFonts(doc);
  const layout = new ExamLayout(doc, fonts);

  drawExamHeader(layout, options);

  const embedImage = async (
    bytes: Uint8Array,
    mimeType: 'image/png' | 'image/jpeg',
  ) => {
    if (mimeType === 'image/png') {
      return doc.embedPng(bytes);
    }
    return doc.embedJpg(bytes);
  };

  const sortedQuestions = [...session.questions].sort(
    (a, b) => a.order - b.order,
  );

  for (let i = 0; i < sortedQuestions.length; i++) {
    await drawQuestion(layout, sortedQuestions[i]!, i, embedImage);
  }

  finalizePageFooter(layout.pages, fonts, options.schoolName);

  return doc.save();
}
