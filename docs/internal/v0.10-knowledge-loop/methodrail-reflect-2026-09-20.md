# Reflect — Methodrail 2026-09-20

Session: stale-install discovery, path-scoped upstream drift, and the start of the v0.10 measurement work.

This is a `reflect` pass against that work. No `.methodrail/knowledge/` file was written. Expected honest outcome: zero or one note; actual: zero.

## Accepted

None. No candidate earned promotion.

## Rejected

- Principle: the installed Cursor plugin must be a link to the checkout; run `npm run doctor` before recording live observations.
- Reason: structural / already-covered. `src/doctor.ts` already reports `linked` / `identical` / `stale` / `missing`. `.methodrail/PROJECT.md` lists `npm run doctor` as a canonical command before live observation. A typed note would duplicate a check.

- Principle: upstream drift is only review-relevant when `relevance: mapped`.
- Reason: already-covered. `docs/upstream-maintenance.md` already states: "Only `mapped` is review-relevant drift." Duplicating that sentence as a knowledge note fails the duplication check.

## Backlog

- Human checkpoint 1 is still open: confirm Cursor Customize shows Methodrail 0.9.2 and `/develop` after a window reload, then delete `~/.cursor/plugins/methodrail-0.9.1-stale-copy-20260920` or keep it as a known fallback.
- `METHODRAIL_LEDGER=1` in a dogfood shell made hook tests write without a harness. Tests now clear that variable; not a project knowledge claim.

## Throttle

Zero accepted candidates, so the one-mutation-per-approval cap was not hit.
