import { Check, Eye, EyeSlash, PencilSimple, Spinner, Trash } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@questgen/ui/components/dialog';
import { cn } from '@questgen/ui/lib/utils';
import { useState } from 'react';

import { QuestionMarkdown } from '@/components/question-markdown';
import {
  QUESTION_TYPE_LABELS,
  type QuestionType,
} from '@/modules/new-session/schema';
import type { QuestionOption, StreamedQuestion } from '@/types/session-message';

import type { StagedEdit } from '../hooks/use-question-edits';

type QuestionCardProps = {
  question: StreamedQuestion;
  index: number;
  isDirty: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  isDeleting?: boolean;
  deleteDisabled?: boolean;
};

function isMultipleChoice(type: QuestionType): boolean {
  return type === 'multiple_choice' || type === 'true_false';
}

function findCorrectOptionLabel(
  options: QuestionOption[] | null,
  correctAnswer: string,
): string | null {
  if (!options || options.length === 0) return null;
  const match = options.find(
    (o) =>
      o.label.toUpperCase() === correctAnswer.trim().toUpperCase() ||
      o.text.trim() === correctAnswer.trim(),
  );
  return match?.label ?? null;
}

export function QuestionCard({
  question,
  index,
  isDirty,
  onEdit,
  onDelete,
  isDeleting = false,
  deleteDisabled = false,
}: QuestionCardProps) {
  const [revealed, setRevealed] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showOptions = isMultipleChoice(question.questionType);
  const correctOptionLabel = showOptions
    ? findCorrectOptionLabel(question.options, question.correctAnswer)
    : null;

  async function handleConfirmDelete() {
    try {
      await onDelete();
      setConfirmOpen(false);
    } catch {
      // parent shows toast; keep dialog open
    }
  }

  return (
    <>
      <article
      className={cn(
        'border bg-card transition-colors',
        isDirty ? 'border-accent' : 'border-border',
      )}
      aria-label={`Soal nomor ${index + 1}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-border border-b px-5 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-muted-foreground text-sm tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p className="text-muted-foreground text-sm uppercase tracking-wide">
            {QUESTION_TYPE_LABELS[question.questionType] ??
              question.questionType}
          </p>
          {isDirty && (
            <span className="border border-accent bg-accent/10 px-2 py-0.5 font-medium text-accent text-xs uppercase tracking-wide">
              Diubah
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="gap-1.5"
            aria-label={`Edit soal nomor ${index + 1}`}
          >
            <PencilSimple className="size-3.5" weight="bold" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={deleteDisabled || isDeleting}
            className="gap-1.5 text-destructive hover:text-destructive"
            aria-label={`Hapus soal nomor ${index + 1}`}
          >
            <Trash className="size-3.5" weight="bold" aria-hidden />
            Hapus
          </Button>
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-pressed={revealed}
            aria-label={
              revealed
                ? `Sembunyikan jawaban soal nomor ${index + 1}`
                : `Lihat jawaban soal nomor ${index + 1}`
            }
            className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline focus-visible:outline-none"
          >
            {revealed ? (
              <>
                <EyeSlash className="size-4" weight="regular" aria-hidden />
                Sembunyikan jawaban
              </>
            ) : (
              <>
                <Eye className="size-4" weight="regular" aria-hidden />
                Lihat jawaban
              </>
            )}
          </button>
        </div>
      </header>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            className="h-auto w-full border object-contain"
            alt="Ilustrasi soal"
            loading="lazy"
          />
        )}

        <QuestionMarkdown className="text-lg">
          {question.questionText}
        </QuestionMarkdown>

        {showOptions && question.options && question.options.length > 0 && (
          <ol className="space-y-2" aria-label="Pilihan jawaban">
            {question.options.map((opt) => {
              const isCorrect = correctOptionLabel === opt.label;
              return (
                <li
                  key={opt.label}
                  className={cn(
                    'flex items-start gap-3 border border-border px-4 py-3 text-base transition-colors',
                    revealed &&
                      isCorrect &&
                      'border-foreground bg-foreground/5',
                  )}
                >
                  <span
                    aria-hidden={!revealed || !isCorrect}
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center border border-border font-mono text-sm',
                      revealed &&
                        isCorrect &&
                        'border-foreground bg-foreground text-background',
                    )}
                  >
                    {revealed && isCorrect ? (
                      <Check className="size-4" weight="bold" />
                    ) : (
                      opt.label
                    )}
                  </span>
                  {revealed && isCorrect ? (
                    <div className="flex-1 font-medium leading-relaxed">
                      <QuestionMarkdown>{opt.text}</QuestionMarkdown>
                      <span className="sr-only"> (jawaban benar)</span>
                    </div>
                  ) : (
                    <div className="flex-1 leading-relaxed">
                      <QuestionMarkdown>{opt.text}</QuestionMarkdown>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {revealed && (
          <div className="space-y-3 border-border border-t pt-4">
            {!showOptions && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm uppercase tracking-wide">
                  Jawaban
                </p>
                <QuestionMarkdown className="text-base">
                  {question.correctAnswer || '—'}
                </QuestionMarkdown>
              </div>
            )}
            {question.suggestedAnswer && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm uppercase tracking-wide">
                  Penjelasan
                </p>
                <QuestionMarkdown className="text-base text-muted-foreground">
                  {question.suggestedAnswer}
                </QuestionMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </article>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">Hapus soal?</DialogTitle>
            <DialogDescription>
              Soal nomor {index + 1} akan dihapus permanen dari set ini. Tindakan
              ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="ghost" disabled={isDeleting} />
              }
            >
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? (
                <Spinner className="size-4 animate-spin" weight="bold" aria-hidden />
              ) : (
                <Trash weight="bold" aria-hidden />
              )}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function applyStagedEdit(
  question: StreamedQuestion,
  edit: StagedEdit | undefined,
): StreamedQuestion {
  if (!edit) return question;
  return {
    ...question,
    questionText: edit.patch.questionText,
    options: edit.patch.options,
    correctAnswer: edit.patch.correctAnswer,
    suggestedAnswer: edit.patch.suggestedAnswer ?? '',
    imageUrl:
      edit.image?.previewUrl ?? (edit.removeImage ? null : question.imageUrl),
  };
}
