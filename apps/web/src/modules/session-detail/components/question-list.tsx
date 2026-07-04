import { Spinner } from '@phosphor-icons/react';

import type { StreamedQuestion } from '@/types/session-message';

import type { StagedEdit } from '../hooks/use-question-edits';
import { GENERATION_BACKGROUND_MESSAGE } from './generation-background-notice';
import { EmptyQuestions } from './empty-questions';
import { applyStagedEdit, QuestionCard } from './question-card';
import { SaveBar } from './save-bar';

type QuestionListProps = {
  questions: StreamedQuestion[];
  status: 'pending' | 'generating' | 'completed' | 'failed';
  isStreaming: boolean;
  expectedCount: number | null;
  edits: Record<string, StagedEdit>;
  isSaving: boolean;
  onEdit: (question: StreamedQuestion) => void;
  onDelete: (questionId: string) => Promise<void>;
  deletingQuestionId: string | null;
  deleteDisabled: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export function QuestionList({
  questions,
  status,
  isStreaming,
  expectedCount,
  edits,
  isSaving,
  onEdit,
  onDelete,
  deletingQuestionId,
  deleteDisabled,
  onSave,
  onDiscard,
}: QuestionListProps) {
  const showStreamingFooter =
    isStreaming && (status === 'pending' || status === 'generating');
  const dirtyCount = Object.keys(edits).length;

  return (
    <section className="space-y-5" aria-label="Daftar soal">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">Soal</h2>
          <p className="text-base text-muted-foreground">
            Setiap soal muncul di sini begitu AI selesai membuatnya.
          </p>
        </div>
        {expectedCount !== null && (
          <p
            className="text-muted-foreground text-sm tabular-nums"
            aria-live="polite"
            aria-atomic
          >
            <span className="font-semibold text-foreground">
              {questions.length}
            </span>
            <span className="mx-1">/</span>
            <span>{expectedCount}</span>
          </p>
        )}
      </header>

      <SaveBar
        dirtyCount={dirtyCount}
        isSaving={isSaving}
        pendingImages={Object.values(edits).filter((e) => e.image?.file).length}
        onSave={onSave}
        onDiscard={onDiscard}
      />

      {questions.length === 0 ? (
        <EmptyQuestions status={status} />
      ) : (
        <ol className="space-y-5">
          {questions.map((question, i) => {
            const edit = edits[question.id];
            const rendered = applyStagedEdit(question, edit);
            return (
              <li key={question.id}>
                <QuestionCard
                  question={rendered}
                  index={i}
                  isDirty={Boolean(edit)}
                  onEdit={() => onEdit(rendered)}
                  onDelete={() => onDelete(question.id)}
                  isDeleting={deletingQuestionId === question.id}
                  deleteDisabled={deleteDisabled}
                />
              </li>
            );
          })}
        </ol>
      )}

      {showStreamingFooter && questions.length > 0 && (
        <div
          className="space-y-2 border border-border border-dashed px-4 py-3 text-muted-foreground text-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <Spinner className="size-4 animate-spin" weight="bold" aria-hidden />
            <span>Soal berikutnya sedang dibuat…</span>
          </div>
          <p className="text-xs leading-relaxed">{GENERATION_BACKGROUND_MESSAGE}</p>
        </div>
      )}
    </section>
  );
}
