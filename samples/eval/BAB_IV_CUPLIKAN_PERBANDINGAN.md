## 4.x Hasil Perbandingan Soal AI dan Soal Manusia

Bagian ini menyajikan hasil evaluasi kesamaan pola soal yang dihasilkan sistem QuestGen (AI) terhadap soal Uji Kompetensi buatan manusia pada materi yang sama. Yang diukur adalah kemiripan **pola asesmen** (bentuk stem, format pilihan ganda, gaya bahasa buku teks, dan campuran tuntutan kognitif), bukan kesamaan teks soal secara verbatim maupun kesamaan kunci jawaban.

Skor kemiripan dinyatakan dalam skala 0–100 melalui kombinasi skor struktural (sidik jari pola stem) dan skor penilai gaya penulisan. Interpretasi praktis: 50–69 cukup mirip; 70–84 mirip kuat; ≥85 sangat mirip.

### 4.x.1 Hasil pada Tiga Topik Inti

Tiga topik IPA Biologi Kelas IX dievaluasi sebelum dan sesudah perbaikan panduan prompt gaya Uji Kompetensi.

Tabel 4.x Perbandingan skor pola soal AI terhadap soal manusia (topik inti)

| No | Topik | Skor sebelum perbaikan | Skor sesudah perbaikan | Selisih |
|----|-------|------------------------|------------------------|---------|
| 1 | Sistem Reproduksi pada Manusia | 54,9 | 73,0 | +18,1 |
| 2 | Sistem Perkembangbiakan Tumbuhan dan Hewan | 68,5 | 67,5 | −1,0 |
| 3 | Pewarisan Sifat pada Makhluk Hidup | 71,8 | 75,9 | +4,1 |
| | **Rata-rata** | **65,1** | **72,1** | **+7,0** |

Setelah perbaikan, rata-rata skor pola naik dari 65,1 menjadi 72,1 dan masuk kategori **mirip kuat**. Peningkatan terbesar terjadi pada topik Sistem Reproduksi pada Manusia (+18,1), yang sebelumnya paling jauh dari pola soal manusia.

### 4.x.2 Hasil pada Perluasan Mata Pelajaran

Evaluasi diperluas ke topik IPA Fisika dan Matematika agar tidak terbatas pada tiga sampel awal.

Tabel 4.y Skor pola soal AI terhadap soal manusia (perluasan topik)

| No | Topik | Bidang | Skor pola | Kategori |
|----|-------|--------|-----------|----------|
| 1 | Sistem Reproduksi pada Manusia | IPA Biologi | 73,0 | Mirip kuat |
| 2 | Sistem Perkembangbiakan Tumbuhan dan Hewan | IPA Biologi | 67,5 | Cukup–mirip kuat |
| 3 | Pewarisan Sifat pada Makhluk Hidup | IPA Biologi | 75,9 | Mirip kuat |
| 4 | Tekanan Zat dan Penerapannya dalam Kehidupan Sehari-hari | IPA Fisika | 74,3 | Mirip kuat |
| 5 | Sistem Pernapasan | IPA Biologi | 73,5 | Mirip kuat |
| 6 | Kemagnetan dan Pemanfaatannya | IPA Fisika | 65,7 | Cukup–mirip kuat |
| 7 | Usaha dan Pesawat Sederhana | IPA Fisika | 82,5 | Mirip kuat |
| 8 | Pola Bilangan | Matematika | 72,4 | Mirip kuat |
| 9 | Statistika | Matematika | 81,4 | Mirip kuat |
| | **Rata-rata (n = 9)** | | **74,0** | **Mirip kuat** |

Seluruh topik memperoleh skor ≥ 65,7. Tidak ada topik yang berada di bawah ambang “kemiripan sebagian” (20–50). Nilai tertinggi terdapat pada Usaha dan Pesawat Sederhana (82,5) dan Statistika (81,4); nilai terendah pada Kemagnetan dan Pemanfaatannya (65,7).

### 4.x.3 Contoh Perbandingan Butir

Contoh berikut memperlihatkan bahwa AI meniru **templat** soal manusia, bukan menyalin isinya.

Pada topik Sistem Reproduksi pada Manusia, soal manusia memakai pola definisi dan pasangan fungsi, misalnya: *“Bagian testis yang berperan dalam produksi sperma dan hormon testosteron disebut ....”* dan *“Pasangan antara bagian alat reproduksi laki-laki dan fungsinya berikut ini yang benar adalah ....”*. Soal AI pada materi yang sama juga memakai pola serupa, misalnya: *“Pembelahan sel yang menghasilkan empat sel anakan dengan jumlah kromosom haploid disebut ....”* dan *“Pasangan antara organ reproduksi laki-laki dan fungsinya yang benar adalah ....”*.

Pada topik Usaha dan Pesawat Sederhana, soal manusia dan soal AI sama-sama menampilkan pola soal cerita dengan perhitungan usaha (gaya × perpindahan) serta klasifikasi konsep, sesuai kebiasaan latihan fisika SMP.

### 4.x.4 Pembahasan

Hasil di atas menunjukkan bahwa soal AI QuestGen **mirip secara pola** dengan soal Uji Kompetensi manusia. Rata-rata skor 74,0 pada sembilan topik mendukung klaim bahwa keluaran sistem sudah mendekati gaya asesmen buku teks, khususnya pada: (1) bahasa Indonesia formal, (2) pilihan ganda A–D dengan stem yang sering diakhiri `....`, (3) rotasi templat *disebut*, pernyataan benar, pasangan fungsi, skenario singkat, dan penerapan hitung/pola, serta (4) pengecoh yang masih berada dalam ranah konsep yang sama.

Perbaikan prompt berbasis pola Uji Kompetensi terbukti efektif, terutama pada topik yang sebelumnya lemah. Artinya, kualitas kemiripan tidak hanya bergantung pada model bahasa, tetapi juga pada **aturan gaya asesmen** yang diberikan sistem.

Perbedaan antar topik tetap ada. Topik yang kaya penerapan numerik (usaha/pesawat, statistika) cenderung lebih mudah diselaraskan dengan pola manusia. Topik kemagnetan relatif lebih rendah karena soal AI lebih sering menekankan penjelasan/rumus, sementara soal manusia lebih banyak stem langsung dan ketergantungan gambar. Hal ini menegaskan keterbatasan sistem pada butir yang sangat bergantung ilustrasi: tanpa gambar yang sama, pola soal berbasis gambar tidak dapat ditiru sepenuhnya.

Selain itu, kemiripan yang diukur adalah kemiripan **genre asesmen**, bukan identitas konten. Soal AI disusun dari materi yang diunggah pengguna; soal manusia adalah latihan bab buku. Perbedaan isi butir per butir merupakan hal yang wajar dan justru menunjukkan bahwa sistem tidak melakukan penyalinan soal gold.

### 4.x.5 Ringkasan Temuan Bab Ini

1. Soal AI dan soal manusia **mirip secara pola asesmen**, dengan rata-rata skor pola **74,0 / 100** (n = 9).  
2. Setelah penyesuaian prompt, skor rata-rata tiga topik inti meningkat dari **65,1** menjadi **72,1**.  
3. Kemiripan tampak pada bentuk dan gaya Uji Kompetensi, bukan pada penyalinan teks soal manusia.  
4. Keterbatasan utama terletak pada soal berbasis gambar dan pada materi yang latihan manusianya bukan berbentuk Uji Kompetensi pilihan ganda.
