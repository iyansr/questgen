import { MarkdownTextSplitter } from '@langchain/textsplitters';

import { cleanMarkdown } from './markdown-cleaner';

export interface ExtractedImage {
	id: string;
	r2Url: string;
	caption: string;
	pageIndex: number;
}

export interface ImageRef {
	id: string;
	url: string;
	caption: string;
}

interface Chunk {
	text: string;
	index: number;
	imageRefs: ImageRef[];
}

interface ChunkOptions {
	chunkSize?: number;
	chunkOverlap?: number;
}

const DEFAULT_CHUNK_SIZE = 1500;
const DEFAULT_OVERLAP = 200;
const MAX_SECTION_CHARS = 200_000;

export async function chunkText(
	rawMarkdown: string,
	images: ExtractedImage[],
	options: ChunkOptions = {},
): Promise<Chunk[]> {
	const text = cleanMarkdown(rawMarkdown);
	if (!text) return [];

	const splitter = new MarkdownTextSplitter({
		chunkSize: options.chunkSize ?? DEFAULT_CHUNK_SIZE,
		chunkOverlap: options.chunkOverlap ?? DEFAULT_OVERLAP,
	});

	const chunks: Chunk[] = [];
	let index = 0;

	for (const section of preSplitBySections(text, MAX_SECTION_CHARS)) {
		const heading = extractHeadingPath(section);
		const pieces = await splitter.splitText(section);
		for (const piece of pieces) {
			const text =
				heading && !piece.startsWith(heading)
					? `${heading}\n\n${piece}`
					: piece;
			chunks.push({
				text,
				index: index++,
				imageRefs: images
					.filter((img) => text.includes(img.id))
					.map((img) => ({
						id: img.id,
						url: img.r2Url,
						caption: img.caption,
					})),
			});
		}
	}

	return chunks;
}

function extractHeadingPath(section: string): string {
	const lines = section.split('\n');
	let h1: string | null = null;
	let h2: string | null = null;
	for (const line of lines) {
		if (!h1 && /^#\s+\S/.test(line)) h1 = line.trim();
		else if (!h2 && /^##\s+\S/.test(line)) h2 = line.trim();
		if (h1 && h2) break;
	}
	return [h1, h2].filter(Boolean).join(' › ');
}

function preSplitBySections(text: string, maxChars: number): string[] {
	if (text.length <= maxChars) return [text];

	const out: string[] = [];
	const h1Parts = text.split(/(?=^#\s+\S)/m).filter(Boolean);
	for (const h1 of h1Parts) {
		if (h1.length <= maxChars) {
			out.push(h1);
			continue;
		}
		const h2Parts = h1.split(/(?=^##\s+\S)/m).filter(Boolean);
		for (const h2 of h2Parts) {
			if (h2.length <= maxChars) {
				out.push(h2);
			} else {
				for (let i = 0; i < h2.length; i += maxChars) {
					out.push(h2.slice(i, i + maxChars));
				}
			}
		}
	}
	return out;
}
