import { Plus, Spinner } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';

import type { StreamedQuestion } from '@/types/session-message';

import type { StagedEdit } from '../hooks/use-question-edits';
import { EmptyQuestions } from './empty-questions';
import { GENERATION_BACKGROUND_MESSAGE } from './generation-background-notice';
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
  canAdd: boolean;
  onAdd: () => void;
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
  canAdd,
  onAdd,
  onSave,
  onDiscard,
}: QuestionListProps) {
  const showStreamingFooter =
    isStreaming && (status === 'pending' || status === 'generating');
  const dirtyCount = Object.keys(edits).length;

  return (
    <section className="space-y-5" aria-label="Daftar soal">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl tracking-tight">Soal</h2>
          <p className="text-base text-muted-foreground">
            Setiap soal muncul di sini begitu AI selesai membuatnya.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
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
          {canAdd ? (
            <Button type="button" variant="outline" size="sm" onClick={onAdd}>
              <Plus weight="bold" aria-hidden />
              Tambah soal
            </Button>
          ) : null}
        </div>
      </header>

      <SaveBar
        dirtyCount={dirtyCount}
        isSaving={isSaving}
        pendingImages={Object.values(edits).filter((e) => e.image?.file).length}
        onSave={onSave}
        onDiscard={onDiscard}
      />

      {questions.length === 0 ? (
        <EmptyQuestions status={status} canAdd={canAdd} onAdd={onAdd} />
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
            <Spinner
              className="size-4 animate-spin"
              weight="bold"
              aria-hidden
            />
            <span>Soal berikutnya sedang dibuat…</span>
          </div>
          <p className="text-xs leading-relaxed">
            {GENERATION_BACKGROUND_MESSAGE}
          </p>
        </div>
      )}
    </section>
  );
}
