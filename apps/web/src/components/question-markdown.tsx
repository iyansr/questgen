import { cn } from '@questgen/ui/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import { plainMathToLatex } from '@/lib/plain-math-to-latex';

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

const markdownListStyles = [
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_li]:my-1',
  '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
  '[&_strong]:font-semibold',
  '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-base',
  '[&_th]:border [&_th]:border-border [&_th]:bg-muted/40 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold',
  '[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2',
] as const;

type QuestionMarkdownProps = {
  children: string;
  className?: string;
};

export function QuestionMarkdown({
  children,
  className,
}: QuestionMarkdownProps) {
  return (
    <div
      className={cn(
        'question-markdown max-w-none font-serif leading-relaxed',
        markdownListStyles,
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
      >
        {plainMathToLatex(children)}
      </ReactMarkdown>
    </div>
  );
}
