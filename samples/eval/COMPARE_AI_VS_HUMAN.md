# Perbandingan Soal AI vs Soal Manusia

Dokumen ini disusun agar mudah dipindahkan ke **BAB IV** (hasil dan pembahasan). Bagian atas berisi narasi siap sidang; bagian bawah berisi bukti visual side by side beserta panduan menaruh gambar.

---

## 4.x Hasil Perbandingan Visual Soal AI dan Soal Manusia

Bagian ini menampilkan perbandingan langsung antara soal **Uji Kompetensi / exercise pada buku teks** (buatan manusia) dengan soal yang **dihasilkan sistem QuestGen (AI)** pada materi yang sama. Tujuan tampilan ini adalah memberikan bukti kualitatif bahwa AI **dapat menghasilkan soal yang mirip** dengan pola soal manusia—baik dari segi bentuk pertanyaan, gaya bahasa asesmen, maupun tone intent—tanpa harus menyalin teks soal buku secara verbatim.

### Apa arti “mirip” dalam perbandingan ini

Sistem QuestGen tidak dirancang untuk menyalin soal exercise yang sudah ada di buku. Soal AI disusun dari **materi ajar yang diunggah** (melalui pipeline ekstraksi, temu kembali konteks, lalu pembangkitan soal). Karena itu, perbedaan isi butir per butir adalah hal yang wajar.

Yang dimaksud “mirip” di sini adalah:

1. **Mirip secara pola / gaya asesmen** — AI menulis dalam genre soal latihan buku teks (bahasa Indonesia formal, stem pilihan ganda yang sering diakhiri `....`, opsi A–D, rotasi templat seperti *disebut …*, pernyataan benar, pasangan fungsi/konsep, skenario singkat, atau soal cerita hitung).
2. **Mirip secara tone / intent** — AI dapat mengajukan pertanyaan dengan maksud yang sejenis, meskipun wording-nya berbeda. Contoh yang masih dianggap mirip:
   - Manusia: *“Apa yang dimaksud dengan …?”*
   - AI: *“Apa pengertian …?”* atau *“… adalah …?”*
3. **Urutan nomor tidak harus sama** — soal yang di buku muncul sebagai nomor 1 boleh muncul di nomor lain pada keluaran AI. Yang dibandingkan adalah kesamaan bentuk dan maksud pertanyaan, bukan posisi nomor.

Dengan demikian, pembaca BAB IV diharapkan melihat bahwa AI **mampu meniru gaya soal manusia** dan pada sejumlah kasus juga **mendekati tone pertanyaan yang sama**, sambil tetap menghasilkan butir baru yang relevan dengan materi.

### Cara membaca gambar perbandingan

Pada setiap topik, ditampilkan dua kolom:

| Kolom kiri — Soal manusia | Kolom kanan — Soal AI |
|---------------------------|------------------------|
| Cuplikan dari exercise / Uji Kompetensi buku teks | Cuplikan dari hasil generate QuestGen |
| Acuan gaya asesmen yang sudah dipakai di sekolah | Keluaran sistem pada topik yang sama |
| Ditulis penulis/penyusun buku | Disusun AI berdasarkan konten materi |

Saat mengamati pasangan gambar, perhatikan terutama:

- apakah stem AI terasa seperti soal latihan (bukan ringkasan materi biasa);
- apakah ada pola yang berulang mirip buku (`disebut`, pasangan, pernyataan benar, soal cerita, dsb.);
- apakah ada pertanyaan yang “sejiwa” dengan soal manusia meskipun teksnya tidak sama;
- bahwa isi konsep boleh berbeda — yang penting masih berada pada topik dan ranah asesmen yang sama.

### Temuan yang diharapkan dari bukti visual

Dari perbandingan side by side pada beberapa topik (IPA Biologi, IPA Fisika, dan Matematika), terlihat bahwa:

