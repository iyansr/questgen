# Laporan Perbandingan Soal Buatan AI dan Soal Buatan Manusia

**Dokumen pendukung skripsi**  
Sistem pembangkitan soal berbasis materi ajar (QuestGen)  
Tanggal evaluasi: 19 Juli 2026

---

## 1. Pendahuluan

Laporan ini membandingkan **soal yang dihasilkan sistem AI** (QuestGen) dengan **soal Uji Kompetensi buatan manusia** yang diambil dari buku teks pelajaran SMP. Pertanyaan utama yang dijawab:

> Sejauh mana pola/bentuk soal AI mirip dengan pola soal manusia pada topik dan materi yang sama?

Penekanan evaluasi adalah **kesamaan pola asesmen** (struktur stem, tipe soal, gaya bahasa buku teks, campuran kognitif, dan karakteristik pengecoh), **bukan** kesamaan jawaban atau kesamaan teks soal secara verbatim.

---

## 2. Data dan Ruang Lingkup

### 2.1 Sumber soal manusia (gold)

Soal manusia berasal dari potongan bab buku teks (materi + latihan Uji Kompetensi). Setiap sampel berisi:

- `materials.pdf` — materi ajar yang diunggah ke sistem (OCR → embedding → RAG)
- `exercise.pdf` — soal Uji Kompetensi manusia sebagai acuan perbandingan

Korpus awal diperluas hingga 35 sampel dari berbagai mata pelajaran. Setelah penyaringan kelayakan (ada soal pilihan ganda Uji Kompetensi, jumlah halaman materi ≤ 80, bukan duplikat), **16 sampel layak** untuk evaluasi otomatis. Dari itu, **9 sampel** dijalankan end-to-end pada pipeline produksi dan dilaporkan di sini.

### 2.2 Topik yang dievaluasi

| Kode | Topik | Bidang |
|------|-------|--------|
| S1 | Sistem Reproduksi pada Manusia | IPA Biologi |
| S2 | Sistem Perkembangbiakan Tumbuhan dan Hewan | IPA Biologi |
| S3 | Pewarisan Sifat pada Makhluk Hidup | IPA Biologi |
| S4 | Tekanan Zat dan Penerapannya dalam Kehidupan Sehari-hari | IPA Fisika |
| S5 | Sistem Pernapasan | IPA Biologi |
| S13 | Kemagnetan dan Pemanfaatannya | IPA Fisika |
| S23 | Usaha dan Pesawat Sederhana | IPA Fisika |
| S31 | Pola Bilangan | Matematika |
| S35 | Statistika | Matematika |

Jenjang: **SMP**, kurikulum **Kurikulum Merdeka** (kelas VII–IX sesuai sumber).

### 2.3 Soal AI

Soal AI dihasilkan lewat alur nyata sistem QuestGen:

1. Unggah materi (`materials.pdf`)
2. OCR + chunking + embedding (ChromaDB)
3. Riset berbasis dokumen (RAG + kompilasi materi)
4. Pembangkitan soal terstruktur (pilihan ganda / isian / uraian sesuai distribusi soal manusia)

Konfigurasi yang dilaporkan sebagai hasil utama adalah varian prompt **v1** (panduan gaya Uji Kompetensi untuk topik IPA konseptual + aturan kuantitatif untuk matematika), setelah dibandingkan dengan baseline **v0** (prompt generik).

---

## 3. Metode Perbandingan

Kemiripan diukur pada skala **0–100**. Skor akhir (**skor pola**) menggabungkan dua komponen:

\[
\text{Skor pola} = 0{,}55 \times S_{\text{struktural}} + 0{,}45 \times S_{\text{penilai}}
\]

### 3.1 Skor struktural (deterministik)

Setiap butir soal digolongkan ke sidik jari pola, antara lain:

- templat stem: *disebut …*, *pernyataan yang benar*, *pasangan … dan fungsinya*, *ciri-ciri*, skenario singkat, urutan/tahapan, aplikasi hitung/genetika, dsb.
- apakah stem diakhiri `....`
- apakah pilihan ganda memakai tepat 4 opsi A–D
- bentuk opsi (istilah pendek vs pernyataan panjang)
- penanda bahasa asesmen Indonesia

Distribusi sidik jari himpunan soal AI dibandingkan dengan himpunan soal manusia (jarak histogram → kesamaan 0–100).

### 3.2 Skor penilai LLM (gaya/pedagogi)

Model penilai menilai kemiripan **gaya penulisan asesmen** antara set soal AI dan set soal manusia pada topik yang sama (bukan menilai kebenaran kunci jawaban). Rubrik mencakup: formalitas bahasa buku teks, rotasi templat stem, pengecoh yang masuk akal, dan campuran tuntutan kognitif.

### 3.3 Pemeriksaan kewajaran

Pada setiap putaran, 3 butir acak diperiksa apakah masih dapat dijawab dari materi topik tersebut. Pada semua putaran yang selesai, tingkat kelayakan = **100%**.

### 3.4 Interpretasi skor

