import {
  ArrowRight,
  BookOpen,
  FileText,
  type Icon,
  ListChecks,
  Plus,
} from '@phosphor-icons/react';
import { Skeleton } from '@questgen/ui/components/skeleton';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { DataTable } from '@/components/data-table';
import { useMe } from '@/services/auth/me';
import { useSessions } from '@/services/sessions/list';

import { sessionsColumns } from './components/sessions-columns';

function formatDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: Icon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 py-6">
      <div className="flex size-10 items-center justify-center border border-border bg-muted">
        <Icon className="size-5 text-muted-foreground" weight="regular" />
      </div>
      <div>
        <p className="font-serif text-2xl tabular-nums tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground text-sm">{label}</p>
      </div>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="border border-border">
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useMe();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const { data: sessions, isLoading: isSessionsLoading } = useSessions({
    page: page + 1,
    limit: pageSize,
  });
  const today = formatDate(new Date());

  const total = sessions?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function goToNew() {
    navigate({ to: '/new' as never });
  }

  return (
    <div className="space-y-12">
      <section className="space-y-1">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </>
        ) : (
          <>
            <h1 className="font-serif text-3xl tracking-tight">
              Selamat datang, {data?.user.name}
            </h1>
            <p className="text-muted-foreground text-sm">{today}</p>
          </>
        )}
      </section>

      <section>
        <button
          type="button"
          onClick={goToNew}
          className="group flex w-full items-center justify-between gap-4 border border-border bg-card p-4 text-left transition-colors hover:bg-muted sm:p-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center bg-accent text-accent-foreground">
              <Plus className="size-5" weight="bold" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Buat Soal Baru</p>
              <p className="text-muted-foreground text-sm">
                Hasilkan soal dari topik dan materi Anda dengan AI
              </p>
            </div>
          </div>
          <ArrowRight
            className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1"
            weight="regular"
          />
        </button>
      </section>

      <section>
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <StatItem icon={ListChecks} label="Total soal dibuat" value={0} />
          <StatItem icon={BookOpen} label="Set tersimpan" value={0} />
          <StatItem icon={FileText} label="Dokumen diunggah" value={0} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-xl tracking-tight">Terbaru</h2>
          {sessions && sessions.items.length > 0 && (
            <button
              type="button"
              onClick={() => navigate({ to: '/history' as never })}
              className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
            >
              Lihat semua
            </button>
          )}
        </div>
        {isSessionsLoading && !sessions ? (
          <SessionsSkeleton />
        ) : (
          <DataTable
            columns={sessionsColumns}
            data={sessions?.items ?? []}
            emptyState="Belum ada set soal."
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
      </section>
    </div>
  );
}
