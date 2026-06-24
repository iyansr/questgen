import { FilePdf, Globe, TextT } from '@phosphor-icons/react';

import { FadeIn } from './fade-in';

export function BentoGridSection() {
  return (
    <section className="border-border border-b px-8 py-16 md:px-16">
      <FadeIn>
        <div className="text-center">
          <h2 className="text-2xl tracking-tight md:text-3xl">
            Dirancang untuk kemudahan yang sesungguhnya
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Kelola materi, buat soal, dan bagikan hasilnya, semua dalam satu
            platform.
          </p>
        </div>
      </FadeIn>
      <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border">
        <FadeIn delay={0.05}>
          <div className="bg-card p-6 md:p-8">
            <h3 className="font-semibold text-sm">Cerdas. Sederhana. Andal.</h3>
            <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
              AI kami memahami konteks materi dan menghasilkan soal yang relevan
              dan akurat.
            </p>
            <div className="mt-6 border border-border bg-background p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Sesi aktif
              </div>
              <div className="mt-1 font-medium text-sm">
                Sistem Pencernaan Manusia
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {['Pilihan Ganda', '15 soal', 'Tingkat Sedang'].map((tag) => (
                  <span
                    key={tag}
                    className="border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 border-border border-t pt-2.5 text-[10px] text-muted-foreground">
                Menghasilkan soal...
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="bg-card p-6 md:p-8">
            <h3 className="font-semibold text-sm">Materi Anda, soal Anda</h3>
            <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
              Setiap soal dihasilkan langsung dari konten yang Anda unggah,
              bukan dari data umum.
            </p>
            <div className="mt-6 space-y-2">
              {[
                'bab-1-pencernaan.pdf',
                'bab-2-respirasi.pdf',
                'bab-3-sirkulasi.pdf',
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 border border-border bg-background px-3 py-2"
                >
                  <div className="h-1.5 w-1.5 bg-foreground" />
                  <span className="text-[11px] text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="bg-card p-6 md:p-8">
            <h3 className="font-semibold text-sm">Format yang fleksibel</h3>
            <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
              PDF, URL halaman web, dan teks langsung didukung sepenuhnya.
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { label: 'PDF', Icon: FilePdf },
                { label: 'Web', Icon: Globe },
                { label: 'Teks', Icon: TextT },
              ].map(({ label, Icon }) => (
                <div
                  key={label}
                  className="flex flex-1 flex-col items-center gap-2 border border-border bg-background py-4"
                >
                  <Icon size={18} className="text-foreground" />
                  <span className="font-medium text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div className="bg-card p-6 md:p-8">
            <h3 className="font-semibold text-sm">Angka yang berbicara</h3>
            <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
              Lacak produktivitas dan volume soal yang dihasilkan setiap bulan.
            </p>
            <div className="mt-6">
              <div className="font-serif text-3xl">12.847</div>
              <div className="text-muted-foreground text-xs">
                soal dihasilkan bulan ini
              </div>
              <div className="mt-4 flex items-end gap-0.5">
                {[40, 65, 30, 80, 55, 90, 45, 70, 85, 60, 95, 75].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-foreground/25"
                      style={{ height: `${h * 0.42}px` }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