| Rentang skor pola | Interpretasi praktis |
|-------------------|----------------------|
| 0–19 | Pola berbeda jauh dari soal manusia |
| 20–49 | Ada kemiripan sebagian (target awal eksperimen) |
| 50–69 | Cukup mirip secara pola |
| 70–84 | Mirip kuat (gaya Uji Kompetensi terbaca jelas) |
| 85–100 | Sangat mirip / hampir setara secara pola |

Catatan: skor tinggi **tidak** berarti soal AI menyalin soal manusia, melainkan pola bentuknya mendekati latihan buku teks.

---

## 4. Hasil

### 4.1 Perbandingan baseline (v0) vs panduan Uji Kompetensi (v1) — tiga sampel inti

| Sampel | Topik | Skor pola v0 | Skor pola v1 | Perubahan |
|--------|-------|--------------|--------------|-----------|
| S1 | Sistem Reproduksi pada Manusia | 54,9 | **73,0** | +18,1 |
| S2 | Perkembangbiakan Tumbuhan dan Hewan | 68,5 | **67,5** | −1,0 |
| S3 | Pewarisan Sifat pada Makhluk Hidup | 71,8 | **75,9** | +4,1 |
| | **Rata-rata** | **65,1** | **72,1** | **+7,0** |

Pada ketiga topik inti, skor rata-rata berada di pita **mirip kuat** setelah perbaikan prompt (v1).

### 4.2 Hasil v1 pada sembilan sampel (termasuk perluasan mata pelajaran)

| Sampel | Topik | Struktural | Penilai | **Skor pola** | Interpretasi |
|--------|-------|------------|---------|---------------|--------------|
| S1 | Sistem Reproduksi pada Manusia | 71,3 | 75 | **73,0** | Mirip kuat |
| S2 | Perkembangbiakan Tumbuhan dan Hewan | 61,4 | 75 | **67,5** | Cukup–mirip kuat |
| S3 | Pewarisan Sifat | 76,7 | 75 | **75,9** | Mirip kuat |
| S4 | Tekanan Zat | 65,6 | 85 | **74,3** | Mirip kuat |
| S5 | Sistem Pernapasan | 72,3 | 75 | **73,5** | Mirip kuat |
| S13 | Kemagnetan | 66,2 | 65 | **65,7** | Cukup–mirip kuat |
| S23 | Usaha dan Pesawat Sederhana | 80,4 | 85 | **82,5** | Mirip kuat |
| S31 | Pola Bilangan | 78,4 | 65 | **72,4** | Mirip kuat |
| S35 | Statistika | 86,6 | 75 | **81,4** | Mirip kuat |
| | **Rata-rata (n = 9)** | | | **74,0** | **Mirip kuat** |

Seluruh sampel yang diuji memiliki skor pola **≥ 65,7**, jauh di atas ambang kemiripan sebagian (20–50) yang ditetapkan pada awal eksperimen.

### 4.3 Ringkasan jawaban atas pertanyaan penelitian

**Ya — soal AI dan soal manusia mirip secara pola asesmen**, dengan rata-rata skor pola **74,0 / 100** pada sembilan topik yang diuji.

Secara kualitatif, kemiripan yang paling konsisten terlihat pada:

1. Bahasa Indonesia formal bergaya buku teks / Uji Kompetensi  
2. Format pilihan ganda A–D dengan stem yang sering diakhiri `....`  
3. Penggunaan templat klasik (*disebut*, pasangan fungsi, pernyataan benar, skenario singkat, penerapan rumus/pola)  
4. Pengecoh yang masih berada dalam ranah konsep yang sama (bukan opsi acak)

### 4.4 Contoh perbandingan stem (ilustratif)

**Sampel S1 — Reproduksi manusia**

| Sumber | Contoh stem |
|--------|-------------|
| Manusia | *Bagian testis yang berperan dalam produksi sperma dan hormon testosteron disebut ....* |
| AI | *Pembelahan sel yang menghasilkan empat sel anakan dengan jumlah kromosom haploid disebut ....* |
| Manusia | *Pasangan antara bagian alat reproduksi laki-laki dan fungsinya berikut ini yang benar adalah ....* |
| AI | *Pasangan antara organ reproduksi laki-laki dan fungsinya yang benar adalah ....* |

Templat *disebut …* dan *pasangan … yang benar* muncul pada keduanya, meskipun isi faktual berbeda (AI tidak menyalin butir manusia).

**Sampel S23 — Usaha dan pesawat sederhana**

| Sumber | Contoh stem |
|--------|-------------|
| Manusia | Skenario gaya dan perpindahan → hitung usaha / klasifikasi pernyataan |
| AI | *Beny mendorong kereta belanja dengan gaya \(250\,\text{N}\) sejauh \(50\,\text{m}\). Besar usaha yang dilakukan Beny adalah ....* |

Pola soal cerita + perhitungan usaha mengikuti kebiasaan latihan fisika SMP pada soal manusia.

---

## 5. Pembahasan

### 5.1 Apa arti “mirip” di sini

