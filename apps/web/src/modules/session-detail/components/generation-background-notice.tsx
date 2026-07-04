import { ClockCounterClockwise } from '@phosphor-icons/react';
import { cn } from '@questgen/ui/lib/utils';

export const GENERATION_BACKGROUND_MESSAGE =
  'Proses ini berjalan di server. Anda bisa menutup tab ini atau melakukan hal lain — soal akan tetap dibuat dan bisa dilihat di Riwayat setelah selesai.';

type GenerationBackgroundNoticeProps = {
  className?: string;
};

export function GenerationBackgroundNotice({
  className,
}: GenerationBackgroundNoticeProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed',
        className,
      )}
      role="note"
    >
      <ClockCounterClockwise
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        weight="regular"
        aria-hidden
      />
      <p className="text-muted-foreground">{GENERATION_BACKGROUND_MESSAGE}</p>
    </div>
  );
}
