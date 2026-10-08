# Maintain-project v1 implementation review

Prepared: 2026-10-08. Status: implementation complete in the working tree. Uncommitted. Codex review target.

This packet is an implementation artifact. It is not a `.methodrail/knowledge/` note. Constructed fixture scores are specification coverage. They are not a live-agent result and not an empirical improvement claim.

## Implemented scope

Focused v1 from `docs/internal/maintain-project-implementation-plan.md`:

- `maintain-project` owns portfolio scope, discovery, deduplication, ranking, and reconciliation. A bare invocation audits and does not edit. Authorized selected repairs continue without a per-finding approval prompt.
- Lanes: architecture, verification, and build/tooling/documentation. Dependency upgrades, vulnerability campaigns, production operations, migrations, and a broad operational-maintenance lane stay out of v1.
- Specialists keep their procedures. `improve-codebase-architecture` gained a parent `survey-only` phase and kept standalone survey, selection, grilling, and the refactor brief. `maintain-verification-skill` separates action (`inspect` / `apply`) from coverage (`task-scoped` / `full audit`).
- Standalone verification maintenance stays full-audit application. `develop`, `debug`, and `refactor` stay task-scoped application. `maintain-project` must name both action and coverage. A read-only parent cannot escalate to apply. Inspect writes nothing and never reports `changed`.
- No consumer runtime, scheduler, debt ledger, package version bump, family-invariant edit, or dependency upgrade.

The new skill was not applied to repair this Methodrail checkout. That remains a separate user task.

## Deviations

- `tests/v0.9-freeze-hashes.test.ts` records a new SHA-256 for `src/eval/grade-outcome.ts` (`94bbc304c6567209e438b27f24afa599b617be643c64261c0dad6dde4f1eb506`). Stage 4 required the maintenance fixtures to be dispatched from that file. The edit is one import and three `GRADERS` entries. Historical grader function bodies were not rewritten. The other frozen paths in that test are unchanged. `tests/eval-v0.9-specifications.test.ts` still passes inside `npm run check`.
- Inspect, blocked full-audit, and repaired-state rerun are exercised by `tests/maintenance-outcome.test.ts`. They are not extra canonical composition fixtures. The plan allows that.
- Live isolated native-agent trials were not run. See Live verification below.

## Task-only files

HEAD at start and finish: `b6b2f787949dc191225d7b4928cefbf79a6a9fdd`.

Stage 0 snapshots are in `/tmp/methodrail-maintain-stage0/` (not in the repo). Pre-existing dirty and untracked paths were copied before edits. The only pre-existing paths this task changed are:

- `README.md` — one workflow bullet
- `references/capability-map.md` — maintenance row and ownership bullets; model-routing row kept
- `src/validate.ts` — `maintain-project` added to required, workflow, explicit, and behavioral lists; `refresh-model-routing` entries kept
- `tests/invocation-contract.test.ts` — one new test
- `evals/complexity/button-text.yaml` — `maintain-project` appended to the existing forbidden list
- `evals/complexity/tiny-edit-no-model-research.yaml` — same, on the untracked model-routing fixture

Clean tracked files this task edited:

- `references/skill-composition.md`
- `references/verification-lifecycle.md`
- `skills/improve-codebase-architecture/SKILL.md`
- `skills/improve-codebase-architecture/UPSTREAM.md`
- `skills/maintain-verification-skill/SKILL.md`
- `skills/maintain-verification-skill/UPSTREAM.md`
- `skills/writing-for-agents/SKILL-MECHANICS.md`
- `src/composition/verification-lifecycle.ts`
- `src/eval/grade-outcome.ts`
- `src/eval/load.ts`
- `evals/README.md`
- `evals/fixtures/README.md`
- `evals/complexity/local-edit-no-survey.yaml`
- `evals/complexity/rename-usr.yaml`
- `evals/complexity/retry-count.yaml`
- `evals/complexity/verification-overtrigger.yaml`
- `tests/verification-lifecycle.test.ts`
- `tests/v0.9-freeze-hashes.test.ts`

New paths:

- `skills/maintain-project/` (`SKILL.md` is 77 lines; plus `references/discovery.md`, `references/repair.md`, and routing evals)
- `src/composition/grade-maintenance-trace.ts`
- `tests/maintenance-contract.test.ts`
- `tests/maintenance-outcome.test.ts`
- `evals/behavioral/maintain-project.yaml`
- `evals/pressure/maintain-project-scope.yaml`
- `evals/complexity/maintain-project-overtrigger.yaml`
- `evals/composition/maintain-project-specialists.yaml`
- `evals/fixtures/maintenance-audit/`
- `evals/fixtures/maintenance-repair/`
- `evals/fixtures/maintenance-verification/`
- `evals/runners/examples/maintenance-audit.baseline.json`
- `evals/runners/examples/maintenance-audit.methodrail.json`
- `evals/runners/examples/maintenance-repair.baseline.json`
- `evals/runners/examples/maintenance-repair.methodrail.json`
- `evals/runners/examples/maintenance-verification.baseline.json`
- `evals/runners/examples/maintenance-verification.methodrail.json`
- matching artifacts under `evals/runners/artifacts/maintenance-audit/`, `maintenance-repair/`, and `maintenance-verification/`
- this review

