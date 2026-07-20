## Catatan evaluasi untuk penguji: tone/intent match (order-invariant)

### Masalah yang diangkat

Soal AI sering **berbeda isinya** dari soal manusia pada sample exercise. Itu wajar jika sistem tidak disuruh menyalin soal gold. Penguji ingin melihat apakah AI bisa menghasilkan **tone/intent yang mirip**, misalnya:

| Manusia | AI (masih dianggap mirip) |
|---------|---------------------------|
| Apa yang dimaksud dengan buku? | Apa pengertian buku .... |
| Apa yang dimaksud dengan buku? | Buku adalah .... |
| (nomor 1) | boleh muncul di nomor lain |

Urutan nomor **tidak** dipakai sebagai kriteria gagal/lulus.

### Dua jenis skor (jangan dicampur)

| Metrik | Apa yang diukur | Temuan v1 (9 sampel) |
|--------|-----------------|----------------------|
| **Pattern / style (lama)** | Distribusi templat set (Uji Kompetensi “feel”) | ~74 (mirip kuat secara *genre*) |
| **Tone-match (baru)** | Tiap soal manusia → pasangan AI terdekat (intent+tone), **abaikan urutan** | **rata-rata 35,8** (coverage ≥50: **43%**) |
| **Similarity (headline baru)** | `0.50·tone + 0.25·style + 0.25·structural` | **rata-rata 55,0** |

Ini menjelaskan kesan penguji: AI menulis *seperti* soal latihan, tetapi sering **bukan pertanyaan yang sama** dengan sample exercise.

### Cara menjalankan

```bash
# Rescore run yang sudah ada (tidak OCR ulang)
pnpm --filter server eval:rescore

# Generate baru + skor tone
pnpm --filter server eval:quality -- --variant v1-ipa-stems --samples 1,2,3 --skip-ingest
```

Hasil: `samples/eval/tone-rescore.jsonl` dan field `tonePairs` di `samples/eval/runs/*.json`.

### Kalimat siap sidang

> Sistem tidak dituntut menyalin soal manusia nomor demi nomor. Evaluasi memakai dua lapisan: (1) kemiripan pola/gaya asesmen set-level, dan (2) pencocokan tone/intent per butir yang mengabaikan urutan—misalnya “Apa yang dimaksud X?” dianggap mirip dengan “Apa pengertian X?” atau “X adalah …”. Hasil menunjukkan gaya set relatif dekat (~74), sementara kesamaan intent per butir terhadap sample exercise masih sedang (tone-match rata-rata ~36), sehingga AI menghasilkan soal baru yang sejenis, bukan replika soal manusia.
