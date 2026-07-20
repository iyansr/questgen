# Session Handoff

## Verified Now

- What is currently working: IPA/conceptual subject guidance + eval harness; per-chunk heading path (031); doc-first subtopic expand (030); research compile (029).
- What verification actually ran: real-pipeline eval (9 samples, v1 mean pattern **74.0**); `pnpm --filter server check-types`; `vitest run test/question-quality-eval.test.ts` (5 passed).

## Changed This Session (032)

- Code: `subject-guidance.ts` (conceptual IPA + topic routing), `question-generation.ts` (`<style>`), research addons; eval scripts under `apps/server/scripts/eval/`; fingerprint module under `src/modules/generation/eval/`.
- Artifacts: `samples/` (35 PDFs + gold + catalog), `samples/eval/REPORT.md`, `results.jsonl`.
- Commits: on `cursor/question-quality-eval-742a` (PR #15).

## Broken Or Unverified

- 19/35 samples not eval-eligible (duplicates, >80 pages, or non-MCQ exercise slices for IPS/PPKn/Math VII).
- Old Chroma docs may still lack per-section `headingPath` until re-ingest.
- Wrangler local workflows occasionally hang after OCR — resume with `--skip-ingest`.

## Next Best Step

- Highest-priority unfinished feature: **slice IPS/PPKn/Math VII exercises into true Uji Kompetensi MCQs** (or drop from catalog) so `--eligible` covers more subjects.
- Why it is next: guidance already generalizes; remaining gap is gold coverage, not prompts.
- What counts as passing: ≥5 new eligible non-IPA samples with pattern score ≥40 under v1.
- What must not change: session create API; question schema; beta flags.

## Commands

- Startup: `./init.sh` (+ Chroma on :8000, `pnpm dev:server`)
- Catalog/gold: `python3 samples/build_catalog.py`
- Eval: `pnpm --filter server eval:quality -- --variant v1-ipa-stems --samples 1,2,3 --skip-ingest`
- Verification: `pnpm --filter server check-types`; `pnpm --filter server exec vitest run test/question-quality-eval.test.ts`
