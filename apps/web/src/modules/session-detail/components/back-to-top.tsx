import { ArrowUp } from '@phosphor-icons/react';
import { Button } from '@questgen/ui/components/button';
import { cn } from '@questgen/ui/lib/utils';
import { useEffect, useState } from 'react';

const SHOW_AFTER_PX = 400;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button
      variant="outline"
      size="icon-lg"
      aria-label="Kembali ke atas"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={scrollToTop}
      className={cn(
        'fixed right-4 bottom-4 z-50 rounded-full border-border bg-card shadow-sm transition-all duration-200 md:right-6 md:bottom-6',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ArrowUp className="size-5" weight="bold" aria-hidden />
    </Button>
  );
}
