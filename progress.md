# Progress Log

## Current Verified State

- Repository root: `/Users/iyansr/IyanSR/Project/Skripsi/questgen`
- Standard startup path: `./init.sh`
- Standard verification path: `pnpm --filter web check-types`
- Server blackbox tests: `pnpm test:server` (requires PostgreSQL + `questgen_test` DB)
- Latest feature: forced compile for document + web research (`sourceMaterial` no longer empty after tool-only steps)
- Current highest-priority unfinished feature: manual Langfuse smoke of doc/web session (expect `*-search` + `*-compile` spans, non-empty prose in QG)
- Dashboard stats: `GET /api/dashboard/stats` wired to dashboard stat cards (completed/ready scope)

## Session Log

### Session 029

- Date: 2026-07-18
- Goal: Fix empty document/web research summary when `stepCountIs(3)` ends on `finishReason: tool-calls`.
- Root cause: single `generateText` tool loop returned empty `text`; `sourceMaterial` used that text.
- Completed:
  - Shared `resolveSourceMaterial` (prefer compile ≥80 chars, else stitch excerpts).
  - Document: Phase A `document-research-search` (tools, stepCountIs 3) + Phase B `document-research-compile` (no tools).
  - Web: Phase A `web-research-search` (stash section markdown) + Phase B `web-research-compile` (image URL rules).
  - Unit tests in `test/research-compile.test.ts`.
- Verification run: `pnpm --filter server check-types` → pass; `pnpm --filter server test` → 15 files / 81 tests pass (Postgres via docker compose).
- Evidence captured: tsc clean; vitest exit 0.
- Commits: none yet.
- Files: `resolve-source-material.ts`, `document-search.ts`, `web-search.ts`, `research-compile.test.ts`, `progress.md`.
- Known risk: compile adds one LLM round-trip per research; stitch fallback is lower quality than compile.
- Next best step: run one doc + one web generation; confirm Langfuse `*-compile` output and non-empty `<source_material>`.

### Session 028

- Date: 2026-07-17
- Goal: Add "Sertakan Gambar Pada Soal" toggle; when off, never attach images or keep image lead-ins; OCR still extracts.
- Completed:
  - Web: `includeImages` in form schema (default true), `IncludeImagesField` switch, wired into create session FormData.
  - Server: parse `includeImages` from multipart; persist in `question_sets.config` + workflow params for file/document/web.
  - Generation: empty image catalog when false; force `imageUrl: null`; scrub Indonesian image lead-ins via `scrub-image-lead-ins.ts`.
  - OCR/Mistral pipeline unchanged.
- Verification run: `pnpm --filter server check-types` → pass; `pnpm --filter web check-types` → pass (vite build + tsc). Vitest skipped per user request.
- Evidence captured: tsc clean; vite build exit 0.
- Commits: none yet.
- Files or artifacts updated: new-session schema/page/field, create service, sessions schema/service, generation.service, scrub-image-lead-ins.ts, scrub-image-lead-ins.test.ts, progress.md.
- Known risk or unresolved issue: scrub phrase list is finite; end-to-end generation with toggle off not smoke-tested.
- Next best step: create session with toggle off; confirm no `imageUrl` and no "Perhatikan gambar…" in results.

### Session 027

- Date: 2026-07-16
- Goal: Fix markdown tables not rendering in question cards or PDF/DOCX export.
- Completed:
  - Added `remark-gfm` to web + server.
  - `QuestionMarkdown` now parses GFM tables with bordered table styles.
  - Export `markdownToBlocks` emits `table` ContentBlocks; PDF `drawTable` + DOCX native `Table`.
  - Unit tests in `test/markdown-tables.test.ts`.
- Verification run: `vitest run test/markdown-tables.test.ts test/latex-export.test.ts` → 9 passed; `pnpm --filter server check-types` → pass; `pnpm --filter web check-types` → pass.
- Evidence captured: vitest 9/9; tsc clean; vite build exit 0.
- Commits: none yet.
- Files or artifacts updated: `question-markdown.tsx`, `markdown-blocks.ts`, `exam-layout.ts`, `exam-template.ts`, `exam-docx-template.ts`, `markdown-tables.test.ts`, package.json (web/server).
- Known risk or unresolved issue: manual browser smoke of a real table question + export not run this session.
- Next best step: open session detail with a table question; confirm HTML table; export PDF + DOCX.

