/** Cloudflare request-body cap (Free/Pro); Mistral Files API allows up to 512 MB. */
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 100;

/**
 * Product page cap (all upload types). Keeps Chroma Cloud upserts under the
 * 300-records-per-write limit after chunking. Mistral OCR allows up to 1000.
 */
export const MAX_PDF_PAGES = 80;

export function countPdfPages(bytes: ArrayBuffer): number {
  const text = new TextDecoder('latin1').decode(bytes);
  const matches = text.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
  return matches ? matches.length : 0;
}
