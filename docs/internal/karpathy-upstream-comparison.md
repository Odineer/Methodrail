# Karpathy-inspired guidelines: upstream comparison

Inspected repository: [multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)

Inspected revision: `2c606141936f1eeef17fa3043a72095b4765b9c2` on `main`. This SHA was upstream HEAD on 2026-09-13. Deliberately retained; not switched to a later commit.

This is a community-maintained interpretation of [Karpathy's observations](https://x.com/karpathy/status/2015883857489522876), not code or skills authored by Andrej Karpathy. Plugin metadata at the inspected revision names `forrestchang` as author. Use the repository identity and “Karpathy-inspired guidelines”; do not attribute authorship or endorsement to Andrej Karpathy.

Classification: **COMPOSE** the useful incremental behaviors into existing Methodrail owners. **SKIP** host installation surfaces. Do not ship a public `karpathy-guidelines` skill, command, personality, mode, or global router.

Caveman and Graphify remain outside this integration.

## License evidence

Inspected at `2c606141936f1eeef17fa3043a72095b4765b9c2`:

| Source | Evidence |
| --- | --- |
| `skills/karpathy-guidelines/SKILL.md` frontmatter | `license: MIT` |
| `.claude-plugin/plugin.json` | `"license": "MIT"`, `"author": { "name": "forrestchang" }` |
| `README.md` | heading “License” with the word `MIT` |
| Standalone `LICENSE` file | **not present** |
| Copyright holder / year | **not present** in the inspected tree |

Do not invent a copyright holder or year. Do not claim a LICENSE file was inspected. Methodrail composes original wording; it does not copy the upstream skill, `CLAUDE.md`, `CURSOR.md`, or examples verbatim.

## Baseline for this composition

Post-Ponytail Methodrail working tree on 2026-09-13, including uncommitted Ponytail review fixes. HEAD alone is not the baseline. SHA-256 of the files this composition edits (pre-edit):

| Path | sha256 |
| --- | --- |
| `references/simplicity.md` | `373edc7559cc713d5def2f9224c16486957994aa4c8fbea7b3e2c44168f2649c` |
| `references/decision-frontier.md` | `2ead38dbad58331d73cdfc31a56e732410b5ba1a81ca9eadfc431a1342eba08a` |
| `references/skill-composition.md` | `ca961d9d8a46820911edc1c58c74a6601bcb01931781f445cbf938441cacaeb6` |
| `references/capability-map.md` | `6b12c5bc9293b920e1b4f2102361a42db9f0a850140e728336db843a72ff2b99` |
| `references/upstream-skill-matrix.md` | `77c20bd77393eed802d60efe0f78d474bfa5c7ebe555ea915bd496b1a042a106` |
| `skills/develop/SKILL.md` | `3094d354fcf6a8484b874f4df4c9fd24983dcac8938b2b12de7178c9161bee06` |
| `skills/refactor/SKILL.md` | `c95efcd6f13b1fac60f3d7fb756f0dc7797b5b1571f6a977856e8e6b212addb4` |
| `skills/diagnosing-bugs/SKILL.md` | `31c2f5e87f5f15df3b19042874e7405c05b3fa3623a7a8c763dbf2046ae4f4b2` |
| `skills/code-review/SKILL.md` | `bdedc24c8e427e082e942dd40929a5a8f6750e49df39952b403e03807f6b0a56` |
| `src/eval/grade-outcome.ts` | `9670cc09d948692d11c4061aab79cb301553d952f4160dd1e7dc85ce500595c8` (frozen; not edited) |

Sources inspected at the pin:

- [Skill](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/skills/karpathy-guidelines/SKILL.md)
- [CLAUDE.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/CLAUDE.md)
- [EXAMPLES.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/EXAMPLES.md)
- [README](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/README.md)
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `.cursor/rules/karpathy-guidelines.mdc` at that revision

## Contribution matrix

| Upstream idea | Decision | Methodrail destination | Adaptation |
|---|---|---|---|
| State assumptions; surface alternative interpretations | COMPOSE | `references/decision-frontier.md`, `develop` | Material assumptions only; inspect evidence first; ask only for unresolved consequential user choices. |
| Stop whenever unclear | SKIP literal rule | Existing decision frontier | Continue independent work; a low-impact reversible uncertainty is not a mandatory stop. |
| No speculative features or configurability | ALREADY COVERED | `references/simplicity.md`, TDD | Preserve existing procedure; no duplicate paragraph. |
| No single-use abstraction | SKIP literal rule | Existing design/review judgment | Preserve justified contracts and test seams; count alone decides nothing. |
| Rewrite 200 lines into 50 | SKIP literal metric | Existing smallest-complete-change principle | Correctness, scope, and required behavior outrank line count. |
| No handling of impossible scenarios | DO NOT IMPORT | Existing safeguards | Do not assume an input or failure path is impossible without evidence. |
| Match existing style; avoid adjacent cleanup | REINFORCE only where needed | `develop`, `refactor`, review | Respect repo standards and tool-required output; do not generate formatting-only churn. |
| Remove things made unused by this change | COMPOSE | `references/simplicity.md`, write workflows | Prove they became unused; account for exports, side effects, registrations, and external contracts. |
| Leave unrelated dead code alone | COMPOSE with previous row | Same owners | Mention only when material; do not require a report of every incidental smell. |
| Every changed line traces to the request | ADAPT | Write workflow final check, Spec review | Check hunks and supporting work, not mandatory line-by-line prose. |
| Define success, loop until verified | ALREADY COVERED | `verify-change`, TDD, diagnosis | Preserve stronger fresh-evidence semantics and honest blocked/failed states. |
| Plan step paired with verification | COMPOSE narrowly | `develop` | Apply only when an implementation plan is warranted; reuse checks across steps. |
| Upstream examples | INSPIRATION only | New fixtures | Write original, discriminating tests; do not copy weak examples as proof. |
| Plugin/router/always-on installation (`CLAUDE.md`, `CURSOR.md`, Cursor rule) | SKIP | None | Native Methodrail entrypoints remain unchanged. |

## Incremental behaviors relative to post-Ponytail Methodrail

Ponytail already owns simplicity, scoped non-cleanup of unrelated work, comment judgment, and shared-owner repair. This composition adds three incremental behaviors:

1. **Change-created cleanup.** Post-Ponytail “stop / no extra cleanup” could leave orphans this change created. Remove private leftovers this change made unused; leave pre-existing unrelated dead code; do not delete exports, registrations, or others' work from local-caller absence.
2. **Hunk-to-task scope.** “Diff is scoped” and Spec “scope creep” exist. Sharpen them: supporting work (tests, generated output, shared-owner files, lockfiles) can be necessary; unrelated churn is not; preserve other contributors' edits.
3. **Consequential assumptions.** Frontier + “ask only for preference” exist. Sharpen: surface material alternatives before dependent implementation; continue independent work; low-impact reversible choices may proceed.

Outcome-plus-verification is a narrow refinement of develop's existing acceptance step, not a new planning phase.

## Implementation constraints discovered at review

- `src/eval/grade-outcome.ts` is SHA-frozen by `tests/v0.9-freeze-hashes.test.ts`. Do not add this fixture to that map. Grade the leaderboard case with a fixture-local grader and tests.
- Do not add the new fixture to `REQUIRED_COMPOSITION_FIXTURES` (that list is the v0.6–v0.9 integrity-gated set).
- Native workflows `develop` and `refactor` have no `UPSTREAM.md`. Follow the Ponytail pattern: do not create one; `scripts/check-upstreams.mjs` reads the first `Origin:` / `Upstream revision:` only. Append composed attribution on skills that already have `UPSTREAM.md`.
- Reuse equivalent evals rather than duplicating Ponytail cases: justified seams (`evals/fidelity/simplicity-justified-seam.yaml`), mechanical edits (`evals/complexity/local-edit-no-survey.yaml`, `evals/behavioral/develop-tiny-skips-simplicity.yaml`), comment boundary (`evals/behavioral/develop-comment-judgment.yaml`).
- Changelog: keep Ponytail in `0.9.2`; record this composition under Unreleased. No package or plugin version bump.

## Exclusions

- No public `karpathy-guidelines` skill, command, or always-on rule
- No import of upstream `CLAUDE.md`, `CURSOR.md`, plugin, or marketplace
- No assumption ledger, clarification workflow, or mandatory stop-when-unclear
- No single-use-abstraction ban, line-count rewrite quota, or “impossible scenario” skip
- No weakening of `verify-change` or TDD
- No second simplicity reference
