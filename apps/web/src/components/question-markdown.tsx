import { cn } from '@questgen/ui/lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import { plainMathToLatex } from '@/lib/plain-math-to-latex';

const remarkPlugins = [remarkMath];
const rehypePlugins = [rehypeKatex];

const markdownListStyles = [
  '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6',
  '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6',
  '[&_li]:my-1',
  '[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0',
  '[&_strong]:font-semibold',
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
