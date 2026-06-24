import { Button } from '@questgen/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@questgen/ui/components/dialog';

type ExportPdfPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string | null;
  onDownload: () => void;
  isDownloading: boolean;
};

export function ExportPdfPreviewDialog({
  open,
  onOpenChange,
  previewUrl,
  onDownload,
  isDownloading,
}: ExportPdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-1/2 left-1/2 z-[60] flex h-[min(92vh,900px)] w-[min(96vw,72rem)] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-border border-b px-6 py-5">
          <DialogTitle>Pratinjau PDF</DialogTitle>
          <DialogDescription>
            Periksa tampilan lembar soal sebelum mengunduh.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          {previewUrl ? (
            <iframe
              title="Pratinjau PDF"
              src={previewUrl}
              className="min-h-0 w-full flex-1 border border-border bg-muted"
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center border border-border bg-muted text-muted-foreground text-sm">
              Memuat pratinjau…
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-border border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Tutup
          </Button>
          <Button type="button" onClick={onDownload} disabled={isDownloading}>
            {isDownloading ? 'Mengunduh…' : 'Unduh PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
