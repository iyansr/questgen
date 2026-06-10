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
				'inline-flex items-center gap-1.5 px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
				STATUS_STYLES[status],
			)}
		>
			<span
				className={cn('size-1.5 rounded-full', STATUS_DOT[status])}
				aria-hidden
			/>
			{label}
		</span>
	);
}
