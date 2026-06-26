# Progress Log

## Current Verified State

- Repository root: `/Users/iyansr/IyanSR/Project/Skripsi/questgen`
- Standard startup path: `./init.sh`
- Standard verification path: `pnpm --filter web check-types`
- Current highest-priority unfinished feature: PPT/PPTX upload support (code complete; migration + E2E smoke pending)
- Current blocker: `0003_rapid_the_fallen.sql` not applied — run `pnpm db:migrate`

## Session Log

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

