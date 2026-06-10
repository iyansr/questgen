import { env } from '@questgen/env/server';

interface UploadedImage {
	id: string;
	key: string;
	publicUrl: string;
}

export function buildImageKey(documentId: string, imageId: string): string {
	return `documents/${documentId}/images/${imageId}`;
}

export function buildImagePublicUrl(key: string): string {
	const base = env.R2_PUBLIC_HOST ?? env.SERVER_URL;
	if (!base) {
		throw new Error(
			'Missing R2_PUBLIC_HOST or SERVER_URL — cannot build image URL',
		);
	}

	const trimmed = base.replace(/\/+$/, '');
	if (env.R2_PUBLIC_HOST) {
		return `${trimmed}/${key}`;
	}
	return `${trimmed}/files/${key}`;
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
