import { buttonVariants } from '@questgen/ui/components/button';
import { Link } from '@tanstack/react-router';

import { useAuthStore } from '@/store/auth';

import { ModeToggle } from './mode-toggle';

export default function Header() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header className="border-border/50 border-b">
      <div className="mx-auto flex h-18 max-w-350 items-center justify-between px-6 md:px-12">
        <Link to="/" className="font-serif text-xl tracking-tight">
          QuestGen
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Tentang
          </Link>
          <Link
            to="/"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Dokumentasi
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              Masuk
            </Link>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
