import { Check, CurrencyDollar } from '@phosphor-icons/react';
import { useState } from 'react';

import { FadeIn } from './fade-in';
import { SectionBadge } from './section-badge';

export function PricingSection() {
  const [billingAnnual, setBillingAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      desc: 'Cocok untuk individu dan pengajar yang baru memulai.',
      price: 'Gratis',
      priceSub: 'selamanya',
      cta: 'Mulai Gratis',
      features: [
        'Hingga 30 soal/bulan',
        'PDF dan teks',
        'Dukungan komunitas',
        'Template standar',
        'Analitik dasar',
      ],
      highlighted: false,
    },
    {
      name: 'Profesional',
      desc: 'Fitur lengkap untuk pengajar yang aktif.',
      price: billingAnnual ? 'Rp 79.000' : 'Rp 99.000',
      priceSub: 'per bulan, per pengguna',
      cta: 'Mulai Sekarang',
      features: [
        'Soal tak terbatas',
        'Semua format sumber',
        'Dukungan prioritas',
        'Template kustom',
        'Analitik lanjutan',
        'Ekspor massal',
      ],
      highlighted: true,
    },
    {
      name: 'Institusi',
      desc: 'Solusi lengkap untuk lembaga pendidikan besar.',
      price: 'Custom',
      priceSub: 'per tahun, per institusi',
      cta: 'Hubungi Kami',
      features: [
        'Semua di Profesional',
        'Manajer akun dedikasi',
        'Onboarding kustom',
        'Keamanan SSO',
        'Kontrak kustom',
        'White-label',
      ],
      highlighted: false,
    },
  ];

  return (
    <section className="border-border border-b px-8 py-16 md:px-16" id="harga">
      <FadeIn>
        <div className="text-center">
          <SectionBadge icon={<CurrencyDollar size={12} />} label="Harga" />
          <h2 className="mt-4 text-2xl tracking-tight md:text-3xl">
            Pilih paket yang sesuai kebutuhan
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Mulai gratis, tingkatkan kapan pun Anda siap.
          </p>
        </div>
      </FadeIn>
      <FadeIn delay={0.08}>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex border border-border p-0.5">
            {[
              { label: 'Tahunan', value: true },
              { label: 'Bulanan', value: false },
            ].map(({ label, value }) => (
              <button
                type="button"
                key={label}
                onClick={() => setBillingAnnual(value)}
                className={`px-5 py-1.5 font-medium text-sm transition-colors ${
                  billingAnnual === value
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>
      <div className="mt-8 grid gap-px border border-border bg-border md:grid-cols-3">
        {plans.map((plan, i) => (
          <FadeIn key={plan.name} delay={i * 0.07}>
            <div
              className={`flex h-full flex-col p-6 md:p-8 ${
                plan.highlighted ? 'bg-foreground text-background' : 'bg-card'
              }`}
            >
              <div className="flex-1">
                <h3
                  className={`font-semibold text-base ${plan.highlighted ? 'text-background' : ''}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-1 text-xs ${plan.highlighted ? 'text-background/60' : 'text-muted-foreground'}`}
                >
                  {plan.desc}
                </p>
                <div className="mt-6">
                  <span
                    className={`font-serif text-3xl ${plan.highlighted ? 'text-background' : ''}`}
                  >
                    {plan.price}
                  </span>
                </div>
                <div
                  className={`text-xs ${plan.highlighted ? 'text-background/60' : 'text-muted-foreground'}`}
                >
                  {plan.priceSub}
                </div>
                <button
                  type="button"
                  className={`mt-6 w-full py-2.5 font-medium text-sm transition-opacity hover:opacity-80 ${
                    plan.highlighted
                      ? 'bg-background text-foreground'
                      : 'border border-border bg-background text-foreground'
                  }`}
                >
                  {plan.cta}
                </button>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <Check
                        size={12}
                        className={`shrink-0 ${plan.highlighted ? 'text-background/70' : 'text-foreground'}`}
                      />
                      <span
                        className={
                          plan.highlighted
                            ? 'text-background/70'
                            : 'text-muted-foreground'
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
