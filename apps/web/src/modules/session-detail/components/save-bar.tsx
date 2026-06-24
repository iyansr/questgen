import { ArrowCounterClockwise, FloppyDisk } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import { cn } from '@questgen/ui/lib/utils';

import { SaveProgressDialog } from './save-progress-dialog';

type SaveBarProps = {
  dirtyCount: number;
  isSaving: boolean;
  pendingImages?: number;
  onSave: () => void;
  onDiscard: () => void;
};

export function SaveBar({
  dirtyCount,
  isSaving,
  pendingImages = 0,
  onSave,
  onDiscard,
}: SaveBarProps) {
  if (dirtyCount === 0) return null;

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic
        className={cn(
          'sticky top-2 z-10 flex flex-wrap items-center justify-between gap-3 border border-foreground/20 bg-foreground px-4 py-3 text-background shadow-sm',
        )}
      >
        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex size-6 items-center justify-center bg-background font-mono text-foreground text-sm tabular-nums">
            {dirtyCount}
          </span>
          <span>
            {dirtyCount === 1
              ? 'soal menunggu disimpan'
              : 'soal menunggu disimpan'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={onDiscard}
            disabled={isSaving}
            className="text-background hover:bg-background/10 hover:text-background"
          >
            <ArrowCounterClockwise weight="bold" aria-hidden />
            Batalkan
          </Button>
          <Button
            type="button"
            size="default"
            onClick={onSave}
            disabled={isSaving}
            className="bg-background text-foreground hover:bg-background/90"
          >
            <FloppyDisk weight="bold" aria-hidden />
            {isSaving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </div>
      </div>
      <SaveProgressDialog
        open={isSaving}
        questionCount={dirtyCount}
        imageCount={pendingImages}
      />
    </>
  );
}
