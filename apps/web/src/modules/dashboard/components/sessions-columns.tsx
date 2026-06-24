import { DotsThree, Eye, Trash } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@questgen/ui/components/dropdown-menu';
import { cn } from '@questgen/ui/lib/utils';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';

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

  function openSession() {
    navigate({ to: '/session/$id', params: { id: session.id } });
  }

  function deleteSession() {
    // TODO: wire to DELETE /api/sessions/:id once available.
  }

  return (
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
        <DropdownMenuItem variant="destructive" onClick={deleteSession}>
          <Trash className="size-4" weight="regular" />
          Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