- Soal AI **sering memakai bentuk yang sama** dengan soal manusia: pilihan ganda formal, stem terpotong (`....`), dan rotasi pola Uji Kompetensi.
- Pada sejumlah butir, AI **dapat menghasilkan pertanyaan yang mirip secara tone** (paraphrase / maksud sejenis), meskipun tidak selalu 1:1 dengan setiap soal di buku.
- Pada butir lain, AI menghasilkan **soal baru yang sejenis** pada topik yang sama. Hal ini justru memperkuat argumen bahwa sistem tidak melakukan penyalinan exercise, melainkan menghasilkan asesmen mandiri yang tetap dekat dengan gaya buku.
- Keterbatasan yang terlihat secara visual biasanya terkait soal yang sangat bergantung pada **gambar/ilustrasi** di buku: tanpa gambar yang sama, padanan AI bisa berbeda bentuknya.

Secara ringkas untuk pembahasan BAB IV:

> Hasil perbandingan visual menunjukkan bahwa QuestGen mampu menghasilkan soal yang mirip dengan soal manusia pada exercise buku teks—baik dalam pola asesmen maupun, pada sebagian kasus, dalam tone/intent pertanyaan—tanpa menyalin teks soal buku. Perbedaan isi butir tetap ada karena soal AI disusun dari materi, bukan dari kunci exercise.

---

## Bukti visual (side by side)

> **Untuk penulis:** setelah screenshot disimpan di `compare-images/`, gambar di bawah akan tampil. Narasi singkat di tiap topik bisa ikut dipindah ke BAB IV bersama figur.

### Gambar 4.x.1 — Sistem Reproduksi pada Manusia (Sample 1)

Pada topik ini, soal manusia banyak memakai pola definisi (`disebut …`) dan pasangan organ–fungsi. Soal AI pada materi yang sama juga dapat menampilkan pola serupa, misalnya stem definisi proses biologi atau pasangan konsep, meskipun isi butirnya tidak identik. Perbandingan ini memperlihatkan bahwa AI dapat “menulis seperti” soal Uji Kompetensi biologi, bukan sekadar merangkum materi.

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 1](./compare-images/sample-1-human.png) | ![AI sample 1](./compare-images/sample-1-ai.png) |

**Keterangan gambar:** Kiri = cuplikan Uji Kompetensi buku; kanan = cuplikan soal AI QuestGen pada topik Sistem Reproduksi pada Manusia.

---

### Gambar 4.x.2 — Sistem Perkembangbiakan Tumbuhan dan Hewan (Sample 2)

Topik ini sering memuat soal konsep perkembangbiakan serta butir yang bergantung gambar. Pada sisi AI, pola stem formal dan pilihan ganda tetap dapat muncul; namun padanan visual untuk soal berbasis ilustrasi buku belum tentu sama. Yang perlu ditekankan di BAB IV: kemiripan yang diharapkan adalah kemiripan **gaya dan intent**, bukan kesamaan layout gambar.

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 2](./compare-images/sample-2-human.png) | ![AI sample 2](./compare-images/sample-2-ai.png) |

**Keterangan gambar:** Kiri = exercise buku; kanan = soal AI pada topik Perkembangbiakan Tumbuhan dan Hewan.

---

### Gambar 4.x.3 — Pewarisan Sifat pada Makhluk Hidup (Sample 3)

Pada topik genetika / hukum Mendel, soal manusia dan soal AI sama-sama dapat menampilkan pertanyaan konsep (pernyataan benar, hubungan kromosom–DNA, penerapan hukum pewarisan). AI dapat menghasilkan butir dengan tone sejenis—misalnya menanyakan bunyi hukum Mendel atau sifat genotipe/fenotipe—meski nomor dan wording berbeda.

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 3](./compare-images/sample-3-human.png) | ![AI sample 3](./compare-images/sample-3-ai.png) |

**Keterangan gambar:** Kiri = exercise buku; kanan = soal AI pada topik Pewarisan Sifat.

---

### Gambar 4.x.4 — Usaha dan Pesawat Sederhana (Sample 23)