### Session 001

- Date: 2026-06-19
- Goal: Use topic as temporary session title, then generate a short AI title from the produced questions once generation completes.
- Completed:
  - Session creation now sets `title = topic` for all three paths (file/web/document) in `sessions.service.ts`.
  - Added lightweight `MODELS.TITLE` (env override `QUESTGEN_TITLE_MODEL`) in `shared/config/models.ts` and `packages/env/env.d.ts`.
  - New `generation/title.service.ts`: samples generated questions + level context, calls lightweight model for a short Indonesian title, persists to `questionSets.title`.
  - Wired a best-effort `generate-title` step into `generation.workflow.ts` (runs after `generate-questions`, before `mark-completed`; errors swallowed so the temporary title survives).
- Verification run: `tsc --noEmit` (apps/server) → no errors; biome check on changed files → clean.
- Evidence captured: typecheck output "TypeScript: No errors found".
- Commits: none yet.
- Files or artifacts updated: sessions.service.ts, models.ts, env.d.ts, title.service.ts (new), document-processor.ts, generation.workflow.ts.
- Known risk or unresolved issue: title generation not exercised end-to-end against a live workflow run.
- Next best step: run an end-to-end session and confirm the title updates from topic to the generated title in the dashboard/detail views.

### Session 002

- Date: 2026-06-23
- Goal: Build a landing page for the web app following Brillance SaaS reference design.
- Completed:
  - Full landing page in `apps/web/src/routes/index.tsx` replacing the placeholder `<h1>Home</h1>`.
  - Sections: Hero, Feature Highlights (3 rows with dividers), Social Proof (marquee), Bento Grid (4 tiles), Platform Features (interactive tabs), Testimonial (carousel), Pricing (3-tier with annual/monthly toggle), FAQ (CSS accordion), CTA banner, Footer.
  - Design follows Brillance reference: warm off-white background, STIX Two Text serif headings, bordered container (`max-w-4xl border-x`), diagonal stripe on stripe sections, `border-b` section separators.
  - Uses project CSS variables (foreground, background, accent, border, muted), Geist/STIX fonts, 0rem radius, Phosphor icons.
  - Motion `whileInView` fade-in on all sections; CSS keyframe marquee; CSS grid-rows accordion animation.
  - Pricing "Profesional" tier uses dark card (`bg-foreground text-background`) matching Brillance style.
  - Biome lint: zero errors.
- Verification run: visual check in browser (light + dark mode), zero lint errors.
- Evidence captured: pages render correctly at localhost:3002 in both modes.
- Commits: none yet.
- Files or artifacts updated: `apps/web/src/routes/index.tsx`.
- Known risk or unresolved issue: picsum.photos placeholder images give random photos (hero shows a dog). Replace with real product screenshots when available.
- Next best step: Replace picsum placeholders with real QuestGen screenshots, then wire actual navigation links in the footer/header.

### Session 003

- Date: 2026-06-24
- Goal: Add markdown toolbar editor with larger text to the edit-question dialog.
- Completed:
  - Added `@uiw/react-md-editor` (nohighlight import) to `apps/web`.
  - New `MarkdownEditorField` + lazy-loaded `markdown-editor-inner` with edit-only toolbar (bold, italic, lists, quote, code, link).
  - Scoped `markdown-editor.css` overrides: 0rem radius, `text-lg` / STIX serif, theme via `data-color-mode`.
  - Replaced plain `Textarea` for `questionText`, `correctAnswer`, and `suggestedAnswer` in `edit-question-dialog.tsx`.
- Verification run: `pnpm --filter web check-types` → build + tsc pass; editor code-split to `markdown-editor-inner` chunk (~97 KB gzip).
- Evidence captured: vite build exit 0; separate lazy chunk `markdown-editor-inner-DEq7jgor.js`.
- Commits: none yet.
- Files or artifacts updated: `apps/web/package.json`, `markdown-editor-field.tsx` (new), `markdown-editor-inner.tsx` (new), `markdown-editor.css` (new), `edit-question-dialog.tsx`, `progress.md`.
- Known risk or unresolved issue: manual browser smoke (toolbar insert, math on card after save, dark mode) not run in this session.
- Next best step: open session detail → Edit soal in browser and confirm toolbar + larger text UX.

