import { Document, Packer, Paragraph, Table } from 'docx';

import type { SessionWithQuestions } from '@/modules/sessions/sessions.service';

import type { ExportDocxInput } from '../export.schema';
import { PAGE_MARGIN } from './docx-layout';
import {
  buildExamFooter,
  buildExamHeaderChildren,
  buildQuestionChildren,
} from './exam-docx-template';

export async function buildExamDocx(
  session: SessionWithQuestions,
  options: ExportDocxInput,
): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [...buildExamHeaderChildren(options)];

  const sortedQuestions = [...session.questions].sort(
    (a, b) => a.order - b.order,
  );

  for (let i = 0; i < sortedQuestions.length; i++) {
    const questionParagraphs = await buildQuestionChildren(
      sortedQuestions[i]!,
      i,
    );
    children.push(...questionParagraphs);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: PAGE_MARGIN,
              right: PAGE_MARGIN,
              bottom: PAGE_MARGIN,
              left: PAGE_MARGIN,
            },
          },
        },
        footers: {
          default: buildExamFooter(options.schoolName),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}
