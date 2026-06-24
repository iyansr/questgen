import { cn } from '@questgen/ui/lib/utils';

import type { SessionStatus } from '@/services/sessions/detail';

const STATUS_STYLES: Record<SessionStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  generating: 'bg-accent/10 text-accent',
  completed: 'bg-foreground/10 text-foreground',
  failed: 'bg-destructive/10 text-destructive',
};

const STATUS_DOT: Record<SessionStatus, string> = {
  pending: 'bg-muted-foreground',
  generating: 'bg-accent animate-pulse',
  completed: 'bg-foreground',
  failed: 'bg-destructive',
};

type StatusBadgeProps = {
  status: SessionStatus;
  label: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-2.5 py-1 font-semibold text-xs uppercase tracking-wide',
        STATUS_STYLES[status],
      )}
    >
      <span
        className={cn('size-2 rounded-full', STATUS_DOT[status])}
        aria-hidden
      />
      {label}
    </span>
  );
}
