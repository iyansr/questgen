import { FilePdf } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { SessionDetail } from '@/services/sessions/detail';
import { exportSessionPdfService } from '@/services/sessions/export-pdf';

import type { ExportPdfInput } from '../export-pdf-schema';
import { ExportPdfDialog } from './export-pdf-dialog';
import { ExportPdfPreviewDialog } from './export-pdf-preview-dialog';

function downloadBlob(blob: Blob, title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `soal-${slug || 'ujian'}.pdf`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

type ExportPdfButtonProps = {
  session: SessionDetail;
  questionsCount: number;
  dirtyCount: number;
};

export function ExportPdfButton({
  session,
  questionsCount,
  dirtyCount,
}: ExportPdfButtonProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pdfBlobRef = useRef<Blob | null>(null);

  const canExport = session.status === 'completed' && questionsCount > 0;

  const revokePreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    pdfBlobRef.current = null;
  }, []);

  useEffect(() => {
    return () => revokePreview();
  }, [revokePreview]);

  const generatePdf = useCallback(
    async (input: ExportPdfInput) => {
      setIsGenerating(true);
      try {
        const blob = await exportSessionPdfService(session.id, input);
        pdfBlobRef.current = blob;
        return blob;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal membuat PDF.');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [session.id],
  );

  const handlePreview = useCallback(
    async (input: ExportPdfInput) => {
      revokePreview();
      const blob = await generatePdf(input);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    },
    [generatePdf, revokePreview],
  );

  const handleDownload = useCallback(
    async (input: ExportPdfInput) => {
      const blob = pdfBlobRef.current ?? (await generatePdf(input));
      if (!blob) return;
      downloadBlob(blob, session.title);
      toast.success('PDF berhasil diunduh.');
    },
    [generatePdf, session.title],
  );

  const handlePreviewDownload = useCallback(async () => {
    const blob = pdfBlobRef.current;
    if (!blob) return;
    downloadBlob(blob, session.title);
    toast.success('PDF berhasil diunduh.');
  }, [session.title]);

  if (!canExport) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setFormOpen(true)}
      >
        <FilePdf className="size-4" weight="regular" aria-hidden />
        Ekspor PDF
      </Button>

      <ExportPdfDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        session={session}
        dirtyCount={dirtyCount}
        isGenerating={isGenerating}
        onPreview={handlePreview}
        onDownload={handleDownload}
      />

      <ExportPdfPreviewDialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!open) revokePreview();
          setPreviewOpen(open);
        }}
        previewUrl={previewUrl}
        onDownload={handlePreviewDownload}
        isDownloading={false}
      />
    </>
  );
}
