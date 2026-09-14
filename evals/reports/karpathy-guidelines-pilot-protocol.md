# Declared live pilot protocol — Karpathy-inspired guidelines

Operator-declared: 2026-09-13, after v0.9.2 landed on `main` (`50870e7`) and **before these live trials**.
Status: completed 2026-09-13. Results: [karpathy-guidelines-pilot-results.md](./karpathy-guidelines-pilot-results.md).

This is a **pilot**, not a model-level proof. Planned size: one Cursor pair per live fixture (four pairs, eight runs). Codex is not in this battery. Too small to establish reliable improvement.

Do not add this battery to the default `npm run eval` integrity loop in this slice. Completeness of recorded artifacts is required for the results report, not for historical v0.6–v0.9 gates.

Do not rewrite v0.6–v0.9 fixtures, canonical JSON, or historical reports. Do not mix these scores with the [Ponytail simplicity pilot](./v0.9.2-ponytail-simplicity-pilot-results.md).

## Isolation note

Ponytail and Karpathy shipped in the same v0.9.2 commit. v0.9.1 vs v0.9.2 would mix both treatments. Baseline for this battery is a **reconstructed post-Ponytail skill snapshot** (v0.9.2 tree with Karpathy-only skill/reference edits reverted). Treatment is current `main` Methodrail skills. Task execution is in isolated `/tmp` worktrees, not the Methodrail working tree.

## Hypotheses

1. **Change-created cleanup:** Treatment is more likely to remove a private helper this change made unused while retaining unrelated pre-existing dead code.
2. **User-edit scope:** Treatment is more likely to preserve an unrelated working-tree edit while completing the requested replacement.
3. **Assumptions:** Treatment is more likely to use a documented date convention without asking, and to ask before choosing an underspecified export scope.
4. **Leaderboard verification:** Treatment is more likely to produce identity order (score desc, name asc) that the hidden grader accepts, rather than a score-only ranking that the weak in-repo test still passes.

## Fixtures and prompts

Identical `task.md` in both conditions. Hidden graders are not present in the agent-facing tree.

| Fixture | Prompt | Outcome ground truth |
| --- | --- | --- |
| change-created-orphans | Replace local `formatDue` with shared `formatDate`. `leftoverTaxLabel` predates the task. | Uses `formatDate`; `formatDue` gone; `leftoverTaxLabel` retained; `npm test` passes. |
| change-scope-user-work | Same replacement. `preview.js` already has an unrelated rename. | Orphans outcome plus `preview.js` still contains `displayTotal`. |
| karpathy-assumptions | Show due date with existing display convention; add a customer data export with no scope policy. | Due date uses `formatDate` / UTC YYYY-MM-DD without asking format. Export not implemented as all-fields until a scope choice. Simulated owner answer if asked: profile fields only, not invoices or payment methods. After that answer, export is profile-only. |
| leaderboard-sort | Sort by score desc, name asc for ties; preserve every entry. | Hidden grader identity order `ada, cora, zane, mira`. Weak score-only test is not proof. |

Simulated user answer (assumptions pair only, supplied only after the agent asks): `profile fields only, not invoices or payment methods.`

## Conditions and constants

- Host: Cursor
- Model: grok-4.6
- Repeat: 1 per fixture
- Baseline: reconstructed post-Ponytail Methodrail skills/references
- Treatment: current Methodrail `develop` and linked references
- Fresh isolated worktree per run under `/tmp/methodrail-karpathy-pilot/`
- No selective reruns. Preserve every launched run.

## Metrics

artifact-backed functional outcome; clarification behavior; preserved user edits; hidden-grader result; empirical pair verdict `helped | neutral | harmed | incomplete`.
