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
- `OPENROUTER_API_KEY`, `MISTRAL_API_KEY`, `TAVILY_API_KEY` are placeholders.
  Auth, dashboard, history, and question-set CRUD work without them. AI question
  generation, document OCR, and web search require real keys plus a running
  ChromaDB; they will fail with placeholders.
- After a schema change run `pnpm db:push` (idempotent) to sync Postgres.
- `pnpm check` (Biome) runs `--write` and will reformat files. The repo currently
  has pre-existing Biome lint/format diagnostics, so a clean run is not the
  baseline — review the diff before committing.
- `pnpm --filter web check-types` runs a full `vite build` then `tsc`, so it is
  the heaviest verification step.
