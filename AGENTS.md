# AGENTS.md

This repository is designed for long-running coding-agent work. The goal is not
to maximize raw code output. The goal is to leave the repo in a state where the
next session can continue without guessing.

## Startup Workflow

Before writing code:

1. Confirm the working directory with `pwd`.
2. Read `progress.md` for the latest verified state and next step.
3. Review recent commits with `git log --oneline -5`.
4. Run `./init.sh`.
5. Run the required smoke or end-to-end verification before starting new work.

If baseline verification is already failing, fix that first. Do not stack new
feature work on top of a broken starting state.

## Working Rules

- Work on one feature at a time.
- Do not mark a feature complete just because code was added.
- Keep changes within the selected feature scope unless a blocker forces a
  narrow supporting fix.
- Do not silently change verification rules during implementation.
- Prefer durable repo artifacts over chat summaries.

## Required Artifacts

- `progress.md`: session log and current verified status
- `init.sh`: standard startup and verification path
- `session-handoff.md`: optional compact handoff for larger sessions

## Definition Of Done

A feature is done only when all of the following are true:

- the target behavior is implemented
- the required verification actually ran
- evidence is recorded in `progress.md`
- the repository remains restartable from the standard startup path

## End Of Session

Before ending a session:

1. Update `progress.md`.
2. Record any unresolved risk or blocker.
3. Commit with a descriptive message once the work is in a safe state.
4. Leave the repo clean enough for the next session to run `./init.sh`
 immediately.

## Branch Strategy (Beta)

During beta, `main` and `dev` serve different purposes. Do not treat them as
interchangeable.

| Branch | Purpose |
|--------|---------|
| `main` | Beta / public — closed registration, request-access landing |
| `dev` | Active development — full features (registration, pricing, testimonials) |
| `cursor/<name>-7846` | Short-lived feature branches off `dev` |

### Daily development

1. Branch from `dev`, not `main`.
2. Open PRs into `dev`, not `main`.
3. Keep `main` stable for beta users unless you are deliberately promoting work.

```bash
git checkout dev
git pull origin dev
git checkout -b cursor/my-feature-7846

# work, commit, push
git push -u origin cursor/my-feature-7846
# PR: cursor/my-feature-7846 → dev
```

### Promoting work to beta (`main`)

`main` contains beta-only behavior (disabled register API, hidden pricing/testimonials,
request-access CTAs). `dev` does not. The branches will diverge.

Choose one approach when shipping to beta:

**Cherry-pick (preferred for small releases)**

```bash
git checkout main
git pull origin main
git cherry-pick <commit-sha>
git push origin main
```

**Merge batch (when releasing multiple features)**

```bash
git checkout main
git merge dev
# resolve conflicts — keep beta restrictions on main
git push origin main
```

After any promotion to `main`, confirm beta behavior is still intact:

- `POST /api/auth/register` returns 403
- `/register` redirects to `/`
- landing hides pricing and testimonials
- CTAs use `REQUEST_ACCESS_FORM_URL` in `apps/web/src/modules/landing/constants.ts`

### Long-term option: feature flags

If merge conflicts between beta gating and new features become frequent, move beta
behavior behind env flags (e.g. `VITE_BETA_MODE`, `REGISTRATION_ENABLED`) so `dev`
and `main` can share the same code with different deploy config.

```
feature branch ──PR──► dev
                           ├── cherry-pick ──► main   (one feature to beta)
                           └── merge ─────────► main   (release batch)
```

## Cursor Cloud specific instructions

Monorepo (pnpm). Standard run/test/lint commands live in `README.md` and root
`package.json` scripts (`dev`, `dev:web`, `dev:server`, `check`, `check-types`,
`db:push`). Notes below are only the non-obvious cloud caveats.

### Services

| Service | Port | Start command | Required for |
|---------|------|---------------|--------------|
| PostgreSQL 16 | 5432 | `sudo pg_ctlcluster 16 main start` | everything (auth, sessions, CRUD) |
| Server (Hono on `wrangler dev`) | 3000 | `pnpm dev:server` | API |
| Web (Vite) | 3001 | `pnpm dev:web` | UI |
| ChromaDB | 8000 | `docker compose up -d chroma` (Docker not preinstalled) | only AI generation / RAG |

`pnpm dev` runs web + server together.

### Non-obvious caveats

- PostgreSQL is installed locally (not via the `docker-compose.yml`, since Docker
  is not preinstalled) and does NOT auto-start. Run
  `sudo pg_ctlcluster 16 main start` at the start of each session before the
  server. Credentials match `docker-compose.yml`: `postgres:postgres@localhost:5432/postgres`.
- Env files are git-ignored and already created: `apps/server/.env`,
  `apps/server/.dev.vars` (wrangler reads `.dev.vars`, drizzle reads `.env` — keep
  them in sync), and `apps/web/.env` (`VITE_SERVER_URL=http://localhost:3000`).
  If missing, recreate from the `README.md` env tables.
- IMPORTANT: `wrangler dev` loads server vars/secrets from `apps/server/.dev.vars`,
  NOT from the process environment. Cloud Agent secrets (`OPENROUTER_API_KEY`,
  `MISTRAL_API_KEY`, `TAVILY_API_KEY`) are injected as shell env vars, so they must
  be written into `.dev.vars` (and `.env`) for the server to see them, e.g.
  `OPENROUTER_API_KEY=${OPENROUTER_API_KEY}`. Restart `pnpm dev:server` after editing.
- Without those keys, auth/dashboard/history/CRUD still work. AI question generation
  needs the keys: the web-search path (new session → "Pencarian Web") uses only
  OpenRouter + Tavily and does NOT need ChromaDB; the document-upload path
  additionally needs Mistral OCR + a running ChromaDB. Generation runs through a
  Cloudflare Workflow (works under local `wrangler dev`) and takes ~1–2 minutes.
- After a schema change run `pnpm db:push` (idempotent) to sync Postgres.
- `pnpm check` (Biome) runs `--write` and will reformat files. The repo currently
  has pre-existing Biome lint/format diagnostics, so a clean run is not the
  baseline — review the diff before committing.
- `pnpm --filter web check-types` runs a full `vite build` then `tsc`, so it is
  the heaviest verification step.