### Session 004

- Date: 2026-06-24
- Goal: Replace markdown-syntax editor with WYSIWYG for non-technical teachers; keep markdown storage.
- Completed:
  - Swapped `@uiw/react-md-editor` for `@mdxeditor/editor` (MIT).
  - New `RichTextEditorField` + lazy `rich-text-editor-inner` (MDXEditor WYSIWYG, still emits markdown).
  - Toolbar: undo/redo, bold/italic/underline, lists, link, `fx` math insert popover.
  - Removed markdown helper text from edit dialog.
  - QuestGen-themed `rich-text-editor.css`; `text-lg` STIX serif in editor.
  - Deleted old `markdown-editor-*` files.
- Verification run: `pnpm --filter web check-types` → pass; lazy chunk `rich-text-editor-inner` ~163 KB gzip.
- Evidence captured: vite build exit 0.
- Commits: none yet.
- Files or artifacts updated: `package.json`, `rich-text-editor-field.tsx`, `rich-text-editor-inner.tsx`, `rich-text-editor.css`, `insert-math-button.tsx`, `edit-question-dialog.tsx`, `progress.md`.
- Known risk or unresolved issue: math shows as `$...$` text in editor (card renders KaTeX); manual browser smoke not run.
- Next best step: smoke test bold/lists/math button + staged re-edit in browser.

### Session 005

- Date: 2026-06-24
- Goal: Export questions to PDF (Indonesia lembar soal siswa) on Cloudflare Worker with preview-before-download.
- Completed:
  - Server export module: `POST /api/sessions/:id/export/pdf` with Zod-validated metadata (sekolah, mata pelajaran, kelas, kurikulum, tahun pelajaran, waktu, tanggal, petunjuk).
  - PDF built on Worker via `pdf-lib` + `remark`/`katex` (A4 Times Roman, header/petunjuk/soal bernomor, opsi A–D, nomor halaman; tanpa kunci jawaban).
  - Question images embedded from R2 when available.
  - Web: `ExportPdfButton` on session header (completed sessions only), `ExportPdfDialog` with form → Pratinjau (iframe blob) → Unduh.
  - Warns when unsaved staged edits exist.
- Verification run: `pnpm --filter server check-types` → pass; `pnpm --filter web check-types` → vite build + tsc pass.
- Evidence captured: both typecheck commands exit 0.
- Commits: none yet.
- Files or artifacts updated: `apps/server/src/modules/export/*`, `apps/server/src/index.ts`, `apps/server/package.json`, `export-pdf-button.tsx`, `export-pdf-schema.ts`, `export-pdf.ts`, `session-header.tsx`, `session-detail-page.tsx`, `progress.md`.
- Known risk or unresolved issue: manual browser smoke (preview iframe + download) not run; complex LaTeX in PDF renders as ASCII plain-text math (not full KaTeX typesetting).
- Next best step: open completed session → Ekspor PDF → pratinjau + unduh in browser against `wrangler dev`.

### Session 005b

- Date: 2026-06-24
- Goal: PDF export UX + layout feedback.
- Completed:
  - Preview moved to separate `ExportPdfPreviewDialog`.
  - **Unduh PDF** works directly from form (no preview required); only disabled while generating.
  - Simplified lembar soal layout: ULANGAN HARIAN, subtitle (mapel · kelas · semester), dotted Nama/Kelas/Tanggal fields, soal inline, opsi a–d lowercase, footer `A4 | n dari total | Kop Sekolah`.
  - Export form trimmed to: nama sekolah, mata pelajaran, kelas, semester.
- Verification run: `pnpm --filter server check-types` + `pnpm --filter web check-types` → pass.

### Session 006

