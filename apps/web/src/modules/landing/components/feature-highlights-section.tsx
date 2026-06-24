import { FadeIn } from './fade-in';

const highlights = [
  {
    title: 'Unggah materi apa pun',
    desc: 'Dukung PDF, halaman web, dan dokumen teks untuk dijadikan sumber soal secara otomatis.',
    active: false,
  },
  {
    title: 'Pilih jenis dan tingkat kesulitan',
    desc: 'Buat soal pilihan ganda, benar/salah, esai, dan isian sesuai kebutuhan pengajaran.',
    active: true,
  },
  {
    title: 'Ekspor dan bagikan seketika',
    desc: 'Unduh hasil soal dalam format yang siap digunakan di kelas tanpa modifikasi tambahan.',
    active: false,
  },
];

export function FeatureHighlightsSection() {
  return (
    <section className="border-border border-b" id="fitur">
      <div className="divide-y divide-border">
        {highlights.map((item, i) => (
          <FadeIn key={item.title} delay={i * 0.06}>
            <div
              className={`px-8 py-7 md:px-16 ${item.active ? 'bg-background' : ''}`}
            >
              <div className="md:grid md:grid-cols-5 md:gap-12">
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  {item.active && (
                    <div className="mt-2 h-0.5 w-8 bg-foreground" />
                  )}
                </div>
                <p className="mt-1.5 text-muted-foreground text-sm md:col-span-3 md:mt-0">
                  {item.desc}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
