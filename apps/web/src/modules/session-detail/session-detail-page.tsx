import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { useSessionStream } from '@/hooks/use-session-stream';
import { useDeleteQuestion } from '@/services/sessions/delete-question';
import { useSession } from '@/services/sessions/detail';
import { useUpdateQuestions } from '@/services/sessions/update-questions';
import type { StreamedQuestion } from '@/types/session-message';

import { BackToTop } from './components/back-to-top';
import { GenerationBackgroundNotice } from './components/generation-background-notice';
import {
  EditQuestionDialog,
  type EditQuestionSubmitPayload,
} from './components/edit-question-dialog';
import { QuestionList } from './components/question-list';
import { SessionDetailSkeleton } from './components/session-detail-skeleton';
import { SessionHeader } from './components/session-header';
import { SessionProgress } from './components/session-progress';
import { buildBatchUpdate, useQuestionEdits } from './hooks/use-question-edits';

type SessionDetailPageProps = {
  sessionId: string;
};

export function SessionDetailPage({ sessionId }: SessionDetailPageProps) {
  const { data, isLoading, isError, error } = useSession(sessionId);
  const { status, questions, isStreaming } = useSessionStream(sessionId);
  const { edits, setEdit, clearAll, removeEdit, dirtyCount } = useQuestionEdits();
  const updateQuestions = useUpdateQuestions(sessionId);
  const deleteQuestion = useDeleteQuestion(sessionId);

  const [editingQuestion, setEditingQuestion] =
    useState<StreamedQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  );

  const handleEdit = useCallback((question: StreamedQuestion) => {
    setEditingQuestion(question);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setEditingQuestion(null);
  }, []);

  const handleDialogSubmit = useCallback(
    ({ patch, imageFile, removeImage }: EditQuestionSubmitPayload) => {
      setEdit(patch.id, patch, imageFile, removeImage);
    },
    [setEdit],
  );

  const handleSave = useCallback(async () => {
    if (dirtyCount === 0) return;
    const batch = buildBatchUpdate({ edits });
    try {
      const result = await updateQuestions.mutateAsync({
        sessionId,
        patches: batch.patches,
        images: batch.images,
      });
      toast.success(
        result.updated === 1
          ? '1 soal berhasil diperbarui.'
          : `${result.updated} soal berhasil diperbarui.`,
      );
      clearAll();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal menyimpan perubahan.',
      );
    }
  }, [dirtyCount, edits, updateQuestions, sessionId, clearAll]);

  const handleDelete = useCallback(
    async (questionId: string) => {
      setDeletingQuestionId(questionId);
      try {
        await deleteQuestion.mutateAsync({ sessionId, questionId });
        removeEdit(questionId);
        toast.success('Soal berhasil dihapus.');
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Gagal menghapus soal.',
        );
        throw err;
      } finally {
        setDeletingQuestionId(null);
      }
    },
    [deleteQuestion, sessionId, removeEdit],
  );

  if (isLoading) return <SessionDetailSkeleton />;

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <SessionHeaderFallback />
        <div
          role="alert"
          className="border border-destructive/40 bg-destructive/5 p-6"
        >
          <p className="font-semibold text-base text-destructive">
            Tidak dapat memuat sesi
          </p>
          <p className="mt-2 text-base text-muted-foreground leading-relaxed">
            {error instanceof Error ? error.message : 'Sesi tidak ditemukan.'}
          </p>
        </div>
      </div>
    );
  }

  const expectedCount =
    typeof data.config?.count === 'number' ? data.config.count : null;
  const isGeneratingSession =
    status.status === 'pending' || status.status === 'generating';

  return (
    <div className="space-y-10">
      <SessionHeader
        session={data}
        questionsCount={questions.length}
        dirtyCount={dirtyCount}
      />
      {isGeneratingSession && <GenerationBackgroundNotice />}
      <BackToTop />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <SessionProgress
              status={status.status}
              questionsCount={questions.length}
              expectedCount={expectedCount}
              isStreaming={isStreaming}
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          <QuestionList
            questions={questions}
            status={status.status}
            isStreaming={isStreaming}
            expectedCount={expectedCount}
            edits={edits}
            isSaving={updateQuestions.isPending}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingQuestionId={deletingQuestionId}
            deleteDisabled={
              isStreaming ||
              status.status === 'generating' ||
              updateQuestions.isPending
            }
            onSave={handleSave}
            onDiscard={clearAll}
          />
        </div>
      </div>

      <EditQuestionDialog
        open={Boolean(editingQuestion)}
        onOpenChange={handleDialogOpenChange}
        question={editingQuestion}
        onApply={handleDialogSubmit}
      />
    </div>
  );
}

function SessionHeaderFallback() {
  return (
    <header className="space-y-3">
      <div className="h-3 w-32 animate-pulse bg-muted" />
      <div className="h-9 w-2/3 animate-pulse bg-muted" />
      <div className="h-3 w-48 animate-pulse bg-muted" />
    </header>
  );
}
