import {
  ArrowLeft,
  FileText,
  GraduationCap,
  Sparkle,
} from '@phosphor-icons/react';
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
    <header className="space-y-8">
      <div>
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:underline focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" weight="regular" aria-hidden />
          Kembali ke Riwayat
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Sesi Pembuatan
          </p>
          <StatusBadge status={status} label={statusLabel(status)} />
        </div>
        <h1 className="font-serif text-3xl leading-tight tracking-tight md:text-4xl">
          {title}
        </h1>
        <p className="text-base text-muted-foreground">
          Dibuat {formatDateTime(createdAt)}
        </p>
      </div>

      <dl className="grid grid-cols-1 divide-y divide-border border border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <div
            className="flex size-10 shrink-0 items-center justify-center bg-muted"
            aria-hidden
          >
            <Sparkle
              className="size-5 text-muted-foreground"
              weight="regular"
            />
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground text-sm uppercase tracking-wide">
              Topik
            </dt>
            <dd className="mt-1 truncate font-medium text-base">
              {config.topic || '—'}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3 p-5 sm:p-6">
          <div
            className="flex size-10 shrink-0 items-center justify-center bg-muted"
            aria-hidden
          >
            <FileText
              className="size-5 text-muted-foreground"
              weight="regular"
            />
          </div>
          <div className="min-w-0">
            <dt className="text-muted-foreground text-sm uppercase tracking-wide">
              Komposisi Soal
            </dt>
            <dd className="mt-1 font-medium text-base">
              {formatTypeCounts(config.questionTypeCounts)}
            </dd>
          </div>
        </div>

        {config.curriculum && config.grade && config.classGrade && (
          <div className="flex items-start gap-3 p-5 sm:col-span-2 sm:border-border sm:border-t sm:p-6">
            <div
              className="flex size-10 shrink-0 items-center justify-center bg-muted"
              aria-hidden
            >
              <GraduationCap
                className="size-5 text-muted-foreground"
                weight="regular"
              />
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground text-sm uppercase tracking-wide">
                Detail Kelas
              </dt>
              <dd className="mt-1 font-medium text-base">
                {config.curriculum} · {config.grade} · Kelas {config.classGrade}
              </dd>
            </div>
          </div>
        )}
      </dl>

      {status === 'failed' && session.errorMessage && (
        <div
          role="alert"
          className="flex flex-col gap-3 border border-destructive/40 bg-destructive/5 p-5"
        >
          <p className="font-semibold text-destructive text-sm uppercase tracking-wide">
            Gagal
          </p>
          <p className="text-base leading-relaxed">{session.errorMessage}</p>
          <div>
            <Link
              to="/new"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
              )}
            >
              Coba Buat Sesi Baru
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
