import { Link } from '@tanstack/react-router';

import { landingImages } from '../constants';
import { FadeIn } from './fade-in';

export function HeroSection() {
  return (
    <section className="border-border border-b px-8 pt-20 pb-16 text-center md:px-16 md:pt-24">
      <FadeIn>
        <h1 className="text-4xl leading-tight tracking-tight md:text-5xl lg:text-[3.25rem]">
          Buat soal ujian
          <br />
          berkualitas tinggi
          <br />
          secara otomatis
        </h1>
      </FadeIn>
      <FadeIn delay={0.1}>
        <p className="mx-auto mt-5 max-w-sm text-muted-foreground text-sm leading-relaxed md:text-base">
          Ubah materi apa pun menjadi soal pilihan ganda, esai, dan isian dengan
          teknologi kecerdasan buatan.
        </p>
      </FadeIn>
      <FadeIn delay={0.2}>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="bg-foreground px-6 py-2.5 font-medium text-background text-sm transition-opacity hover:opacity-80"
          >
            Mulai Gratis
          </Link>
          <a
            href="#fitur"
            className="border border-border px-6 py-2.5 font-medium text-sm transition-colors hover:bg-muted"
          >
            Lihat Fitur
          </a>
        </div>
      </FadeIn>
      <FadeIn delay={0.3}>
        <div className="mt-12 overflow-hidden border border-border">
          <img
            src={landingImages.hero}
            alt="QuestGen - dashboard pembuatan soal"
            className="w-full object-cover"
          />
        </div>
      </FadeIn>
    </section>
  );
}
