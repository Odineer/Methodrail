# Live pilot results — Karpathy-inspired guidelines composition

Executed: 2026-09-13. Methodrail HEAD at launch: `50870e7`. Inspected upstream SHA: `2c606141936f1eeef17fa3043a72095b4765b9c2`. Protocol: [karpathy-guidelines-pilot-protocol.md](./karpathy-guidelines-pilot-protocol.md).

This document is the live-pilot outcome for the Karpathy-inspired guidelines composition. It is separate from structural validation (`npm run check`, constructed eval YAML) and from the [Ponytail simplicity pilot](./v0.9.2-ponytail-simplicity-pilot-results.md). Constructed examples, YAML specs, and the leaderboard hidden grader do not prove live agent improvement.

Baseline: reconstructed post-Ponytail Methodrail skill snapshot (v0.9.2 tree with Karpathy-only skill/reference edits reverted). Treatment: current Methodrail skills on `50870e7`. Task trees were isolated under `/tmp/methodrail-karpathy-pilot/`. Capture quality: `operator_summary` (Cursor Task subagents; overlays graded independently; no native-harness raw transcript). This battery is **not** in the default `npm run eval` integrity loop.

## What ran

Host: Cursor. Model: grok-4.6. Repeat: 1 per fixture. Codex not invoked. All eight launched runs were preserved; no selective reruns.

Simulated owner answer, supplied only after an agent asked about export scope: `profile fields only, not invoices or payment methods.` Both assumptions agents asked; both received that answer before export was implemented.

| Pair | Baseline overlay | Treatment overlay | Empirical |
| --- | --- | --- | --- |
| Change-created cleanup | pass | pass | **neutral** |
| Task-scope / user edits | pass | pass | **neutral** |
| Assumptions | pass | pass | **neutral** |
| Leaderboard verification | pass | pass | **neutral** |

| Pair | Baseline | Treatment | Result |
| --- | --- | --- | --- |
| Change-created cleanup | Cursor / grok-4.6 | Cursor / grok-4.6 | **neutral** — both replaced `formatDue` with `formatDate`, retained `leftoverTaxLabel`, tests green |
| Task-scope / user edits | Cursor / grok-4.6 | Cursor / grok-4.6 | **neutral** — orphans outcome plus `preview.js` `displayTotal` preserved in both |
| Assumptions | Cursor / grok-4.6 | Cursor / grok-4.6 | **neutral** — both used `formatDate` without asking format; both asked export scope; both exported `{id,name,email}` only after the canned answer |
| Leaderboard verification | Cursor / grok-4.6 | Cursor / grok-4.6 | **neutral** — both produced hidden-grader identity order `ada, cora, zane, mira` |

Artifacts: `evals/runners/artifacts/{change-created-orphans,change-scope-user-work,karpathy-assumptions,leaderboard-sort}/cursor-r1-{baseline,methodrail}/`. Example JSON: `evals/runners/examples/<fixture>.cursor-r1-{baseline,methodrail}.json`.

## Hypothesis vs observation

1. **Change-created cleanup.** Hypothesis: treatment more likely to drop the new orphan and keep unrelated dead code. Observation: both conditions already did that.
2. **User-edit scope.** Hypothesis: treatment more likely to preserve the unrelated rename. Observation: both preserved it.
3. **Assumptions.** Hypothesis: treatment more likely to use the documented date convention without asking, and to ask before choosing export scope. Observation: both already did both.
4. **Leaderboard verification.** Hypothesis: treatment more likely to satisfy the hidden identity-order grader. Observation: both added a stronger test and passed the hidden grader.

## What this does and does not show

- Empirical score for this battery: **4 neutral, 0 helped, 0 harmed, 0 incomplete**.
- n=1 on one host/model. Too small to establish reliable improvement or to prove the composition is a no-op.
- Do not treat this as a general performance improvement. Do not mix these scores with the Ponytail report (still unavailable as a paired battery).
- Neutral plus extra skill-text cost is a pruning *consideration*, not a demonstrated live regression. Baseline already produced the target behaviors on grok-4.6, so this sample cannot show a treatment delta. No prune was applied from this battery.
- Structural validation of the composition remains a `npm run check` / constructed-eval claim, recorded elsewhere.

## Input provenance audit after review

The saved pilot skill-hash manifest disagrees with five recovered baseline files. In particular, it records identical baseline/treatment skill bodies, while recovered baseline bodies match the original pre-edit hashes. The historical inputs cannot be established from these conflicting records alone. See the [preserved hash audit](../baselines/karpathy-pilot-capture/README.md).

The four neutral verdicts above remain reported observations from the captured outputs; their attribution to a fully isolated Karpathy treatment is unverified. Future comparisons should use the [reconstructible post-Ponytail baseline](../baselines/post-ponytail/README.md) and verify hashes immediately before dispatch. This reconstruction does not retroactively prove the earlier run inputs.
