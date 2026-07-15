import { DotsThree, Eye, Spinner, Trash } from '@phosphor-icons/react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@questgen/ui/components/dropdown-menu';
import { cn } from '@questgen/ui/lib/utils';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { toast } from 'sonner';

import { useDeleteSession } from '@/services/sessions/delete-session';
import type { SessionListItem } from '@/services/sessions/list';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-accent/10 text-accent',
  success: 'bg-foreground/10 text-foreground',
  failed: 'bg-destructive/10 text-destructive',
  completed: 'bg-foreground/10 text-foreground',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SessionActionsCell({ session }: { session: SessionListItem }) {
  const navigate = useNavigate();
  const deleteSession = useDeleteSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function openSession() {
    navigate({ to: '/session/$id', params: { id: session.id } });
  }

  async function handleConfirmDelete() {
    try {
      await deleteSession.mutateAsync({ sessionId: session.id });
      toast.success('Set soal berhasil dihapus.');
      setConfirmOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal menghapus set soal.',
      );
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Aksi untuk ${session.title}`}
            >
              <DotsThree className="size-4" weight="bold" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openSession}>
            <Eye className="size-4" weight="regular" />
            Lihat
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash className="size-4" weight="regular" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-base">
              Hapus set soal?
            </DialogTitle>
            <DialogDescription>
              {session.title} akan dihapus permanen beserta semua soalnya.
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="ghost"
                  disabled={deleteSession.isPending}
                />
              }
            >
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteSession.isPending}
              onClick={handleConfirmDelete}
            >
              {deleteSession.isPending ? (
                <Spinner
                  className="size-4 animate-spin"
                  weight="bold"
                  aria-hidden
                />
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

export const sessionsColumns: ColumnDef<SessionListItem>[] = [
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => (
      <span className="font-medium">
        <Link
          to="/session/$id"
          params={{ id: row.original.id }}
          className="hover:underline"
        >
          {row.original.title}
        </Link>
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
            STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground',
          )}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Dibuat',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Diperbarui',
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDateTime(row.original.updatedAt)}
      </span>
    ),
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Aksi</span>,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <SessionActionsCell session={row.original} />,
  },
];