Pre-existing model-routing, plugin-copy, init, doctor, and adapter edits were left in place. No commit.

## Audit, repair, and inspection

| Request | Result |
|---|---|
| `/maintain-project` | Read-only ranked report. Stop before repairs. |
| Named-area audit | Same, bounded to that area and necessary dependencies. |
| Fix named findings, or repair a named target | Revalidate current evidence, then repair that batch. |
| Find and fix clear low-risk debt in a named subsystem | Announce the batch, then repair. No extra approval prompt. |
| Fix all debt with no boundary | Recommend one batch. Do not start broad implementation. |

Architecture discovery calls `improve-codebase-architecture` in `survey-only` and stops before selection, grilling, and implementation. A local obvious repair does not restart that survey. Verification audit uses `inspect`. Verification repair uses `apply` plus an explicit coverage. Product defects keep their oracle and return to the selected owner. Adequate scripts do not generate a verification skill. Create only on an authorized repair when verification lifecycle selects `missing-path`.

## Verification commands

No `tsx` IPC substitution was required.

| Command | When | Result |
|---|---|---|
| `npm run check` | Stage 0, before edits | exit 0. 246 tests passed. Validate and recorded eval scoring passed. |
| `npm run doctor` | Stage 0 | exit 1. `stale`. 21 shipped files differed. |
| `node --import tsx --test tests/maintenance-outcome.test.ts tests/maintenance-contract.test.ts tests/verification-lifecycle.test.ts` | During implementation | passed after the record-cast and selection-sentence fixes. |
| `./node_modules/.bin/tsc --noEmit` | After the `asRecord` cast | exit 0. |
| `npm run check` | After the last relevant edit | exit 0. 255 tests passed, 0 failed. Validate passed. Eval integrity gate passed, including the three new specification pairs. |
| `git diff --check` | After the last edit | exit 0. New-file trailing-whitespace scan also clean. |
| `npm run doctor` | After implementation, read-only | exit 1. `stale`. 33 shipped files differed. `npm run link-plugin` was not run. |

`npm run check` is `tsc --noEmit && npm test && npm run validate && npm run eval`.

Canonical constructed pairs, from that eval run:

- `maintenance-audit`: specification passed. Help line: not an empirical claim.
- `maintenance-repair`: specification passed. Same help line.
- `maintenance-verification`: specification passed. Same help line.

Provenance on all six example JSON files is `constructed`. Capture is `operator_summary`. Notes say they are not live trials.

## Constructed guardrails

`tests/maintenance-outcome.test.ts` mutates the passing artifacts. These are constructed grader checks, not observed native-agent failures.

| Case | Result |
|---|---|
| Audit overlay edit | fail `audit-edited` |
| Audit deletion of `src/quiet/format.js` | fail `audit-edited` |
| Quiet formatter ranked as a rewrite | fail `unjustified-rewrite` |
| Two ranked repairs for the broken `npm test` cause | fail `duplicate-ranked` |
| New `skills/verify-shop/SKILL.md` on audit or repair | fail `generated-verify-skill` |
| Audit with an empty command log | incomplete |
| Passing audit report, no overlay | pass. Grader runs `npm test`, `node scripts/tests.mjs`, and both drive commands. |
| Audit log edits a source file and restores it; final bytes match | fail `audit-mutated`. Final-byte `audit-edited` stays separate. |
| Selected repair of `package.json` only | pass. `npm test` exits 0 in the overlaid tree. |
| Repair also edits `src/quiet/format.js` | fail `unselected-edit` |
| `evidence_current: false` | fail `stale-evidence` |
| Verify, then another edit | fail `verification-then-edit` |
| Ledger-shaped repair: failing `npm test`, then passing `npm test` with phase `regression`, no `phase: edit` | pass |
| Later edit followed by a failed `npm test` | fail `verification-then-edit` |
| Repaired-state rerun with no edit phase | pass |
| Repaired-state rerun that also writes `format.js` | fail `rerun-extra-edit` |
| Repaired-state rerun that adds an unrelated `package.json` field | fail `rerun-extra-edit`. Compared with the fixture plus the selected `scripts.test` value. |
| Apply that changes `src/refund.js` so the oracle passes | fail `oracle-weakened` |
| Helper edit whose log skips refund | fail `missing-dependent` |
| Inspect with findings and no overlay | pass |
| Inspect overlay write | fail `inspect-wrote` |
| Inspect outcome `changed` | fail `inspect-reported-changed` |
| Full audit blocked on `tools/export-bin`, with checkout and refund drive attempts and no writes | pass |
| Blocked apply that writes a glossary and `skills/verify-shop/SKILL.md` and never drives the narrower flows | fail `generated-verify-skill`, `unowned-edit`, and `missing-drive-evidence` |
| Ledger-shaped verification apply: phase `regression` on the first post-edit drive, no `phase: edit` | pass |
| Converter repair: fail, edit, pass, then another `Write` with no later check | fail `verification-then-edit`. `classifyCommands` keeps both `Write` events. |
| Converter audit: checks, then write and restore | fail `audit-mutated` |
| Checkout passes, then fails, then refund passes | fail `missing-dependent:checkout` |
| Inspect or blocked full-audit inspect with edit and restore, final bytes unchanged | fail `inspect-wrote` |
| Full audit outcome `clean` | fail `false-clean` and `blocked-prerequisite` |

