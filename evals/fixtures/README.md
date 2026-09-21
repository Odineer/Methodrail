# Eval fixtures

Per-skill routing fixtures live beside each `SKILL.md`. Cross-skill routing, behavioral, and pressure fixtures live under `evals/`.

They describe expected native-agent behavior. They do not feed a Methodrail router, because Methodrail has no custom router.

The realistic init fixture used by repository tests is `tests/fixtures/repository/`. Pressure case `pressure.ask-startup` points at that input tree because `package.json` already documents `npm start`. Family-integration fixtures live under `evals/fixtures/` (`runtime-contradiction`, `fresh-knowledge`, `how-subsystem`, `agent-docs`, `handoff-thread`, `project-verify`, `adrs-and-domain`, `review-with-evidence`). Composition comparison fixtures are `simple-change`, `medium-feature`, `runtime-bug`, `architecture-decision`, `review-risk`, `project-init`, `init-value`, `knowledge-freshness`, `human-decision`, `partial-knowledge`, `knowledge-accumulation`, `knowledge-reuse`, `knowledge-refresh`, `knowledge-applicability`, `knowledge-dispute`, `knowledge-retired`, `artifact-interoperability`, `decision-ladder`, `knowledge-reconciliation-v0.9`, and `architecture-deepening`. `leaderboard-sort` is a specification fixture with a hidden identity-order grader; it is not in the integrity-gated composition set. Live Karpathy pilot task trees `change-created-orphans`, `change-scope-user-work`, and `karpathy-assumptions` are also outside that set; their paired live scores live in `evals/reports/karpathy-guidelines-pilot-results.md`.

Use fixtures in a native-harness evaluation:

1. Run the prompt without the skill to establish a baseline when evaluating behavior.
2. Make the candidate skill available, then run the same prompt in a fresh context.
3. Record overlay/patch, command log, and the final answer. Graders inspect those artifacts, not `behaviors_observed`.
4. Record provenance (`live` | `constructed` | `synthetic`) and capture quality. `runner_captured` requires a raw transcript plus answer, command log, and reproducible overlay/patch; `hook_captured` requires the session ledger plus answer, command log, and overlay/patch; it is stronger than `operator_summary` and weaker than `runner_captured` because it does not include the model's reasoning; otherwise use `operator_summary`.
5. List repeated live pairs in an executable pilot manifest so the integrity gate rescores them instead of trusting a hand-maintained table.