Hasil menunjukkan kemiripan **genre asesmen**, bukan identitas konten. Soal AI disusun dari materi yang diunggah; soal manusia adalah latihan bab yang sudah ada di buku. Oleh karena itu, perbedaan butir per butir adalah hal yang diharapkan. Yang diukur adalah apakah AI menulis soal “seperti latihan buku”, bukan “menyalin kunci bab”.

### 5.2 Pengaruh perbaikan prompt

Perbaikan terbesar terjadi pada S1 (+18,1 poin): dari pola yang lebih generik menjadi lebih dekat ke rotasi templat Uji Kompetensi. Rata-rata tiga sampel inti naik dari 65,1 menjadi 72,1. Ini mendukung temuan bahwa **panduan gaya asesmen spesifik domain** (IPA konseptual vs matematika kuantitatif) lebih menentukan kemiripan pola daripada sekadar model generik.

### 5.3 Variasi antar mata pelajaran

- **IPA fisika terapan** (usaha/pesawat, tekanan) cenderung skor tinggi — templat definisi + hitung + klasifikasi mudah diselaraskan.  
- **Kemagnetan (S13)** relatif paling rendah (65,7): soal AI lebih sering memuat penjelasan/rumus, sementara soal manusia lebih banyak stem langsung dan ketergantungan gambar.  
- **Matematika** (pola bilangan, statistika) tetap berada di pita mirip kuat, menandakan aturan kuantitatif yang sudah ada pada sistem cukup menjaga gaya soal hitung.

### 5.4 Keterbatasan

1. **Ketergantungan gambar** — beberapa butir manusia berbasis urutan gambar/ilustrasi; tanpa katalog gambar yang sama, AI tidak dapat meniru pola itu sepenuhnya.  
2. **Cakupan mata pelajaran** — potongan latihan IPS/PPKn pada korpus sering berupa proyek/aktivitas, bukan Uji Kompetensi pilihan ganda, sehingga belum ikut skor.  
3. **Variansi penilai LLM** — skor penilai dapat bergeser sekitar ±5–10 poin; skor struktural lebih stabil.  
4. **Ukuran sampel end-to-end** — 9 topik (bukan seluruh 35) karena biaya OCR dan waktu generasi penuh.

### 5.5 Tone/intent match (saran penguji)

Selain skor pola set-level, evaluasi dilengkapi **tone-match** order-invariant: tiap soal manusia dipasangkan ke soal AI terdekat (paraphrase OK; nomor/urutan diabaikan). Pada v1 (n = 9): tone-match rata-rata **35,8** (coverage ≥50 ~**43%**); skor similarity gabungan (`0,50·tone + 0,25·style + 0,25·struktural`) rata-rata **55,0**. Ini menjelaskan kesan “soalnya beda”: gaya set dekat (~74), sementara intent per butir terhadap sample exercise masih sedang.

---

## 6. Kesimpulan

1. Soal yang dihasilkan QuestGen dari materi ajar **memiliki pola yang mirip** dengan soal Uji Kompetensi manusia pada topik yang diuji.  
2. Rata-rata **skor pola = 74,0 / 100** (n = 9), termasuk dalam kategori **mirip kuat**.  
3. Tidak ada sampel di bawah ambang “kemiripan sebagian” (20); nilai terendah tetap 65,7.  
4. Kemiripan terutama pada **bentuk dan gaya asesmen**, bukan penyalinan teks soal manusia.  
5. Penyesuaian prompt berbasis pola Uji Kompetensi meningkatkan kemiripan (rata-rata inti 65,1 → 72,1), khususnya pada topik yang sebelumnya paling lemah.  
6. Pada metrik **tone-match** (order-invariant), rata-rata **35,8** — AI sering membuat butir baru sejenis, bukan paraphrase 1:1 terhadap sample exercise.

Secara ringkas untuk skripsi:

> **Soal AI QuestGen dan soal manusia mirip secara pola asesmen (skor rata-rata ~74%), sementara kesamaan tone/intent per butir terhadap sample exercise masih sedang (~36), dengan catatan perbedaan isi butir dan keterbatasan pada soal berbasis gambar.**

---

## 7. Lampiran teknis (untuk reproduksi)

| Item | Lokasi / perintah |
|------|-------------------|
| Katalog sampel | `samples/catalog.json` |
| Soal manusia (gold) | `samples/gold/sample-*.json` |
| Baris skor mentah | `samples/eval/results.jsonl` |
| Dump per putaran | `samples/eval/runs/` |
| Rescore tone-match | `samples/eval/tone-rescore.jsonl` / `pnpm --filter server eval:rescore` |
| Catatan penguji | `samples/eval/CATATAN_TONE_MATCH_PENGUJI.md` |
| Laporan teknis (EN) | `samples/eval/REPORT.md` |
| Menjalankan ulang evaluasi | `pnpm --filter server eval:quality -- --variant v1-ipa-stems --samples 1,2,3` |

Rumus skor dan sidik jari pola diimplementasikan pada modul fingerprint evaluasi sistem QuestGen.
