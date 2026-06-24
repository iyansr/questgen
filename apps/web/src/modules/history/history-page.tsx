import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { Input } from '@questgen/ui/components/input';
import { Skeleton } from '@questgen/ui/components/skeleton';
import { useState } from 'react';

import { DataTable } from '@/components/data-table';
import { type SessionStatus, useSessions } from '@/services/sessions/list';

import { sessionsColumns } from '../dashboard/components/sessions-columns';

const STATUS_OPTIONS: { value: SessionStatus | ''; label: string }[] = [
  { value: '', label: 'Semua status' },
  { value: 'pending', label: 'Pending' },
  { value: 'generating', label: 'Generating' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

function HistorySkeleton() {
  return (
    <div className="border border-border">
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export function HistoryPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState<SessionStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data: sessions, isLoading } = useSessions({
    page: page + 1,
    limit: pageSize,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  });

  const total = sessions?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput('');
    setSearch('');
    setPage(0);
  }

  function clearStatus(value: string) {
    setStatus(value as SessionStatus | '');
    setPage(0);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-serif text-3xl tracking-tight">Riwayat</h1>
        <p className="text-muted-foreground text-sm">
          Set soal yang pernah Anda buat.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSubmit} className="relative w-full sm:max-w-xs">
          <MagnifyingGlass
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            weight="regular"
          />
          <Input
            type="search"
            placeholder="Cari judul..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-8 pl-8"
          />
          {searchInput && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Bersihkan pencarian"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" weight="regular" />
            </button>
          )}
        </form>

        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => clearStatus(e.target.value)}
          className="h-8 w-full border border-border bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 sm:w-auto"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && !sessions ? (
        <HistorySkeleton />
      ) : (
        <DataTable
          columns={sessionsColumns}
          data={sessions?.items ?? []}
          emptyState={
            search || status
              ? 'Tidak ada set soal yang cocok dengan filter.'
              : 'Belum ada set soal.'
          }
          pagination={{
            pageIndex: page,
            pageSize,
            pageCount,
            total,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(0);
            },
          }}
        />
      )}
    </div>
  );
}
