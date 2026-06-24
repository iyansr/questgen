# Progress Log

## Current Verified State

- Repository root:
- Standard startup path:
- Standard verification path:
- Current highest-priority unfinished feature:
- Current blocker:

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
