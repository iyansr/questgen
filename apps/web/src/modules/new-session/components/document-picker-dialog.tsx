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
import { Check, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  type DocumentListItem,
  useReadyDocuments,
} from '@/services/documents/list';

type DocumentPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  onSelect: (id: string) => void;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function DocumentPickerDialog({
  open,
  onOpenChange,
  value,
  onSelect,
}: DocumentPickerDialogProps) {
  const { data, isLoading, isError, refetch } = useReadyDocuments();
  const documents: DocumentListItem[] = data?.items ?? [];
  const [pendingId, setPendingId] = useState<string | undefined>(value);

  useEffect(() => {
    if (open) setPendingId(value);
  }, [open, value]);

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  function handleConfirm() {
    if (!pendingId) return;
    onSelect(pendingId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-base">
            Pilih Dokumen
          </DialogTitle>
          <DialogDescription>
            Gunakan dokumen yang sudah pernah Anda unggah dan diproses.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto border border-border">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-xs">
              Memuat dokumen…
            </div>
          ) : isError ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <span>Gagal memuat dokumen.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                Coba lagi
              </Button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex h-32 items-center justify-center px-4 text-center text-muted-foreground text-xs">
              Belum ada dokumen siap pakai. Silakan unggah file terlebih dahulu.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {documents.map((doc) => {
                const isSelected = doc.id === pendingId;
                return (
                  <li key={doc.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setPendingId(doc.id)}
                      className={cn(
                        'flex h-auto w-full items-start gap-3 rounded-none px-3 py-3 text-left',
                        'hover:bg-muted/60',
                        isSelected && 'bg-muted',
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="truncate font-medium text-xs">
                          {doc.filename}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Diunggah {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="size-4 shrink-0 text-foreground" />
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Batal
          </DialogClose>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!pendingId || pendingId === value}
          >
            Pilih
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
