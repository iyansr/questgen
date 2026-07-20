# Draf Tambahan BAB II & BAB III (+ Daftar Pustaka)

Dokumen ini disusun agar **UAT tetap fokus utama**, sementara **perbandingan soal AI vs manusia** masuk sebagai evaluasi tambahan kualitas keluaran.  
Penomoran (`2.x`, `3.x`) sesuaikan dengan struktur skripsimu.

---

# BAB II  
## TINJAUAN PUSTAKA (cuplikan yang perlu ditambah/disesuaikan)

> Catatan: Subbab UAT/TAM yang sudah ada **tetap dipertahankan**. Di bawah ini adalah **tambahan** agar BAB II selaras dengan hasil perbandingan AI–manusia di BAB IV.

### 2.x Evaluasi Kualitas Soal yang Dihasilkan Sistem

Selain aspek penerimaan pengguna, sistem pembangkit soal juga perlu dinilai dari sisi **kualitas keluaran**. Dalam konteks asesmen pendidikan, kualitas soal pilihan ganda biasanya dikaitkan dengan kejelasan stem, kelayakan pengecoh, kesesuaian dengan tujuan pembelajaran, serta keselarasan dengan gaya soal yang lazim digunakan pada jenjang terkait (Kurikulum Merdeka / Uji Kompetensi).

Pada penelitian yang memanfaatkan model bahasa besar (LLM) untuk menghasilkan soal, sejumlah studi membandingkan butir soal AI dengan butir soal buatan manusia atau ahli. Doughty dkk. (2024) membandingkan MCQ buatan GPT-4 dengan MCQ buatan manusia pada pembelajaran pemrograman dan menilai kejelasan bahasa, kualitas pengecoh, serta keselarasan dengan capaian pembelajaran. Studi pada domain lain juga menunjukkan bahwa soal AI dapat mendekati kualitas soal ahli pada aspek tertentu, namun tetap memerlukan validasi (lihat misalnya evaluasi psikometrik maupun penilaian pakar pada asesmen berbasis MCQ).

Dengan demikian, evaluasi sistem QuestGen pada penelitian ini tidak hanya menekankan penerimaan pengguna (UAT), tetapi juga dapat dilengkapi dengan **evaluasi kemiripan pola soal AI terhadap soal manusia** sebagai indikasi bahwa keluaran sistem mendekati gaya asesmen buku teks / Uji Kompetensi.

### 2.x+1 Pendekatan Evaluasi Hybrid: Metrik Struktural dan LLM-as-a-Judge

Evaluasi otomatis terhadap keluaran LLM sering memakai pendekatan **LLM-as-a-Judge**, yaitu memanfaatkan model bahasa yang kuat sebagai penilai terhadap keluaran model lain. Zheng dkk. (2023) menunjukkan bahwa penilai berbasis LLM dapat mendekati preferensi manusia dengan tingkat kesepakatan tinggi, sehingga menjadi alternatif yang skalabel ketika evaluasi manusia penuh mahal atau sulit dilakukan secara massal.

Namun, penilai LLM memiliki risiko bias (posisi, verbositas, dsb.). Oleh karena itu, pada penelitian ini penilaian gaya/pedagogi oleh LLM dikombinasikan dengan **analisis struktural berbasis aturan** (pattern fingerprint): penandaan templat stem (misalnya pola *disebut …*, pernyataan benar, pasangan fungsi, skenario singkat, urutan), format pilihan ganda A–D, serta perkiraan campuran tuntutan kognitif. Kombinasi keduanya menghasilkan skor kemiripan pola soal AI terhadap gold standard soal manusia.

Pendekatan ini sejalan dengan kebutuhan skripsi: UAT menjawab *apakah sistem diterima pengguna*, sedangkan evaluasi hybrid menjawab *apakah hasil soal secara pola mirip soal manusia*.

### 2.x+2 Kerangka Hubungan Antar Konsep (opsional 1 paragraf)

