import {
  ClockCounterClockwise,
  // FileText,
  House,
  Plus,
  SignOut,
} from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import { cn } from '@questgen/ui/lib/utils';
import { Link, useNavigate } from '@tanstack/react-router';

import { ModeToggle } from '@/components/mode-toggle';
import { useMe } from '@/services/auth/me';
import { useAuthStore } from '@/store/auth';

const navItems = [
  { label: 'Beranda', to: '/dashboard', icon: House },
  { label: 'Buat Soal', to: '/new', icon: Plus },
  { label: 'Riwayat', to: '/history', icon: ClockCounterClockwise },
  // { label: 'Dokumen', to: '/documents', icon: FileText },
] as const;

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data, isLoading } = useMe();

  function handleLogout() {
    clearAuth();
    navigate({ to: '/login' });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-border/50 border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to="/dashboard" className="font-serif text-lg tracking-tight">
            QuestGen
          </Link>
          <div className="flex items-center gap-3">
            <ModeToggle />
            {isLoading ? (
              <div className="h-4 w-24 animate-pulse bg-muted" />
            ) : (
              <span className="text-muted-foreground text-sm">
                {data?.user.name}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogout}
              aria-label="Keluar"
            >
              <SignOut className="size-4" weight="regular" />
            </Button>
          </div>
        </div>
      </header>
      <nav className="border-border/50 border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  'flex shrink-0 items-center gap-2 border-transparent border-b-2 px-3 py-2.5 text-muted-foreground text-sm transition-colors hover:text-foreground',
                  '[&.active]:border-accent [&.active]:text-foreground',
                )}
              >
                <Icon className="size-4" weight="regular" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
