import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { useState } from 'react';

import { stripeStyle, testimonials } from '../constants';
import { FadeIn } from './fade-in';

export function TestimonialSection() {
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const testimonial = testimonials[testimonialIdx];

  return (
    <section className="border-border border-b" style={stripeStyle}>
      <div className="px-8 py-16 md:px-16">
        <FadeIn>
          <div className="border border-border bg-background p-8 md:grid md:grid-cols-[auto_1fr] md:gap-10 md:p-10">
            <div className="hidden md:block">
              <img
                src={`https://picsum.photos/seed/${testimonial.seed}/120/120`}
                alt={testimonial.name}
                className="h-24 w-24 object-cover grayscale"
              />
            </div>
            <div>
              <p className="font-serif text-base leading-relaxed md:text-lg">
                "{testimonial.quote}"
              </p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="font-semibold text-sm">
                    {testimonial.name}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setTestimonialIdx(
                        (prev) =>
                          (prev - 1 + testimonials.length) %
                          testimonials.length,
                      )
                    }
                    className="border border-border p-2 transition-colors hover:bg-muted"
                    aria-label="Testimonial sebelumnya"
                    type="button"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <button
                    onClick={() =>
                      setTestimonialIdx(
                        (prev) => (prev + 1) % testimonials.length,
                      )
                    }
                    className="border border-border p-2 transition-colors hover:bg-muted"
                    aria-label="Testimonial berikutnya"
                    type="button"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
