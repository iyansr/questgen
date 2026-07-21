# Question quality eval report

Date: 2026-07-20  
Branch: `cursor/tone-match-eval-742a` (follows merged #15)  
Goal: document-sourced generation should match Indonesian textbook **Uji Kompetensi** patterns (~20–50% similarity target), plus order-invariant tone/intent matching for examiner feedback.

## Method

1. **Gold corpus** — extract human `exercise.pdf` → `samples/gold/*.json` + deterministic pattern fingerprints (`disebut`, `pernyataan_benar`, `pasangan`, `ciri_ciri`, `skenario`, `urutan`, …).
2. **Real pipeline harness** — `pnpm --filter server eval:quality`:
   - ingest `materials.pdf` once (`PROCESS_DOCUMENT`)
   - regenerate via `documentId` (`GENERATE_QUESTIONS`)
   - **pattern / style** = `0.55 * structural + 0.45 * LLM style judge`
   - **tone-match** = best AI pair per human item (order-invariant paraphrase / intent)
   - **similarity (headline)** = `0.50 * tone + 0.25 * style + 0.25 * structural`
3. **Corpus expansion** — pulled 35 samples from `test-result`; catalog at `samples/catalog.json` (**16 eligible** for eval).
4. **Rescore without regenerating** — `pnpm --filter server eval:rescore` writes `tone-rescore.jsonl` and updates `runs/*.json`.

### Eligibility rules

| Skip reason | Samples |
|-------------|---------|
| Duplicate of 1–3 | 10, 11, 12 |
| `materials_pages > 80` | 25, 34 |
| No Uji Kompetensi MCQ in exercise slice (IPS / PPKn / some Math VII) | 7–9, 16–21, 26–30 |

## Prompt change (winner: `v1-ipa-stems`)

- [`subject-guidance.ts`](../../apps/server/src/modules/generation/prompts/subject-guidance.ts): conceptual IPA / life-science guidance (Uji Kompetensi stem rotation, near-miss distractors, cognitive mix). Quantitative math guidance kept; conceptual checked first.
- [`question-generation.ts`](../../apps/server/src/modules/generation/prompts/question-generation.ts): short `<style>` block for formal textbook Indonesian.
- Document/web research addons ask for assessment-ready contrasts / processes.

## Scores

Pattern score 0–100 (higher = closer to human exercise style). Target ≥20, aspire 40–50.

### Core trio (samples 1–3)

| Sample | Topic | v0 structural | v0 judge | v0 pattern | v1 structural | v1 judge | v1 pattern | Δ pattern |
|--------|-------|---------------|----------|------------|---------------|----------|------------|-----------|
| 1 | Sistem Reproduksi pada Manusia | 50.8 | 60 | **54.9** | 71.3 | 75 | **73.0** | +18.1 |
| 2 | Perkembangbiakan Tumbuhan dan Hewan | 63.1 | 75 | **68.5** | 61.4 | 75 | **67.5** | −1.0 |
| 3 | Pewarisan Sifat | 77.3 | 65 | **71.8** | 76.7 | 75 | **75.9** | +4.1 |
| **Mean** | | | | **65.1** | | | **72.1** | **+7.0** |

### Expanded set (v1 only — new subjects from `test-result`)

| Sample | Topic | Domain | structural | judge | pattern | gen latency |
|--------|-------|--------|------------|-------|---------|-------------|
| 4 | Tekanan Zat … | IPA physics | 65.6 | 85 | **74.3** | 326s |
| 5 | Sistem Pernapasan | IPA bio | 72.3 | 75 | **73.5** | 193s |
| 13 | Kemagnetan | IPA physics | 66.2 | 65 | **65.7** | 97s |
| 23 | Usaha dan Pesawat Sederhana | IPA physics | 80.4 | 85 | **82.5** | 124s |
| 31 | Pola Bilangan | Math | 78.4 | 65 | **72.4** | 142s |
| 35 | Statistika | Math | 86.6 | 75 | **81.4** | 166s |

**v1 mean across all 9 scored runs: 74.0** (all ≥65.7, all above the 20–50 target band).

Sanity spot-check (answerable-from-topic): **100%** on sampled items every completed run.

## Tone / intent match (order-invariant)

Examiner feedback: AI questions often look “totally different” from the human sample exercise; order may differ; paraphrases like “Apa yang dimaksud X?” ≈ “Apa pengertian X?” / “X adalah …?” should still count.

| Metric | What it measures | v1 mean (n=9) |
|--------|------------------|---------------|
| Pattern / style (set-level) | Uji Kompetensi “feel” of the whole set | **74.0** |
| Tone-match | Best AI match per human item; order ignored | **35.8** |
| Coverage (≥50) | Share of human items with a usable pair | **~43%** |
| Similarity (headline) | `0.50·tone + 0.25·style + 0.25·structural` | **55.0** |

Interpretation: style is close; per-item intent against the sample exercise is only moderate — AI writes *new* similar items, not replicas. See [`CATATAN_TONE_MATCH_PENGUJI.md`](./CATATAN_TONE_MATCH_PENGUJI.md).

Raw rescore: [`tone-rescore.jsonl`](./tone-rescore.jsonl).

## Latency notes

- First ingest includes OCR + embed + generate (~2–11 min depending on pages / question count).
- Variant regenerations skip OCR; wall time is research + generate (~1.5–5 min).
- v1 sample-1 was slower than v0 (262s vs 66s) — acceptable for the large quality gain on the weakest sample.
- Occasional wrangler workflow hangs after OCR required restart + `--skip-ingest` resume (sample 13).

## What improved

- Sample 1 jumped from weak definition-heavy / mixed style toward textbook `disebut` / pairing / pernyataan patterns.
- Guidance now fires for conceptual IPA beyond the original biology trio (tekanan, pernapasan, kemagnetan, usaha/pesawat) and still routes math topics to quantitative rules (pola bilangan, statistika).
- No sample-topic hardcoding — routing is heuristic on topic string.

## Residual gaps

- Image-order / image-caption items (e.g. sample 2 Q3–4) still hard to match when generation does not attach the same figures.
- IPS / PPKn exercise PDFs in this dump are mostly proyek / aktivitas pages, not Uji Kompetensi MCQs — need better page slicing before they can join the harness.
- Math VII samples often lack clean MCQ extraction in the provided exercise PDFs.
- LLM judge variance ±5–10; structural score is the stable signal.
- Sample 13 (kemagnetan) is the weakest v1 run (65.7) — more formula-heavy stems than the human set.

## How to re-run

```bash
# deps: Postgres, Chroma :8000, pnpm dev:server, keys in apps/server/.dev.vars
python3 samples/build_catalog.py
pnpm --filter server eval:gold-fingerprints

# core trio baseline vs winner (reuse ingested docs)
pnpm --filter server eval:quality -- --variant v0-baseline --samples 1,2,3
pnpm --filter server eval:quality -- --variant v1-ipa-stems --samples 1,2,3 --skip-ingest

# all eligible samples
pnpm --filter server eval:quality -- --variant v1-ipa-stems --eligible

# unit tests
pnpm --filter server exec vitest run test/question-quality-eval.test.ts

# rescore existing runs for tone-match (no OCR)
pnpm --filter server eval:rescore
```

Raw rows: [`results.jsonl`](./results.jsonl). Per-run dumps: [`runs/`](./runs/). Tone rescore: [`tone-rescore.jsonl`](./tone-rescore.jsonl).