- Date: 2026-06-25
- Goal: Accept PPT and PPTX uploads alongside PDF and DOCX.
- Completed:
  - Added shared `@questgen/db/document-types` (`DOCUMENT_FILE_TYPES`, MIME map, `mimeToDocumentFileType`).
  - Extended `file_type` enum in schema; drizzle migration `0003_rapid_the_fallen.sql` (`ppt`, `pptx`).
  - Server: upload validation in `sessions.service.ts`, preview MIME in `documents.routes.ts`, workflow `fileType` in `document-processor.ts`.
  - Web: `source-field.tsx` accept list + copy; `@questgen/db` dependency for shared MIME constants.
  - OCR path unchanged (`ocr.ts` already format-agnostic via Mistral).
- Verification run: `pnpm --filter server check-types` + `pnpm --filter web check-types` → pass.
- Evidence captured: both typecheck commands exit 0; migration generated via `pnpm db:generate` (no manual migration).
- Commits: none yet.
- Files or artifacts updated: `packages/db/src/document-types.ts` (new), `packages/db/src/schema/documents.ts`, `packages/db/src/migrations/0003_rapid_the_fallen.sql` (new), `packages/db/src/migrations/meta/0003_snapshot.json` (new), `packages/db/package.json`, `sessions.service.ts`, `documents.routes.ts`, `document-processor.ts`, `source-field.tsx`, `apps/web/package.json`, `pnpm-lock.yaml`, `progress.md`.
- Known risk or unresolved issue: migration not applied; no live PPT/PPTX upload through Mistral OCR tested; landing/README copy still PDF/DOCX-only.
- Next best step: `pnpm db:migrate`, then upload a `.pptx` session and confirm OCR → generation completes.

### Session 007

- Date: 2026-06-25
- Goal: Production OCR via R2 presigned URL — stop re-uploading source docs to Mistral Files API.
- Completed:
  - `r2-presigned-url.ts`: `createR2PresignedGetUrl` via `aws4fetch` (5 min GET expiry).
  - `ocr-mode.ts`: `isLocalOcrMode()` (localhost `SERVER_URL`), `canUseR2PresignedOcr()`.
  - `ocr.ts`: split `bytes` (dev — Mistral Files upload) vs `url` (prod — direct `document_url`).
  - `document-processor.ts`: prod path uses `head` + presigned URL (no `arrayBuffer`); dev unchanged.
  - `packages/env/env.d.ts`: `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- Verification run: `pnpm --filter server check-types` → pass.
- Evidence captured: tsc exit 0.
- Commits: none yet.
- Production setup (manual):
  - R2 dashboard → Manage R2 API Tokens → Object Read on `questgen` bucket.
  - `wrangler secret put R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
  - Set `R2_ACCOUNT_ID` + optional `R2_BUCKET_NAME` (default `questgen`) as Worker vars.
  - Missing creds or localhost `SERVER_URL` → auto-fallback to Mistral Files upload (dev behavior).
- Known risk or unresolved issue: live prod OCR with presigned URL not tested; local upload smoke not run this session.
- Next best step: set prod R2 presign secrets, deploy, upload PDF — confirm workflow completes without Mistral Files upload.

### Session 008

- Date: 2026-06-26
- Goal: DOCX export matching PDF lembar-soal layout on Cloudflare Worker; FE download-only (no preview).
- Completed:
  - Shared export utilities: `export/shared/markdown-blocks.ts`, `image-loader.ts`, `exam-helpers.ts`, `latex-unicode.ts`.
  - Server DOCX module via `docx` v9 (`Packer.toBlob`): `POST /api/sessions/:id/export/docx`, same metadata schema as PDF.
  - Layout mirrors PDF: header, dotted Nama/Kelas/Tanggal, numbered soal, lowercase options, R2 images, footer `A4 | n dari total | Kop Sekolah`.
  - Web: shared `ExportExamDialog` (`pdf` | `docx` variant), `ExportDocxButton` download-only, `export-docx.ts` service.
- Verification run: `pnpm --filter server check-types` → pass; `pnpm --filter web check-types` → pass; `Packer.toBlob` smoke → 8490 bytes.
- Evidence captured: both typecheck commands exit 0.
- Commits: none yet.
- Known risk or unresolved issue: manual browser download smoke not run; DOCX uses Times New Roman vs PDF Noto Serif; Word auto-pagination may differ slightly from PDF cursor layout.
- Next best step: open completed session → Ekspor DOCX → unduh and open in Word against `wrangler dev`.