`tests/maintenance-contract.test.ts` checks explicit registration, the bare-audit sentence, standalone architecture selection plus grilling, standalone verification full-audit apply, and tiny-work forbidden lists.

## Live verification

Live verification: blocked.

This session cannot launch a clean isolated native agent that excludes Methodrail for a baseline while holding the same host, model, and settings. The workspace rule always applies. Subagents in this session would still be inside that rule, so they would not be a baseline-versus-treatment pair. No subprocess agent was invented. No live run was fabricated.

`npm run doctor` after the edits still reports `stale` (exit 1, 33 shipped files). Cursor skips plugin files that are symlinks to the checkout. `scripts/link-cursor-plugin.mjs` refuses to replace a destination whose real path is the checkout or sits outside the plugin directory. That helper was not run. Matching hashes would not prove the new skill is loaded, and a copy would also publish the unrelated uncommitted model-routing tree into `~/.cursor/plugins/local/methodrail`. Plugin-discovery verification is blocked.

`npm run ledger -- to-run <ledger.jsonl> --fixture <id> --condition <baseline|methodrail> --host <host>` is the recorded converter. No ledger for these fixtures was captured. Optional flags include `--repeat`, `--plugin-root`, `--workspace-root`, `--out-json`, `--artifacts`, and `--overlay`.

Runnable fixture tasks, if a later host can launch isolated trials:

- `evals/fixtures/maintenance-audit/task.md`
- `evals/fixtures/maintenance-repair/task.md`
- `evals/fixtures/maintenance-verification/task.md`

Give the trial the fixture task, the fixture path, applicable project guidance, and the treatment skill paths. Do not give it this plan's expected answers or `src/composition/grade-maintenance-trace.ts`. Score with the same grader. Keep the runs distinct from the canonical constructed examples.

## Codex review fixes

Five grader holes in `src/composition/grade-maintenance-trace.ts` were reproduced against the first packet and then closed. The skill text was left as agreed.

- A repair or verification log with no `phase: edit` still passes when a `regression` entry shows an edit tool happened before that command. Current conversion also emits each file-edit tool. A later mutation still has to be followed by a successful relevant check.
- The last relevant check after the last mutation must exit 0. For repair that check is `npm test`. For verification apply it is a `drive.mjs --flow` command. A later failed check fails `verification-then-edit`.
- A blocked or full-audit report is checked for a generated verification skill, unowned edits, and drive evidence for each `narrower_evidence` flow before it can pass.
- An unchanged rerun is compared with the fixture `package.json` after `scripts.test` is set to `node scripts/tests.mjs`. An extra field fails `rerun-extra-edit`.
- Read-only audit fails `audit-mutated` when the command log contains an edit, a ledger `regression` phase, or a mutating shell command, even if the final bytes match.

## Second review fixes

`classifyCommands` now emits one `phase: edit` entry for each `Write`, `StrReplace`, `Delete`, or `Edit` tool, in ledger order. The grader uses that timeline. A `regression` phase still marks a single earlier edit only when the log captured no mutation event.

- A second `Write` after passing checks fails `verification-then-edit` because the last mutation has no later successful `npm test`.
- An audit that writes after its final shell check fails `audit-mutated` even when the final bytes match.
- Each required flow's latest post-edit drive must exit 0. A later checkout failure is not hidden by a later refund success.
- Task-scoped inspect and blocked full-audit inspect fail `inspect-wrote` when the log contains an edit or restore event.

## Remaining risks

- Empirical benefit is unproven. A future n=1 battery is not a general improvement claim.
- The grader requires the fixture-local `maintenance_report` fields. A live answer that is factually right but omits that block is incomplete. That block is not a consumer report format.
- The v0.9 freeze hash for `src/eval/grade-outcome.ts` now covers the dispatch edit. A later silent rewrite of an old grader body would still fail `tests/eval-v0.9-specifications.test.ts`, not the old hash.
- The installed Cursor plugin does not contain this skill until a guarded `npm run link-plugin` and a fresh session that actually lists the skill.

## Review targets

- `skills/maintain-project/SKILL.md` and `skills/maintain-project/references/`
- `skills/improve-codebase-architecture/SKILL.md` parent phase versus the unchanged selection and grilling sections
- `skills/maintain-verification-skill/SKILL.md` and `references/verification-lifecycle.md`
- `src/composition/grade-maintenance-trace.ts` and `tests/maintenance-outcome.test.ts`
- The three canonical example pairs and their overlays
- The freeze-hash deviation in `tests/v0.9-freeze-hashes.test.ts`