Contoh dari IPA Fisika. Baik soal manusia maupun soal AI sering memakai **soal cerita** dengan perhitungan usaha (gaya × perpindahan) serta klasifikasi konsep. Perbandingan ini menunjukkan bahwa kemiripan tidak terbatas pada IPA Biologi: AI juga dapat mengikuti kebiasaan asesmen fisika SMP.

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 23](./compare-images/sample-23-human.png) | ![AI sample 23](./compare-images/sample-23-ai.png) |

**Keterangan gambar:** Kiri = exercise buku; kanan = soal AI pada topik Usaha dan Pesawat Sederhana.

---

### Gambar 4.x.5 — Statistika (Sample 35)

Contoh dari Matematika. Soal manusia dan soal AI dapat sama-sama menanyakan median, mean, kuartil, atau interpretasi data (tabel/diagram). Ini memperkuat klaim bahwa sistem bersifat lintas mapel: AI menyesuaikan gaya soal dengan karakteristik topik, bukan hanya meniru satu template biologi.

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 35](./compare-images/sample-35-human.png) | ![AI sample 35](./compare-images/sample-35-ai.png) |

**Keterangan gambar:** Kiri = exercise buku; kanan = soal AI pada topik Statistika.

---

### Ringkasan untuk paragraf penutup subbab

Berdasarkan cuplikan visual di atas, dapat disimpulkan bahwa sistem QuestGen **mampu menghasilkan soal yang mirip** dengan soal manusia pada exercise buku teks. Kemiripan tersebut tampak pada bentuk asesmen (pilihan ganda formal, pola stem Uji Kompetensi) dan pada sebagian kasus juga pada tone/intent pertanyaan (paraphrase yang sejiwa), meskipun urutan nomor dan teks butir tidak harus sama. Temuan visual ini selaras dengan arah evaluasi kuantitatif pada laporan terpisah (skor pola set-level relatif tinggi; tone-match per butir bersifat sedang), dan mendukung argumen bahwa keluaran AI dekat dengan gaya soal sekolah tanpa menjadi salinan exercise buku.

---

## Lampiran: panduan menaruh gambar

Bagian ini untuk penulis dokumen (tidak wajib ikut ke BAB IV).

1. Simpan screenshot di folder:

```text
samples/eval/compare-images/
```

2. Nama file yang dipakai di atas:

| File | Isi |
|------|-----|
| `sample-1-human.png` | Screenshot Uji Kompetensi / exercise dari buku (sample 1) |
| `sample-1-ai.png` | Screenshot soal AI hasil generate (sample 1) |
| `sample-2-human.png` | Exercise buku sample 2 |
| `sample-2-ai.png` | Soal AI sample 2 |
| `sample-3-human.png` | Exercise buku sample 3 |
| `sample-3-ai.png` | Soal AI sample 3 |
| `sample-23-human.png` | Exercise buku sample 23 |
| `sample-23-ai.png` | Soal AI sample 23 |
| `sample-35-human.png` | Exercise buku sample 35 |
| `sample-35-ai.png` | Soal AI sample 35 |

3. Sumber yang disarankan:

| Sisi | Ambil dari |
|------|------------|
| **Manusia** | `samples/sample-N/exercise.pdf` → screenshot halaman Uji Kompetensi |
| **AI** | Halaman session/hasil generate di app, atau export PDF/print soal AI untuk topik yang sama |

4. Tips: potong 3–5 butir agar terbaca; samakan skala crop kiri–kanan bila memungkinkan.

5. Template topik tambahan:

```markdown
### Gambar 4.x.N — [Judul Topik] (Sample N)

[1–2 kalimat pembahasan singkat untuk BAB IV.]

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human](./compare-images/sample-N-human.png) | ![AI](./compare-images/sample-N-ai.png) |

**Keterangan gambar:** Kiri = exercise buku; kanan = soal AI.
```

### Checklist

- [ ] Screenshot human dari `samples/sample-N/exercise.pdf`
- [ ] Screenshot AI dari hasil generate topik yang sama
- [ ] File di `samples/eval/compare-images/` sesuai nama di tabel
- [ ] Preview Markdown: kedua kolom tampil berdampingan
- [ ] Narasi + figur siap dipindah ke BAB IV
