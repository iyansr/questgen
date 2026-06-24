import { ChartBar, GraduationCap } from '@phosphor-icons/react';

import { institutions, stripeStyle } from '../constants';
import { FadeIn } from './fade-in';
import { SectionBadge } from './section-badge';

export function SocialProofSection() {
  return (
    <section
      className="border-border border-b px-8 py-16 text-center md:px-16"
      style={stripeStyle}
    >
      <FadeIn>
        <SectionBadge icon={<ChartBar size={12} />} label="Kepercayaan" />
      </FadeIn>
      <FadeIn delay={0.08}>
        <h2 className="mt-4 text-2xl tracking-tight md:text-3xl">
          Dipercaya oleh pendidik di seluruh Indonesia
        </h2>
      </FadeIn>
      <FadeIn delay={0.12}>
        <p className="mt-2 text-muted-foreground text-sm">
          Ribuan dosen dan guru telah menggunakan QuestGen untuk membuat soal
          ujian berkualitas.
        </p>
      </FadeIn>
      <FadeIn delay={0.18}>
        <div className="mt-10 overflow-hidden border border-border bg-background">
          <div
            className="flex"
            style={{ animation: 'marquee 28s linear infinite' }}
          >
            {[...institutions, ...institutions].map((uni, i) => (
              <div
                key={`${uni}-${i}`}
                className="flex shrink-0 items-center gap-2.5 border-border border-r px-8 py-5"
              >
                <GraduationCap size={16} className="text-muted-foreground" />
                <span className="whitespace-nowrap font-medium text-muted-foreground text-sm">
                  {uni}
                </span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      <style>{`
				@keyframes marquee {
					0% { transform: translateX(0); }
					100% { transform: translateX(-50%); }
				}
			`}</style>
    </section>
  );
}
