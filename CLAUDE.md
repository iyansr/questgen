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
