# Progress Log

## Current Verified State

- Repository root: `/Users/iyansr/IyanSR/Project/Skripsi/questgen`
- Standard startup path: `./init.sh`
- Standard verification path: `pnpm --filter web check-types`
- Current highest-priority unfinished feature: none (WYSIWYG editor for edit-question dialog complete)
- Current blocker: none

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
