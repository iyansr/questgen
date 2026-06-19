export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 20;

export const MAX_PDF_PAGES = 400;

export const MAX_WEB_QUERY_CHARS = 200;
export const MIN_WEB_QUERY_CHARS = 3;
export const MAX_WEB_RESULTS = 3;
export const MAX_WEB_IMAGES = 12;

export function countPdfPages(bytes: ArrayBuffer): number {
	const text = new TextDecoder('latin1').decode(bytes);
	const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
	return matches ? matches.length : 0;
}
