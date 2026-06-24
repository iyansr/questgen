import { cn } from '@questgen/ui/lib/utils';
import { lazy, Suspense } from 'react';

import type { RichTextEditorInnerProps } from './rich-text-editor-inner';

const RichTextEditorInner = lazy(() => import('./rich-text-editor-inner'));

export type RichTextEditorFieldProps = RichTextEditorInnerProps & {
  className?: string;
};

function RichTextEditorSkeleton({ minHeight = 120 }: { minHeight?: number }) {
  return (
    <div
      className="border border-input bg-transparent"
      style={{ minHeight }}
      aria-hidden
    />
  );
}

export function RichTextEditorField({
  minHeight = 120,
  className,
  ...props
}: RichTextEditorFieldProps) {
  return (
    <div className={cn(className)}>
      <Suspense fallback={<RichTextEditorSkeleton minHeight={minHeight} />}>
        <RichTextEditorInner minHeight={minHeight} {...props} />
      </Suspense>
    </div>
  );
}
