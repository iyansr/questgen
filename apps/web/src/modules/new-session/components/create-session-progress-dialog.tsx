import { CheckCircle, Circle, Spinner } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@questgen/ui/components/dialog';
import { cn } from '@questgen/ui/lib/utils';

import type { CreateSessionPhase } from '@/services/sessions/create';

const STEPS: Array<{ phase: CreateSessionPhase; label: string }> = [
  { phase: 'uploading', label: 'Sedang mengunggah dokumen…' },
  { phase: 'creating', label: 'Menyiapkan sesi…' },
  { phase: 'redirecting', label: 'Membuka halaman sesi…' },
];

type CreateSessionProgressDialogProps = {
  open: boolean;
  phase: CreateSessionPhase;
  uploadPercent?: number;
  filename?: string;
};

function stepIndex(phase: CreateSessionPhase): number {
  return STEPS.findIndex((s) => s.phase === phase);
}

function StepIcon({ state }: { state: 'done' | 'active' | 'upcoming' }) {
  if (state === 'done') {
    return (
      <CheckCircle className="size-5 text-primary" weight="fill" aria-hidden />
    );
  }
  if (state === 'active') {
    return (
      <Spinner
        className="size-5 animate-spin text-primary"
        weight="bold"
        aria-hidden
      />
    );
  }
  return (
    <Circle
      className="size-5 text-muted-foreground"
      weight="regular"
      aria-hidden
    />
  );
}

export function CreateSessionProgressDialog({
  open,
  phase,
  uploadPercent,
  filename,
}: CreateSessionProgressDialogProps) {
  const activeIndex = stepIndex(phase);
  const activeStep = STEPS[activeIndex];

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-base">
            Membuat Sesi Baru
          </DialogTitle>
        </DialogHeader>

        <ol className="space-y-4" aria-label="Langkah pembuatan sesi">
          {STEPS.map((step, i) => {
            const state =
              i < activeIndex
                ? 'done'
                : i === activeIndex
                  ? 'active'
                  : 'upcoming';
            return (
              <li key={step.phase} className="flex items-start gap-3">
                <StepIcon state={state} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p
                    className={cn(
                      'text-sm',
                      state === 'active' && 'font-medium text-foreground',
                      state === 'done' && 'text-foreground',
                      state === 'upcoming' && 'text-muted-foreground',
                    )}
                    aria-live={state === 'active' ? 'polite' : undefined}
                    aria-atomic={state === 'active' ? true : undefined}
                  >
                    {step.label}
                  </p>
                  {state === 'active' &&
                    step.phase === 'uploading' &&
                    filename && (
                      <p className="truncate text-muted-foreground text-xs">
                        {filename}
                      </p>
                    )}
                  {state === 'active' &&
                    step.phase === 'uploading' &&
                    uploadPercent !== undefined && (
                      <div className="space-y-1">
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={uploadPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="h-full rounded-full bg-primary transition-[width] duration-150"
                            style={{ width: `${uploadPercent}%` }}
                          />
                        </div>
                        <p className="text-muted-foreground text-xs tabular-nums">
                          {uploadPercent}%
                        </p>
                      </div>
                    )}
                </div>
              </li>
            );
          })}
        </ol>

        <p className="sr-only" aria-live="polite" aria-atomic>
          {activeStep?.label}
        </p>
      </DialogContent>
    </Dialog>
  );
}
