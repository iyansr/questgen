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

export interface Chunk {
  text: string;
  index: number;
  headingPath: string;
  imageRefs: ImageRef[];
}

interface Section {
  text: string;
  headingPath: string;
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
    const { headingPath } = section;
    const pieces = await splitter.splitText(section.text);
    for (const piece of pieces) {
      const chunkText =
        headingPath && !piece.startsWith(headingPath)
          ? `${headingPath}\n\n${piece}`
          : piece;
      chunks.push({
        text: chunkText,
        index: index++,
        headingPath,
        imageRefs: images
          .filter((img) => chunkText.includes(img.id))
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

/** First `#` / `##` / `###` lines in section, with optional inherited H1. */
function buildHeadingPath(
  section: string,
  inheritedH1: string | null,
): string {
  let h1 = inheritedH1;
  let h2: string | null = null;
  let h3: string | null = null;

  for (const line of section.split('\n')) {
    const trimmed = line.trim();
    if (!h3 && /^###\s+\S/.test(trimmed)) h3 = trimmed;
    else if (!h2 && /^##\s+\S/.test(trimmed)) h2 = trimmed;
    else if (!h1 && /^#\s+\S/.test(trimmed)) h1 = trimmed;
    if (h1 && h2 && h3) break;
  }

  return [h1, h2, h3].filter(Boolean).join(' › ');
}

function firstH1Line(text: string): string | null {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (/^#\s+\S/.test(trimmed) && !/^##/.test(trimmed)) return trimmed;
  }
  return null;
}

/**
 * Always split on `#` then `##` so each section gets its own heading path.
 * Oversized single H2 blocks are sliced by maxChars (path reused).
 */
function preSplitBySections(text: string, maxChars: number): Section[] {
  const out: Section[] = [];
  const h1Parts = text.split(/(?=^#\s+\S)/m).filter(Boolean);

  for (const h1Part of h1Parts) {
    const inheritedH1 = firstH1Line(h1Part);
    const h2Parts = h1Part.split(/(?=^##\s+\S)/m).filter(Boolean);

    for (const h2Part of h2Parts) {
      const headingPath = buildHeadingPath(h2Part, inheritedH1);
      if (h2Part.length <= maxChars) {
        out.push({ text: h2Part, headingPath });
        continue;
      }
      for (let i = 0; i < h2Part.length; i += maxChars) {
        out.push({
          text: h2Part.slice(i, i + maxChars),
          headingPath,
        });
      }
    }
  }

  return out;
}
