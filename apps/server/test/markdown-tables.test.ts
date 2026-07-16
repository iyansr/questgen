import { describe, expect, it } from 'vitest';

import {
  markdownToBlocks,
  plainTextFromMarkdown,
} from '@/modules/export/shared/markdown-blocks';

const SAMPLE_TABLE = `| Subject | Object | Possessive |
|---------|--------|------------|
| I | me | my |
| He | him | his |`;

describe('markdownToBlocks tables', () => {
  it('parses a GFM table into a table block', () => {
    const blocks = markdownToBlocks(SAMPLE_TABLE);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.type).toBe('table');
    if (blocks[0]?.type !== 'table') return;

    expect(blocks[0].header.map((c) => c.map((r) => r.text).join(''))).toEqual(
      ['Subject', 'Object', 'Possessive'],
    );
    expect(blocks[0].rows).toHaveLength(2);
    expect(
      blocks[0].rows[0]!.map((c) => c.map((r) => r.text).join('')),
    ).toEqual(['I', 'me', 'my']);
    expect(
      blocks[0].rows[1]!.map((c) => c.map((r) => r.text).join('')),
    ).toEqual(['He', 'him', 'his']);
  });

  it('keeps prose around a table as separate blocks', () => {
    const md = `Perhatikan tabel berikut.\n\n${SAMPLE_TABLE}\n\nBerdasarkan tabel di atas.`;
    const blocks = markdownToBlocks(md);
    expect(blocks.map((b) => b.type)).toEqual([
      'paragraph',
      'table',
      'paragraph',
    ]);
  });

  it('renders math inside table cells via unicode', () => {
    const md = `| Formula |
|---------|
| $x^2$ |`;
    const blocks = markdownToBlocks(md);
    expect(blocks[0]?.type).toBe('table');
    if (blocks[0]?.type !== 'table') return;
    expect(blocks[0].rows[0]![0]!.map((r) => r.text).join('')).toBe('x²');
  });

  it('flattens tables in plainTextFromMarkdown', () => {
    const text = plainTextFromMarkdown(SAMPLE_TABLE);
    expect(text).toContain('Subject\tObject\tPossessive');
    expect(text).toContain('I\tme\tmy');
  });
});
