/** Google Form for beta access requests — replace when the real link is ready. */
export const REQUEST_ACCESS_FORM_URL = 'https://forms.gle/placeholder';

export const stripeStyle: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(-45deg, transparent 0px, transparent 10px, rgb(0 0 0 / 0.025) 10px, rgb(0 0 0 / 0.025) 11px)',
};

/** Unsplash CDN URLs sized per section. */
export const landingImages = {
  hero: 'https://images.unsplash.com/photo-1758612214917-81d7956c09de?w=1200&h=600&fit=crop&auto=format',
  featureUpload:
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=480&fit=crop&auto=format',
  featureAnalysis:
    'https://images.unsplash.com/photo-1759984782199-a4f6d1b6054e?w=800&h=480&fit=crop&auto=format',
  featureExport:
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=480&fit=crop&auto=format',
} as const;

export const platformFeatures = [
  {
    title: 'Buat soal dari sumber apa pun',
    desc: 'Unggah PDF, tempel URL, atau ketik teks - AI kami memahami semua jenis sumber dan menghasilkan soal berkualitas.',
    image: landingImages.featureUpload,
  },
  {
    title: 'Analisis materi secara mendalam',
    desc: 'Ubah teks biasa menjadi soal bermakna. Pilih jenis soal, jumlah, dan tingkat kesulitan dengan presisi.',
    image: landingImages.featureAnalysis,
  },
  {
    title: 'Ekspor dan bagikan seketika',
    desc: 'Unduh dalam format siap pakai, atau bagikan langsung dengan rekan pengajar.',
    image: landingImages.featureExport,
  },
];

export const testimonials = [
  {
    quote:
      'Dalam hitungan menit, saya membuat 40 soal ujian dari modul kuliah. Proses yang biasanya memakan waktu berjam-jam sekarang selesai dalam menit.',
    name: 'Ahmad Ridwan',
    role: 'Dosen Pendidikan',
    company: 'Universitas Gadjah Mada',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&auto=format',
  },
  {
    quote:
      'QuestGen mengubah cara saya mempersiapkan ujian. Soal yang dihasilkan sangat relevan dengan materi dan siap digunakan tanpa revisi.',
    name: 'Dewi Anggraini',
    role: 'Guru Biologi',
    company: 'SMA Negeri 1 Bandung',
    image:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&auto=format',
  },
];

export const faqs = [
  {
    q: 'Apa itu QuestGen dan untuk siapa?',
    a: 'QuestGen adalah platform pembuatan soal berbasis AI untuk pendidik dan mahasiswa. Cocok untuk guru, dosen, dan institusi pendidikan yang ingin membuat soal ujian berkualitas dengan lebih efisien.',
  },
  {
    q: 'Format file apa yang didukung?',
    a: 'QuestGen mendukung PDF, halaman web (URL), dan teks langsung sebagai sumber materi untuk pembuatan soal.',
  },
  {
    q: 'Berapa banyak soal yang bisa dibuat?',
    a: 'Paket Starter memungkinkan hingga 30 soal per bulan. Paket Profesional dan Institusi menawarkan pembuatan soal tanpa batas.',
  },
  {
    q: 'Apakah data materi saya aman?',
    a: 'Ya, kami menggunakan enkripsi end-to-end dan penyimpanan data yang aman. Materi Anda tidak pernah dibagikan atau digunakan untuk keperluan lain.',
  },
  {
    q: 'Bagaimana cara memulai?',
    a: 'Daftar gratis, unggah materi Anda, pilih jenis soal, dan QuestGen akan menghasilkan soal dalam hitungan detik. Tidak perlu konfigurasi teknis.',
  },
  {
    q: 'Apakah tersedia dukungan bahasa Indonesia?',
    a: 'Ya, QuestGen sepenuhnya mendukung bahasa Indonesia dan dirancang khusus untuk konteks pendidikan Indonesia.',
  },
];

export const institutions = [
  'UGM',
  'UI',
  'ITB',
  'ITS',
  'UNDIP',
  'UNPAD',
  'UB',
  'UNHAS',
  'BINUS',
  'UNIBRAW',
];
