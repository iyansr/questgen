import {
  CheckCircle,
  Circle,
  Spinner,
  WarningCircle,
} from '@phosphor-icons/react';
import { cn } from '@questgen/ui/lib/utils';

import type { SessionStatus } from '@/services/sessions/detail';

const STEP_ORDER: Array<{
  key: SessionStatus;
  label: string;
  hint: string;
}> = [
  {
    key: 'pending',
    label: 'Mempersiapkan',
    hint: 'Mengunggah dan memproses dokumen',
  },
  {
    key: 'generating',
    label: 'Menghasilkan soal',
    hint: 'AI sedang menyusun pertanyaan',
  },
  { key: 'completed', label: 'Selesai', hint: 'Semua soal sudah tersedia' },
];

type SessionProgressProps = {
  status: SessionStatus;
  questionsCount: number;
  expectedCount: number | null;
  isStreaming: boolean;
};

function stepState(
  stepKey: SessionStatus,
  current: SessionStatus,
  failed: boolean,
): 'done' | 'active' | 'upcoming' | 'failed' {
  if (failed) {
    if (stepKey === 'failed') return 'failed';
    if (stepKey === 'completed') return 'upcoming';
  }
  if (current === 'failed') {
    if (stepKey === 'pending') return 'done';
    if (stepKey === 'generating') return 'active';
    return 'upcoming';
  }
  if (current === 'completed') {
    if (stepKey === 'completed') return 'done';
    return 'done';
  }
  const order = STEP_ORDER.findIndex((s) => s.key === stepKey);
  const currentIndex = STEP_ORDER.findIndex((s) => s.key === current);
  if (order < currentIndex) return 'done';
  if (order === currentIndex) return 'active';
  return 'upcoming';
}

function StepDot({
  state,
}: {
  state: 'done' | 'active' | 'upcoming' | 'failed';
}) {
  if (state === 'done') {
    return (
      <div className="flex size-7 items-center justify-center bg-foreground text-background">
        <CheckCircle className="size-5" weight="fill" aria-hidden />
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div className="flex size-7 items-center justify-center bg-destructive text-destructive-foreground">
        <WarningCircle className="size-5" weight="fill" aria-hidden />
      </div>
    );
  }
  if (state === 'active') {
    return (
      <div className="flex size-7 items-center justify-center border border-accent bg-accent/10 text-accent">
        <Spinner className="size-4 animate-spin" weight="bold" aria-hidden />
      </div>
    );
  }
  return (
    <div className="flex size-7 items-center justify-center border border-border bg-background text-muted-foreground">
      <Circle className="size-4" weight="regular" aria-hidden />
    </div>
  );
}

function StepConnector({
  state,
}: {
  state: 'done' | 'active' | 'upcoming' | 'failed';
}) {
  const isFilled = state === 'done';
  return (
    <div
      className={cn(
        'w-px flex-1 border-border border-l border-dashed',
        isFilled && 'border-foreground border-solid',
      )}
      aria-hidden
    />
  );
}

export function SessionProgress({
  status,
  questionsCount,
  expectedCount,
  isStreaming,
}: SessionProgressProps) {
  const failed = status === 'failed';

  const activeLabel = failed
    ? 'Proses dihentikan'
    : status === 'completed'
      ? 'Selesai'
      : isStreaming || status === 'generating'
        ? 'AI sedang membuat soal…'
        : status === 'pending'
          ? 'Mempersiapkan sesi…'
          : 'Memulai…';

  return (
    <section className="border border-border bg-card" aria-label="Progres sesi">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-border border-b px-5 py-4 sm:px-6 sm:py-5">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm uppercase tracking-wide">
            Status Sesi
          </p>
          <p className="font-medium text-base" aria-live="polite" aria-atomic>
            {activeLabel}
          </p>
        </div>
        {expectedCount !== null && (
          <p
            className="text-muted-foreground text-sm tabular-nums"
            aria-live="polite"
            aria-atomic
          >
            <span className="font-semibold text-foreground">
              {questionsCount}
            </span>
            <span className="mx-1">/</span>
            <span>{expectedCount}</span>
            <span className="ml-1">soal</span>
          </p>
        )}
      </header>

      <ol
        className="flex flex-col gap-0 px-5 py-5 sm:px-6 sm:py-6"
        aria-label="Langkah-langkah progres"
      >
        {STEP_ORDER.map((step, i) => {
          const state = stepState(step.key, status, failed);
          const isLast = i === STEP_ORDER.length - 1;
          return (
            <li key={step.key} className="flex items-stretch gap-4">
              <div className="flex flex-col items-center">
                <StepDot state={state} />
                {!isLast && <StepConnector state={state} />}
              </div>
              <div className="flex-1 pb-6">
                <p
                  className={cn(
                    'text-base',
                    state === 'active' && 'font-semibold text-foreground',
                    state === 'upcoming' && 'text-muted-foreground',
                    state === 'done' && 'text-foreground',
                    state === 'failed' && 'font-semibold text-destructive',
                  )}
                >
                  {step.label}
                  <span className="sr-only">
                    {state === 'done'
                      ? ' (selesai)'
                      : state === 'active'
                        ? ' (sedang berjalan)'
                        : state === 'failed'
                          ? ' (gagal)'
                          : ' (belum dimulai)'}
                  </span>
                </p>
                {state === 'active' && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    {step.hint}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
