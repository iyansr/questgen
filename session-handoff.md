# Session Handoff

## Verified Now

- What is currently working: per-chunk heading path in `chunker.ts` (Session 031); doc-first subtopic expand + gap-fill (Session 030); forced research compile (Session 029).
- What verification actually ran: `pnpm --filter server check-types`; `vitest run test/chunker.test.ts` (3 passed).

## Changed This Session (031)

- Code: always H1/H2 `preSplitBySections`; inherit parent H1; `headingPath` on chunks + Chroma metadata; `test/chunker.test.ts`.
- Commits: none yet.

## Broken Or Unverified

- Old Chroma documents still have stale global breadcrumb until re-ingest (`PROCESS_DOCUMENT` / re-upload). No silent migrate.
- End-to-end doc generation after coverage + chunker fix not smoked this session.

## Next Best Step

- Highest-priority unfinished feature: **re-ingest affected docs**, then confirm Chroma prefixes vary by section.
- Why it is next: fix only applies to new upserts; expand/retrieve still read old vectors until re-process.
- What counts as passing: Chroma rows for male sections lack female H2 prefix; optional Langfuse expand shows varied `##` leaves.
- What must not change: document-search expand/gap-fill API; web search; QG prompts.

## Commands

- Startup: `./init.sh`
- Verification: `pnpm --filter server check-types`; `pnpm --filter server exec vitest run test/chunker.test.ts`
- Focused debug: re-process a `scopeId`, inspect Chroma `documents` + `metadatas.headingPath` across `chunkIndex`
