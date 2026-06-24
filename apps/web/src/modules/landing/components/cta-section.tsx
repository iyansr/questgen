import { Link } from '@tanstack/react-router';

import { stripeStyle } from '../constants';
import { FadeIn } from './fade-in';

export function CtaSection() {
  return (
    <section
      className="border-border border-b px-8 py-20 text-center md:px-16"
      style={stripeStyle}
    >
      <FadeIn>
        <h2 className="text-3xl tracking-tight md:text-4xl lg:text-5xl">
          Siap mengubah cara
          <br />
          Anda membuat soal?
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-muted-foreground text-sm">
          Bergabunglah dengan ribuan pendidik yang lebih produktif bersama
          QuestGen.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-block bg-foreground px-8 py-3 font-medium text-background text-sm transition-opacity hover:opacity-80"
        >
          Mulai Gratis
        </Link>
      </FadeIn>
    </section>
  );
}
