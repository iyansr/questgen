import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { useState } from 'react';

import { platformFeatures } from '../constants';
import { FadeIn } from './fade-in';

export function PlatformFeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="border-border border-b px-8 py-16 md:px-16">
      <FadeIn>
        <div className="text-center">
          <h2 className="text-2xl tracking-tight md:text-3xl">
            Sederhanakan alur pembuatan soal
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Kelola materi, buat soal, dan bagikan hasil, semua dalam satu
            platform yang kuat.
          </p>
        </div>
      </FadeIn>
      <div className="mt-8 grid gap-px border border-border bg-border md:grid-cols-[5fr_8fr]">
        <div className="divide-y divide-border bg-background">
          {platformFeatures.map((f, i) => (
            <button
              key={f.title}
              onClick={() => setActiveFeature(i)}
              className={`w-full p-5 text-left transition-colors hover:bg-muted/40 ${activeFeature === i ? 'bg-card' : ''}`}
              type="button"
            >
              {activeFeature === i && (
                <div className="mb-2 h-0.5 w-6 bg-foreground" />
              )}
              <div className="font-semibold text-sm">{f.title}</div>
              <div className="mt-1 text-muted-foreground text-xs">{f.desc}</div>
            </button>
          ))}
          <div className="flex gap-2 p-4">
            <button
              type="button"
              onClick={() =>
                setActiveFeature(
                  (prev) =>
                    (prev - 1 + platformFeatures.length) %
                    platformFeatures.length,
                )
              }
              className="border border-border p-2 transition-colors hover:bg-muted"
              aria-label="Fitur sebelumnya"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveFeature((prev) => (prev + 1) % platformFeatures.length)
              }
              className="border border-border p-2 transition-colors hover:bg-muted"
              aria-label="Fitur berikutnya"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="min-h-64 overflow-hidden bg-muted/30">
          <img
            src={platformFeatures[activeFeature].image}
            alt={platformFeatures[activeFeature].title}
            className="h-full w-full object-cover transition-opacity duration-300"
            key={activeFeature}
          />
        </div>
      </div>
    </section>
  );
}
