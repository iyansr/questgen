import { Mistral } from '@mistralai/mistralai';
import { env } from '@questgen/env/server';

interface OcrResult {
	markdown: string;
	images: Array<{
		id: string;
		base64: string;
		pageIndex: number;
	}>;
}

export async function processDocument(
	fileBytes: ArrayBuffer,
	filename: string,
): Promise<OcrResult> {
	const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });

	const uploaded = await client.files.upload({
		file: {
			fileName: filename,
			content: new Uint8Array(fileBytes),
		},
		purpose: 'ocr',
	});

	try {
		const signed = await client.files.getSignedUrl({
			fileId: uploaded.id,
			expiry: 1,
		});

		const response = await client.ocr.process({
			model: 'mistral-ocr-latest',
			document: {
				type: 'document_url',
				documentUrl: signed.url,
			},
			tableFormat: 'markdown',
			includeImageBase64: true,
		});

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
	} finally {
		await client.files.delete({ fileId: uploaded.id }).catch(() => {});
	}
}