Secara ringkas, kerangka evaluasi sistem QuestGen mencakup dua lapisan:

1. **Lapisan penerimaan pengguna** — diukur melalui UAT (dan bila relevan, konstruk terkait penerimaan teknologi seperti persepsi kemanfaatan dan kemudahan penggunaan).  
2. **Lapisan kualitas keluaran** — diukur melalui perbandingan pola soal AI dengan soal Uji Kompetensi manusia (gold standard), menggunakan skor struktural dan LLM-as-a-Judge.

Kedua lapisan saling melengkapi dan tidak saling menggantikan.

---

# BAB III  
## METODE PENELITIAN (cuplikan pengujian)

> Sisipkan / sesuaikan pada bagian metode pengujian. Alur pengembangan sistem yang sudah ada biarkan.

### 3.x Metode Pengujian Sistem

Pengujian sistem dilakukan melalui **dua jalur** yang menjawab tujuan berbeda.

#### 3.x.1 Pengujian Penerimaan Pengguna (UAT) — pengujian utama

User Acceptance Testing (UAT) digunakan untuk menilai apakah sistem QuestGen dapat diterima dan digunakan oleh pengguna sasaran (guru/pendidik) dalam skenario pembuatan soal berbasis materi. Pelaksanaan UAT mengikuti skenario tugas nyata (unggah materi / pilih sumber, atur konfigurasi soal, menghasilkan dan meninjau soal), dilanjutkan dengan instrumen persepsi/penerimaan yang telah disusun pada penelitian ini.

Hasil UAT menjadi indikator utama keberhasilan sistem dari sisi **keberterimaan dan kebergunaan bagi pengguna**.

#### 3.x.2 Evaluasi Tambahan: Perbandingan Pola Soal AI dan Soal Manusia

Berdasarkan kebutuhan untuk menilai kualitas keluaran—dan selaras dengan saran perbaikan pada tahap presentasi hasil—dilakukan evaluasi tambahan berupa perbandingan soal yang dihasilkan sistem (AI) dengan soal Uji Kompetensi buatan manusia pada materi yang sama.

**a. Data acuan (gold standard)**  
Soal manusia diambil dari latihan Uji Kompetensi pada buku teks SMP (materi + exercise). Setiap sampel memuat file materi yang diunggah ke sistem serta soal manusia sebagai acuan pola.

**b. Prosedur pembangkitan soal AI**  
Soal AI dihasilkan melalui pipeline sistem yang sama dengan penggunaan nyata: unggah materi → ekstraksi/OCR → embedding → temu kembali konteks (RAG) → pembangkitan soal sesuai konfigurasi (jenjang, kurikulum, distribusi tipe soal).

**c. Instrumen pengukuran kemiripan**  
Kemiripan diukur pada skala 0–100 dengan kombinasi:

1. **Skor struktural (deterministik)** — sidik jari pola stem dan format soal (templat, akhiran `....`, empat opsi A–D, bentuk opsi, perkiraan ranah kognitif). Distribusi pola himpunan soal AI dibandingkan dengan himpunan soal manusia.  
2. **Skor penilai LLM (*LLM-as-a-Judge*)** — model penilai menilai kemiripan gaya asesmen / pola Uji Kompetensi (bukan kesamaan kunci jawaban), dengan rubrik tetap.  
3. **Skor pola gabungan**  
   \[
   \text{Skor pola} = 0{,}55 \times S_{\text{struktural}} + 0{,}45 \times S_{\text{penilai}}
   \]  
4. **Pemeriksaan kewajaran (spot-check)** — sebagian butir diperiksa apakah masih dapat dijawab dari materi/topik terkait.

**d. Interpretasi skor**  
Secara praktis, skor 50–69 dikategorikan cukup mirip; 70–84 mirip kuat; ≥85 sangat mirip. Evaluasi ini **tidak** menggantikan uji psikometrik di kelas (indeks kesukaran/daya beda), melainkan menilai kemiripan **genre/pola asesmen** terhadap soal manusia.

