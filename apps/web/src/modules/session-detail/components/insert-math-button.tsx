import { ButtonWithTooltip, type MDXEditorMethods } from '@mdxeditor/editor';
import { Button } from '@questgen/ui/components/button';
import { Input } from '@questgen/ui/components/input';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type InsertMathButtonProps = {
  editorRef: RefObject<MDXEditorMethods | null>;
};

export function InsertMathButton({ editorRef }: InsertMathButtonProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [latex, setLatex] = useState('');
  const [panelPosition, setPanelPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPanelPosition({ top: rect.bottom + 4, left: rect.left });
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open]);

  function handleInsert() {
    const trimmed = latex.trim();
    if (!trimmed) return;
    editorRef.current?.insertMarkdown(`$${trimmed}$`);
    editorRef.current?.focus();
    setLatex('');
    setOpen(false);
  }

  return (
    <>
      <div ref={anchorRef} className="inline-flex">
        <ButtonWithTooltip
          title="Sisipkan rumus"
          type="button"
          aria-expanded={open}
          onClick={() => {
            setLatex('');
            setOpen((prev) => !prev);
          }}
        >
          <span className="font-mono text-xs leading-none">fx</span>
        </ButtonWithTooltip>
      </div>
      {open && panelPosition
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Masukkan rumus"
              className="fixed z-[200] flex w-72 flex-col gap-3 border border-border bg-popover p-4 text-popover-foreground shadow-md"
              style={{
                top: panelPosition.top,
                left: panelPosition.left,
              }}
            >
              <p className="font-medium text-sm">Masukkan rumus</p>
              <Input
                value={latex}
                onChange={(e) => setLatex(e.target.value)}
                placeholder="Contoh: x^2 atau \\frac{1}{2}"
                className="text-base"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setOpen(false);
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInsert();
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button type="button" size="sm" onClick={handleInsert}>
                  Sisipkan
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