### Session 009

- Date: 2026-06-30
- Goal: Prepare beta release — create `dev` branch, restrict `main` to closed registration and request-access landing.
- Completed:
  - Created and pushed `dev` branch from current `main` (full features preserved for ongoing development).
  - Feature branch `cursor/beta-release-prep-7846` with beta restrictions for PR review:
    - `POST /api/auth/register` returns 403 during beta.
    - `/register` route redirects to `/`.
    - Login page links to request-access form instead of registration.
    - Landing page hides testimonial and pricing sections.
    - Hero and CTA buttons changed to "Minta Akses" linking to `REQUEST_ACCESS_FORM_URL` placeholder (`https://forms.gle/placeholder`).
- Verification run: `pnpm --filter web check-types` + `pnpm --filter server check-types` → pass.
- Evidence captured: both typecheck commands exit 0.
- Commits: pending PR merge.
- Known risk or unresolved issue: replace `REQUEST_ACCESS_FORM_URL` in `apps/web/src/modules/landing/constants.ts` when the real Google Form link is ready.
- Next best step: review and merge PR; update Google Form URL before deploy.

### Session 010

- Date: 2026-06-30
- Goal: Sync `dev` with `main` while keeping beta restrictions only on `main`.
- Completed:
  - Merged `origin/main` into `dev` (fast-forward to `f41568c`).
  - Restored full-feature behavior on `dev`: registration API/page, login register link, landing pricing + testimonials, original CTAs.
  - Kept shared docs from `main`: `AGENTS.md` branch strategy and `progress.md` session 009.
- Verification run: `pnpm --filter web check-types` + `pnpm --filter server check-types` → pass.
- Evidence captured: vite build includes `register` chunk again; both typecheck commands exit 0.
- Next best step: merge PR into `dev`; continue feature work on `dev` branches.

### Session 011

- Date: 2026-06-30
- Goal: Replace branch-based beta/dev split with env feature flags.
- Completed:
  - Added `VITE_BETA_MODE`, `VITE_REQUEST_ACCESS_FORM_URL` (web) and `BETA_MODE` (server).
  - New helpers: `apps/web/src/lib/feature-flags.ts`, `apps/server/src/shared/lib/beta-mode.ts`.
  - Gated registration API, `/register` route, login link, landing sections, and CTAs behind flags.
  - Updated `AGENTS.md` and `README.md` for env-based beta workflow.
- Verification run: `pnpm --filter web check-types` + `pnpm --filter server check-types` → pass.
- Evidence captured: both typecheck commands exit 0.
- Next best step: merge PR; set beta env vars on `main` deploy.

### Session 012

