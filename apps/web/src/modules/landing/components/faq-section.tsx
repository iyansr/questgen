import { CaretDown } from '@phosphor-icons/react';
import { useState } from 'react';

import { faqs } from '../constants';
import { FadeIn } from './fade-in';

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="border-border border-b px-8 py-16 md:px-16">
      <FadeIn>
        <h2 className="text-2xl tracking-tight md:text-3xl">
          Pertanyaan yang sering diajukan
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Semua yang perlu Anda ketahui tentang QuestGen.
        </p>
      </FadeIn>
      <div className="mt-8 divide-y divide-border">
        {faqs.map((item, i) => (
          <FadeIn key={item.q} delay={i * 0.04}>
            <div>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between py-4 text-left font-medium text-sm"
                type="button"
              >
                <span>{item.q}</span>
                <CaretDown
                  size={14}
                  className={`ml-4 shrink-0 transition-transform duration-200 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className="grid transition-all duration-300 ease-in-out"
                style={{
                  gridTemplateRows: openFaq === i ? '1fr' : '0fr',
                }}
              >
                <div className="overflow-hidden">
                  <p className="pb-4 text-muted-foreground text-sm">{item.a}</p>
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