**e. Posisi terhadap UAT**  
Evaluasi AI vs manusia bersifat **pelengkap**. Keberhasilan sistem secara keseluruhan dibaca dari: (1) penerimaan pengguna (UAT), dan (2) kecenderungan keluaran soal mendekati pola soal manusia.

### 3.x+1 Alur Ringkas Pengujian (teks untuk gambar)

1. Siapkan sampel materi + soal manusia (gold).  
2. Jalankan UAT pada pengguna sasaran → analisis penerimaan.  
3. Untuk evaluasi tambahan: generate soal AI dari materi yang sama → hitung skor struktural + LLM-as-a-Judge → bandingkan dengan gold.  
4. Sintesis temuan pada BAB IV.

---

# DAFTAR PUSTAKA (sumber yang relevan)

Format contoh APA 7; sesuaikan gaya sitasi kampusmu.

Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). *A taxonomy for learning, teaching, and assessing: A revision of Bloom’s taxonomy of educational objectives*. Longman.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly, 13*(3), 319–340. https://doi.org/10.2307/249008

Doughty, J., Wan, Z., Smith, A., et al. (2024). A comparative study of AI-generated (GPT-4) and human-crafted MCQs in programming education. In *Proceedings of the 55th ACM Technical Symposium on Computer Science Education (SIGCSE ’24)*. Association for Computing Machinery. https://doi.org/10.1145/3636243.3636256

Venkatesh, V., Morris, M. G., Davis, G. B., & Davis, F. D. (2003). User acceptance of information technology: Toward a unified view. *MIS Quarterly, 27*(3), 425–478. https://doi.org/10.2307/30036540

Zheng, L., Chiang, W.-L., Sheng, Y., Zhuang, S., Wu, Z., Zhuang, Y., Lin, Z., Li, Z., Li, D., Xing, E. P., Zhang, H., Gonzalez, J. E., & Stoica, I. (2023). Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. *Advances in Neural Information Processing Systems (NeurIPS), Datasets and Benchmarks Track*. https://doi.org/10.48550/arXiv.2306.05685

### Sumber pendukung (opsional, jika ingin menambah kedalaman)

Kühl, N., et al. / studi terkait AI-generated assessment items — pilih yang paling dekat domainmu.  
Contoh tambahan yang relevan secara tema (bukan wajib):

- Evaluasi MCQ AI vs ahli pada konteks pendidikan (domain kedokteran/asesmen): artikel JMIR Formative Research mengenai perbandingan psikometrik item LLM dan item fakultas (2026), https://formative.jmir.org/2026/1/e84904  
- Evaluasi kemampuan model AI menghasilkan MCQ berlevel: *BMC Research Notes*, https://doi.org/10.1186/s13104-026-07683-z  

> Untuk skripsi berbasis UAT, **Davis (1989)** dan/atau **Venkatesh dkk. (2003)** biasanya sudah ada di BAB II-mu. Yang **wajib ditambah** agar selaras dengan BAB IV baru: **Zheng dkk. (2023)** dan **Doughty dkk. (2024)**. Anderson & Krathwohl (2001) opsional untuk mendukung bucket kognitif.

---

## Saran penyisipan cepat

1. BAB II: tempel subbab `2.x` dan `2.x+1` setelah bagian UAT/TAM.  
2. BAB III: di metode pengujian, buat dua subpoin seperti `3.x.1` (UAT) dan `3.x.2` (evaluasi AI vs manusia).  
3. BAB IV: UAT dulu, lalu “Evaluasi tambahan…” (pakai cuplikan `BAB_IV_CUPLIKAN_PERBANDINGAN.md`).  
4. Di sidang, satu kalimat: *“UAT mengukur penerimaan; perbandingan AI–manusia mengukur kualitas pola keluaran sebagai evaluasi tambahan.”*
