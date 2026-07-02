import { FileDoc } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { SessionDetail } from '@/services/sessions/detail';
import { exportSessionDocxService } from '@/services/sessions/export-docx';

import type { ExportExamInput } from '../export-exam-schema';
import { ExportExamDialog } from './export-exam-dialog';

function downloadBlob(blob: Blob, title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `soal-${slug || 'ujian'}.docx`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

type ExportDocxButtonProps = {
  session: SessionDetail;
  questionsCount: number;
  dirtyCount: number;
};

export function ExportDocxButton({
  session,
  questionsCount,
  dirtyCount,
}: ExportDocxButtonProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canExport = session.status === 'completed' && questionsCount > 0;

  const handleDownload = useCallback(
    async (input: ExportExamInput) => {
      setIsGenerating(true);
      try {
        const blob = await exportSessionDocxService(session.id, input);
        downloadBlob(blob, session.title);
        toast.success('DOCX berhasil diunduh.');
        setFormOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal membuat DOCX.');
      } finally {
        setIsGenerating(false);
      }
    },
    [session.id, session.title],
  );

  if (!canExport) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setFormOpen(true)}
      >
        <FileDoc className="size-4" weight="regular" aria-hidden />
        Ekspor DOCX
      </Button>

      <ExportExamDialog
        variant="docx"
        open={formOpen}
        onOpenChange={setFormOpen}
        session={session}
        dirtyCount={dirtyCount}
        isGenerating={isGenerating}
        onDownload={handleDownload}
      />
    </>
  );
}
