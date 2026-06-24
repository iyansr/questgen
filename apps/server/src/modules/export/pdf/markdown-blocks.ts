import katex from 'katex';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

import { latexToUnicode } from './pdf-text-sanitize';

export type TextStyle = 'normal' | 'bold' | 'italic' | 'boldItalic';

export type TextRun = {
  text: string;
  style: TextStyle;
};

export type ContentBlock =
  | { type: 'paragraph'; runs: TextRun[] }
  | { type: 'list'; ordered: boolean; items: TextRun[][] };

type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
  ordered?: boolean;
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function renderMath(latex: string, displayMode: boolean): string {
  try {
    const html = katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: 'html',
    });
    const text = stripHtml(html);
    if (text) return text;
  } catch {
    // fall through to LaTeX unicode mapping
  }

  return latexToUnicode(latex);
}

function pushRun(runs: TextRun[], text: string, style: TextStyle): void {
  if (!text) return;
  const last = runs[runs.length - 1];
  if (last && last.style === style) {
    last.text += text;
    return;
  }
  runs.push({ text, style });
}

function inlineNodesToRuns(
  nodes: MdastNode[] | undefined,
  style: TextStyle,
  runs: TextRun[],
): void {
  if (!nodes) return;

  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        pushRun(runs, node.value ?? '', style);
        break;
      case 'strong':
        inlineNodesToRuns(node.children, 'bold', runs);
        break;
      case 'emphasis':
        inlineNodesToRuns(node.children, 'italic', runs);
        break;
      case 'inlineCode':
        pushRun(runs, node.value ?? '', style);
        break;
      case 'link':
        inlineNodesToRuns(node.children, style, runs);
        break;
      case 'inlineMath':
        pushRun(runs, renderMath(node.value ?? '', false), style);
        break;
      case 'break':
        pushRun(runs, '\n', style);
        break;
      default:
        if (node.children) {
          inlineNodesToRuns(node.children, style, runs);
        }
        break;
    }
  }
}

function paragraphToRuns(node: MdastNode): TextRun[] {
  const runs: TextRun[] = [];
  inlineNodesToRuns(node.children, 'normal', runs);
  return runs.filter((r) => r.text.length > 0);
}

function parseMarkdown(markdown: string): MdastNode {
  const processor = unified().use(remarkParse).use(remarkMath);
  return processor.parse(markdown) as MdastNode;
}

export function markdownToBlocks(markdown: string): ContentBlock[] {
  const trimmed = markdown.trim();
  if (!trimmed) return [];

  const tree = parseMarkdown(trimmed);
  const blocks: ContentBlock[] = [];

  for (const node of tree.children ?? []) {
    switch (node.type) {
      case 'paragraph': {
        const runs = paragraphToRuns(node);
        if (runs.length > 0) {
          blocks.push({ type: 'paragraph', runs });
        }
        break;
      }
      case 'list': {
        const items =
          node.children?.map((item) => {
            const runs: TextRun[] = [];
            for (const child of item.children ?? []) {
              if (child.type === 'paragraph') {
                inlineNodesToRuns(child.children, 'normal', runs);
              }
            }
            return runs.filter((r) => r.text.length > 0);
          }) ?? [];
        blocks.push({ type: 'list', ordered: node.ordered ?? false, items });
        break;
      }
      case 'math': {
        blocks.push({
          type: 'paragraph',
          runs: [{ text: renderMath(node.value ?? '', true), style: 'normal' }],
        });
        break;
      }
      case 'blockquote': {
        visit(node, 'paragraph', (p) => {
          const runs = paragraphToRuns(p);
          if (runs.length > 0) {
            blocks.push({ type: 'paragraph', runs });
          }
        });
        break;
      }
      default:
        break;
    }
  }

  return blocks;
}

export function plainTextFromMarkdown(markdown: string): string {
  return markdownToBlocks(markdown)
    .flatMap((block) => {
      if (block.type === 'paragraph') {
        return block.runs.map((r) => r.text).join('');
      }
      return block.items.map((item) => item.map((r) => r.text).join(''));
    })
    .join('\n');
}
