import { ArrowLeft, FileText, Sparkle } from '@phosphor-icons/react';
import { buttonVariants } from '@questgen/ui/components/button';
import { cn } from '@questgen/ui/lib/utils';
import { Link } from '@tanstack/react-router';

import {
	QUESTION_TYPE_LABELS,
	type QuestionType,
} from '@/modules/new-session/schema';
import type { SessionDetail, SessionStatus } from '@/services/sessions/detail';

import { StatusBadge } from './status-badge';

type SessionHeaderProps = {
	session: SessionDetail;
};

function formatDateTime(value: string) {
	return new Date(value).toLocaleString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function formatTypeCounts(
	counts: SessionDetail['config']['questionTypeCounts'],
): string {
	if (!counts || counts.length === 0) return '—';
	return counts
		.map(
			(c) =>
				`${c.count} ${QUESTION_TYPE_LABELS[c.type as QuestionType] ?? c.type}`,
		)
		.join(' · ');
}

function statusLabel(status: SessionStatus): string {
	switch (status) {
		case 'pending':
			return 'Menunggu';
		case 'generating':
			return 'Menghasilkan';
		case 'completed':
			return 'Selesai';
		case 'failed':
			return 'Gagal';
	}
}

export function SessionHeader({ session }: SessionHeaderProps) {
	const { title, status, config, createdAt } = session;

	return (
		<header className="space-y-6">
			<div>
				<Link
					to="/history"
					className="inline-flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground"
				>
					<ArrowLeft className="size-3.5" weight="regular" />
					Kembali ke Riwayat
				</Link>
			</div>

			<div className="space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<p className="text-muted-foreground text-xs uppercase tracking-widest">
						Sesi Pembuatan
					</p>
					<StatusBadge status={status} label={statusLabel(status)} />
				</div>
				<h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl">
					{title}
				</h1>
				<p className="text-muted-foreground text-sm">
					Dibuat {formatDateTime(createdAt)}
				</p>
			</div>

			<dl className="grid grid-cols-1 divide-y divide-border border border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
				<div className="flex items-start gap-3 p-4 sm:p-5">
					<div className="flex size-9 shrink-0 items-center justify-center bg-muted">
						<Sparkle
							className="size-4 text-muted-foreground"
							weight="regular"
						/>
					</div>
					<div className="min-w-0">
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Topik
						</dt>
						<dd className="mt-1 truncate font-medium text-sm">
							{config.topic || '—'}
						</dd>
					</div>
				</div>

				<div className="flex items-start gap-3 p-4 sm:p-5">
					<div className="flex size-9 shrink-0 items-center justify-center bg-muted">
						<FileText
							className="size-4 text-muted-foreground"
							weight="regular"
						/>
					</div>
					<div className="min-w-0">
						<dt className="text-muted-foreground text-xs uppercase tracking-wide">
							Komposisi Soal
						</dt>
						<dd className="mt-1 truncate font-medium text-sm">
							{formatTypeCounts(config.questionTypeCounts)}
						</dd>
					</div>
				</div>
			</dl>

			{status === 'failed' && session.errorMessage && (
				<div className="flex flex-col gap-2 border border-destructive/40 bg-destructive/5 p-4">
					<p className="font-medium text-destructive text-xs uppercase tracking-wide">
						Gagal
					</p>
					<p className="text-sm">{session.errorMessage}</p>
					<div>
						<Link
							to="/new"
							className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
						>
							Coba Buat Sesi Baru
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