- Date: 2026-06-30
- Goal: Resolve `dev` → `main` merge conflicts (PR #6) after feature-flag refactor.
- Completed:
  - Merged `origin/main` into `dev`; kept feature-flag implementation over hardcoded beta code from `main`.
  - Removed duplicate `REQUEST_ACCESS_FORM_URL` from landing constants (now env-driven).
- Verification run: `pnpm --filter web check-types` + `pnpm --filter server check-types` → pass.
- Evidence captured: both typecheck commands exit 0.
- Next best step: push resolved `dev`, merge PR #6; set `VITE_BETA_MODE=true` and `BETA_MODE=true` on main deploy.

### Session 013

- Date: 2026-07-01
- Goal: Fix production crash opening edit-question dialog (`Can't find variable: Prism`).
- Completed:
  - Added `prismjs-global-fix` Vite plugin in `apps/web/vite.config.ts` to inject `import Prism from 'prismjs'` into Prism language component modules.
  - Root cause: `@mdxeditor/editor` → `@lexical/code` → `prismjs/components/*` reference bare global `Prism`, which Vite 8/Rolldown production bundles do not provide (Safari error format).
- Verification run: `pnpm --filter web check-types` → pass; production bundle now uses imported Prism (`$.default.languages.clike`) instead of bare global.
- Evidence captured: vite build exit 0; bundle grep shows no bare `Prism.languages` global access.
- Known risk or unresolved issue: manual browser smoke on production preview not run in this session.
- Next best step: deploy and confirm edit-question dialog opens in production/Safari.

### Session 014

- Date: 2026-07-02
- Goal: Hide landing pricing section (commented for later reuse); add dashboard header dark-mode toggle; default theme light.
- Completed:
  - Commented out `PricingSection` import and render in `landing-page.tsx` (hidden in all modes, not only beta).
  - Added `ModeToggle` to `dashboard-layout.tsx` header (same control as landing).
  - Changed `ThemeProvider` `defaultTheme` from `dark` to `light` in `__root.tsx`.
- Verification run: `pnpm --filter web check-types` → pass.
- Evidence captured: vite build exit 0; tsc exit 0.
- Commits: pending.
- Next best step: uncomment pricing when ready to ship pricing tiers.

### Session 015

- Date: 2026-07-02
- Goal: Scaffold backend blackbox API tests (Tier 1) with mocked generation strategy documented.
- Completed:
  - Extracted Hono app to `apps/server/src/app.ts`; Worker entry remains `index.ts`.
  - Added Vitest + `@cloudflare/vitest-pool-workers` with `wrangler.test.jsonc` (`BETA_MODE=false`).
  - HTTP-only test helpers (`test/helpers/http.ts`, `auth.ts`) using `exports.default.fetch`.
  - Tier 1 suites: health, auth (register/login/me), validation (401/404/400).
  - Root script `pnpm test:server`; DB reset via Node `global-setup.ts` against `questgen_test`.
  - Pinned `vite@^7` in server devDeps (workaround for `pg` + vitest-pool-workers on Vite 8).
- Verification run: `pnpm --filter server test` → 18 passed; `pnpm --filter server check-types` → pass.
- Evidence captured: vitest exit 0, 3 files / 18 tests green.
- Known risk or unresolved issue: `pg` in Workers test runtime needs Vite 7 pin; Tier 2+ (fixtures, export, R2, mock workflow) not yet implemented; no CI job yet.
- Next best step: add Tier 2 fixture seeding + export tests; wire `test:server` into CI with Postgres service.

### Session 015b

- Date: 2026-07-02
- Goal: Complete blackbox backend tests Tiers 2–4 in the same PR as Tier 1.
- Completed:
  - `MockGenerationWorkflow` no-op for session create (no LLM/workflow execution).
  - Fixture helpers: completed sessions, documents, R2 image puts.
  - Tier 2: `sessions.test.ts`, `questions.test.ts`, `export.test.ts` (PDF + DOCX).
  - Tier 3: `documents.test.ts`, `files.test.ts` (Miniflare R2).
  - Tier 4: `sessions-create.test.ts` (form validation + mock workflow 201), `stream.test.ts`.
  - Per-test DB reset via `test/setup.ts`; sequential test files (`fileParallelism: false`).
  - `wrangler.test.jsonc` TTF rules for PDF font embedding in Workers tests.
- Verification run: `pnpm --filter server test` → 54 passed; `check-types` → pass.
- Evidence captured: 10 test files, vitest exit 0.
- Known risk or unresolved issue: no CI job yet; suite ~2 min sequential; Tier 5 live LLM smoke not implemented.
- Next best step: GitHub Actions job with Postgres service + `pnpm test:server`.

### Session 016

- Date: 2026-07-02
- Goal: Fix authentication timing leaks (login + registration).
- Completed:
  - Login always runs bcrypt via `DUMMY_PASSWORD_HASH` when email is unknown.
  - Registration always hashes password first; uses `onConflictDoNothing` on email.
  - Duplicate registration returns generic `400 Registration failed` (no email enumeration via 409).
  - Updated blackbox auth test for duplicate-register response shape.
- Verification run: `pnpm --filter server check-types` → pass; `pnpm --filter server test` → pass.
- Evidence captured: tsc exit 0.
- Commits: pending.
- Next best step: merge PR; optional live timing smoke against `/api/auth/login`.

### Session 018

- Date: 2026-07-03
- Goal: Delete individual question from session detail (button → confirm → API).
- Completed:
  - `DELETE /api/sessions/:id/questions/:questionId` in `questions.service.ts` + `sessions.routes.ts` — deletes row, compacts `order`; **no R2 image cleanup** (per product decision).
  - Server tests in `questions.test.ts`: happy path + order compaction, 404 unknown question, 404 other user.
  - Web: `delete-question.ts` hook, Hapus button + confirm dialog on `QuestionCard`, wired through `QuestionList` / `SessionDetailPage`.
  - `useSessionStream` prefers refetched `initial.questions` when not streaming (fixes stale list after delete).
- Verification run: `pnpm --filter web check-types` → pass (vite build + tsc exit 0). `pnpm test:server` not run — PostgreSQL not available (`ECONNREFUSED 127.0.0.1:5432`).
- Evidence captured: web build exit 0.
- Known risk or unresolved issue: server delete tests unverified in this session; manual browser smoke pending.
- Next best step: start Postgres, run `pnpm test:server test/questions.test.ts`, smoke delete on a completed session in browser.

### Session 019

- Date: 2026-07-04
- Goal: Tell users they can safely close the tab while questions are being generated.
- Completed:
  - New `GenerationBackgroundNotice` on session detail when status is `pending` or `generating`.
  - Shared `GENERATION_BACKGROUND_MESSAGE` reused in `EmptyQuestions` (waiting for first question) and `QuestionList` streaming footer.
- Verification run: `pnpm --filter web check-types` → pass (vite build + tsc exit 0).
- Evidence captured: vite build exit 0.
- Commits: pending.
- Next best step: manual browser smoke on an in-progress session (notice visible, disappears when completed).

- Date: 2026-07-02
- Goal: Integrate dashboard stat cards (total questions, saved sets, uploaded documents).
- Completed:
  - Added `GET /api/dashboard/stats` with parallel count queries scoped to completed sets / ready documents.
  - New server module: `apps/server/src/modules/dashboard/` (`dashboard.service.ts`, `dashboard.routes.ts`).
  - Web hook `useDashboardStats()` in `apps/web/src/services/dashboard/stats.ts`.
  - Wired `dashboard-page.tsx` stat cards with skeleton loading.
  - Cache invalidation on session create, stream complete, question update.
  - Dashboard route registered in `app.ts` (post app extraction refactor).
- Verification run: `pnpm --filter server exec tsc --noEmit` + `pnpm --filter web check-types` + biome on changed files → pass.
- Evidence captured: both typecheck commands exit 0; biome clean after format fix.
- Known risk or unresolved issue: live API/browser smoke not run (Postgres/dev server unavailable in agent env).
- Next best step: start dev stack, confirm stat cards show real counts for a user with completed sessions.

### Session 020

- Date: 2026-07-15
- Goal: Add SMK jenjang support with free-text kelas input.
- Completed:
  - Added `SMK` to `GRADE_OPTIONS` in `apps/web/src/modules/new-session/schema.ts`.
  - Added `isFreeTextClassGrade()` helper; SMK class validation min 2 / max 50 chars.
  - `GradeClassField` shows text input for SMK (`cth. X TKJ 1`); SD/SMP/SMA keep chip picker.
  - `subject-guidance.ts`: SMK uses same quantitative target as SMA (75%).
- Verification run: `pnpm --filter web check-types` → pass (vite build + tsc exit 0).
- Evidence captured: web build exit 0; no linter errors on changed files.
- Known risk or unresolved issue: manual browser smoke not run; free-text kelas may vary in format.
- Next best step: smoke `/new` — select SMK, enter kelas, confirm session header shows `SMK · Kelas …`.

### Session 022

- Date: 2026-07-15
- Goal: Cap document upload pages for Chroma Cloud write limits.
- Completed:
  - `MAX_PDF_PAGES` lowered 1000 → 50 in `packages/db/src/upload-limits.ts` (product/Chroma cap; client + server PDF checks reuse constant).
  - OCR `OcrResult.pageCount` from `response.pages.length`.
  - `runDocumentPipeline` throws `NonRetryableError` when pageCount > 50 (covers DOCX/PPT after OCR; workflow marks doc/session failed).
- Verification run: `pnpm --filter server exec tsc --noEmit` → exit 0.
- Evidence captured: typecheck clean; UI copy uses `{MAX_PDF_PAGES}` so shows 50.
- Known risk or unresolved issue: no live browser upload of 51-page PDF in this session.
- Next best step: smoke `/new` — hint shows “PDF maks. 50 halaman”; reject oversized PDF; DOCX/PPT over 50 pages fail post-OCR.

### Session 023

- Date: 2026-07-15
- Goal: Delete question set from history/dashboard (Hapus → confirm → API).
- Completed:
  - `DELETE /api/sessions/:id` in `sessions.service.ts` + `sessions.routes.ts` — DB-only delete; questions cascade; **no R2 image or document cleanup** (confirmed product decision).
  - Server tests in `sessions.test.ts`: happy path, 404 unknown id, 404 other user.
  - Web: `delete-session.ts` hook; confirm dialog + Hapus wired in shared `sessions-columns.tsx` (history + dashboard).
  - Pagination rollback `useEffect` on empty page after delete in `history-page.tsx` and `dashboard-page.tsx`.
- Verification run: `./init.sh` → pass; `pnpm --filter web check-types` → pass (vite build + tsc exit 0). `pnpm test:server test/sessions.test.ts` not run — PostgreSQL not available (`ECONNREFUSED 127.0.0.1:5432`).
- Evidence captured: web build exit 0; init exit 0.
- Known risk or unresolved issue: server delete-session tests unverified in this session; manual browser smoke pending.
- Next best step: start Postgres, run `pnpm test:server test/sessions.test.ts`, smoke Hapus on history and dashboard tables.

### Session 024

- Date: 2026-07-15
- Goal: Allow teachers to add a question to an existing question set from session detail.
- Completed:
  - Server: `createQuestionSchema`, `createQuestion()` (append `max(order)+1`, optional image), `POST /api/sessions/:id/questions`.
  - Tests: create OK + order append, 400 bad options, 404 other user (`questions.test.ts` — 10 passed).
  - Web: `create-question.ts` hook; `EditQuestionDialog` create mode with type picker; **Tambah soal** in list header + empty state; wired in `session-detail-page.tsx` (immediate persist; enabled for `completed`/`failed` only).
- Verification run: `./init.sh` → pass; `pnpm --filter server exec vitest run test/questions.test.ts` → 10 passed; `pnpm --filter web check-types` → pass.
- Evidence captured: vitest 10/10; vite build + tsc exit 0.
- Known risk or unresolved issue: manual browser smoke (add MC/essay + optional image) not run.
- Next best step: open completed session → Tambah soal → confirm new card appears at end after save.

### Session 025

- Date: 2026-07-15
- Goal: Stop `pnpm test:server` from loading `apps/server/.env` (prod DATABASE_URL overrode test vars → TRUNCATE wiped Supabase).
- Completed:
  - Vitest uses wrangler `environment: 'test'` → loads committed `.dev.vars.test` (log: `Using secrets defined in .dev.vars.test`, not `.env`).
  - `miniflare.bindings.DATABASE_URL` forced to local `questgen_test`.
  - `assertSafeTestDatabaseUrl` aborts before any `TRUNCATE` if URL ≠ exact local test URL.
  - `package.json` test scripts: `env -u DATABASE_URL vitest …`.
- Verification run: `pnpm --filter server test` → 71 passed; output shows `.dev.vars.test` only.
- Evidence captured: test log lines `Using secrets defined in .dev.vars.test`; 12 files / 71 tests pass.
- Known risk or unresolved issue: none for this fix; prod data already lost earlier cannot be restored by this change.
- Next best step: commit + push this safety fix; restore Supabase from backup/PITR if available.

### Session 026

- Date: 2026-07-15
- Goal: Fix PDF exam header dotted fields overflowing past page/column margins.
- Completed:
  - `drawDottedField` in `exam-layout.ts`: `dotEnd` now `x + fieldWidth` (total slot width) instead of `dotStart + width` (which double-counted label width).
- Verification run: `pnpm test:server` → 12 files / 71 tests passed (includes `export.test.ts` PDF smoke).
- Evidence captured: vitest exit 0; export PDF endpoint still returns `application/pdf`.
- Known risk or unresolved issue: manual visual PDF header check not run in browser.
- Next best step: export a session PDF and confirm Nama/Kelas/Hari-Tanggal dots stop at margins.

