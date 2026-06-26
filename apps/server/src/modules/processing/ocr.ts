import { Mistral } from '@mistralai/mistralai';
import { env } from '@questgen/env/server';

import { withRetry } from '@/shared/lib/retry';

export interface OcrResult {
  markdown: string;
  images: Array<{
    id: string;
    base64: string;
    pageIndex: number;
  }>;
}

export type ProcessDocumentInput =
  | { mode: 'bytes'; fileBytes: ArrayBuffer; filename: string }
  | { mode: 'url'; documentUrl: string };

function parseOcrResponse(
  response: Awaited<ReturnType<Mistral['ocr']['process']>>,
): OcrResult {
  const markdown = response.pages.map((p) => p.markdown).join('\n\n');

  const images: OcrResult['images'] = [];
  for (const page of response.pages) {
    for (const img of page.images ?? []) {
      if (img.imageBase64) {
        images.push({
          id: img.id,
          base64: img.imageBase64,
          pageIndex: page.index,
        });
      }
    }
  }

  return { markdown, images };
}

async function runOcr(documentUrl: string): Promise<OcrResult> {
  const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });

  const response = await withRetry(() =>
    client.ocr.process({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        documentUrl,
      },
      tableFormat: 'markdown',
      includeImageBase64: true,
    }),
  );

  return parseOcrResponse(response);
}

export async function processDocumentFromUrl(
  documentUrl: string,
): Promise<OcrResult> {
  return runOcr(documentUrl);
}

export async function processDocumentFromBytes(
  fileBytes: ArrayBuffer,
  filename: string,
): Promise<OcrResult> {
  const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });

  const uploaded = await withRetry(() =>
    client.files.upload({
      file: {
        fileName: filename,
        content: new Uint8Array(fileBytes),
      },
      purpose: 'ocr',
    }),
  );

  try {
    const signed = await withRetry(() =>
      client.files.getSignedUrl({
        fileId: uploaded.id,
        expiry: 1,
      }),
    );

    return await runOcr(signed.url);
  } finally {
    await client.files.delete({ fileId: uploaded.id }).catch(() => {});
  }
}

export async function processDocument(
  input: ProcessDocumentInput,
): Promise<OcrResult> {
  if (input.mode === 'url') {
    return processDocumentFromUrl(input.documentUrl);
  }
  return processDocumentFromBytes(input.fileBytes, input.filename);
}
