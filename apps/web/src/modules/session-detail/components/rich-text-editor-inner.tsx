import {
  BoldItalicUnderlineToggles,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  Separator,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

import { cn } from '@questgen/ui/lib/utils';
import { useEffect, useMemo, useRef } from 'react';

import { useTheme } from '@/components/theme-provider';

import { InsertMathButton } from './insert-math-button';
import './rich-text-editor.css';

export type RichTextEditorInnerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  'aria-invalid'?: boolean;
  minHeight?: number;
};

export default function RichTextEditorInner({
  value,
  onChange,
  onBlur,
  'aria-invalid': ariaInvalid,
  minHeight = 120,
}: RichTextEditorInnerProps) {
  const editorRef = useRef<MDXEditorMethods>(null);
  const skipNextSync = useRef(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';

  const plugins = useMemo(
    () => [
      toolbarPlugin({
        toolbarClassName: 'questgen-rich-text-editor__toolbar',
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BoldItalicUnderlineToggles />
            <Separator />
            <ListsToggle />
            <Separator />
            <InsertMathButton editorRef={editorRef} />
          </>
        ),
      }),
      listsPlugin(),
      quotePlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      markdownShortcutPlugin(),
    ],
    [],
  );

  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    editorRef.current?.setMarkdown(value);
  }, [value]);

  function handleChange(markdown: string) {
    skipNextSync.current = true;
    onChange(markdown);
  }

  return (
    <div
      style={{ ['--editor-min-height' as string]: `${minHeight}px` }}
      className={cn(
        'questgen-rich-text-editor',
        ariaInvalid && 'questgen-rich-text-editor--invalid',
      )}
    >
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={handleChange}
        onBlur={() => onBlur?.()}
        plugins={plugins}
        className={cn(isDark && 'dark-theme dark-editor')}
        contentEditableClassName="questgen-rich-text-editor__content font-serif text-lg leading-relaxed"
      />
    </div>
  );
}
