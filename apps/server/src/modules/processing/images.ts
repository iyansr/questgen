import { env } from '@questgen/env/server';

import { buildImagePublicUrl } from '@/shared/lib/images';

interface UploadedImage {
	id: string;
	key: string;
	publicUrl: string;
}

function buildImageKey(documentId: string, imageId: string): string {
	return `documents/${documentId}/images/${imageId}`;
}

export async function uploadImageToR2(
	documentId: string,
	imageId: string,
	base64Data: string,
): Promise<UploadedImage> {
	const key = buildImageKey(documentId, imageId);

	const contentType = imageId.endsWith('.png') ? 'image/png' : 'image/jpeg';

	const payload = base64Data.includes(',')
		? base64Data.slice(base64Data.indexOf(',') + 1)
		: base64Data;

	const binary = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));

	await env.DOCUMENTS_BUCKET.put(key, binary, {
		httpMetadata: { contentType },
	});

	return {
		id: imageId,
		key,
		publicUrl: buildImagePublicUrl(key),
	};
}
