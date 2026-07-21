# Perbandingan Soal AI vs Soal Manusia

Dokumen visual sederhana: kiri = soal dari **exercise buku**, kanan = soal **hasil generate AI** (topik sama).

> Tidak ada penjelasan metode di sini — hanya bukti tampilan side by side.

---

## Panduan menaruh gambar

1. Simpan screenshot di folder:

```text
samples/eval/compare-images/
```

2. Pakai nama file berikut (atau sesuaikan path di tabel di bawah):

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

4. Tips screenshot: potong 3–5 butir saja agar terbaca; jangan full halaman kalau terlalu kecil.

5. Setelah file gambar ada di folder, preview Markdown (VS Code / GitHub) akan menampilkan gambar otomatis.

---

## Sample 1 — Sistem Reproduksi pada Manusia

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 1](./compare-images/sample-1-human.png) | ![AI sample 1](./compare-images/sample-1-ai.png) |

<!-- Ganti file di atas, atau tempel path lain di sini -->

---

## Sample 2 — Sistem Perkembangbiakan Tumbuhan dan Hewan

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 2](./compare-images/sample-2-human.png) | ![AI sample 2](./compare-images/sample-2-ai.png) |

---

## Sample 3 — Pewarisan Sifat pada Makhluk Hidup

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 3](./compare-images/sample-3-human.png) | ![AI sample 3](./compare-images/sample-3-ai.png) |

---

## Sample 23 — Usaha dan Pesawat Sederhana

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 23](./compare-images/sample-23-human.png) | ![AI sample 23](./compare-images/sample-23-ai.png) |

---

## Sample 35 — Statistika

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human sample 35](./compare-images/sample-35-human.png) | ![AI sample 35](./compare-images/sample-35-ai.png) |

---

## Template kosong (copy-paste untuk topik lain)

```markdown
## Sample N — [Judul Topik]

| Soal manusia (exercise buku) | Soal AI (hasil generate) |
|:----------------------------:|:------------------------:|
| ![Human](./compare-images/sample-N-human.png) | ![AI](./compare-images/sample-N-ai.png) |
```

---

## Checklist cepat

- [ ] Screenshot human dari `samples/sample-N/exercise.pdf`
- [ ] Screenshot AI dari hasil generate topik yang sama
- [ ] File disimpan di `samples/eval/compare-images/` dengan nama di tabel panduan
- [ ] Preview Markdown: kedua kolom tampil berdampingan
