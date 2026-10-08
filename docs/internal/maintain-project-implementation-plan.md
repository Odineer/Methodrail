# Maintain-project: focused v1 implementation handoff

Prepared: 2026-10-08. Status: implementation plan; implementation has not started.

The user selected a focused first version covering architecture, verification, and build/tooling/documentation debt. A bare `/maintain-project` invocation **audits and ranks first**. The user will have Codex review Cursor's completed implementation.

## Cursor execution instruction

Implement this plan in the current Methodrail checkout, then verify it independently and deliver a reviewable result. Continue through all implementation and verification stages without routine confirmation. Make routine implementation choices yourself within the contracts below. A passing static check alone is not proof that an agent followed the skill.

Authorization covers repository edits, tests, disposable fixture runs, and the existing guarded local-plugin copy command when needed to verify this implementation. It does not include commits, pushes, releases, production changes, tracker messages, unrelated cleanup, dependency upgrades, or applying the new maintenance skill to repair the real Methodrail repository. The latter is a separate user task; this task implements the capability.

Preserve all pre-existing working-tree changes. Finish the authorized work before reporting any unresolved host limitation. If live isolated agent trials are unavailable, complete the deterministic and constructed checks, label live verification blocked, and return the implementation for review. Never fabricate a live run or claim empirical improvement from constructed evidence.

## Read before editing

- `.methodrail/PROJECT.md`, `CONTRIBUTING.md`, and `docs/family-integration.md`.
- `skills/writing-for-agents/SKILL.md` and `SKILL-MECHANICS.md` beside it.
- `references/capability-map.md`, `skill-composition.md`, and `skill-authoring.md`.
- `references/verification-lifecycle.md`, `simplicity.md`, and `rigor.md`.
- `skills/improve-codebase-architecture/SKILL.md`, `skills/maintain-verification-skill/SKILL.md`, and their `UPSTREAM.md` files.
- `skills/refactor/SKILL.md`, `skills/debug/SKILL.md`, `skills/develop/SKILL.md`, and `skills/verify-change/SKILL.md`.
- `references/protocols/task-packet.md` and `completion-report.md`.
- `evals/README.md`, `src/eval/load.ts`, `src/eval/grade-outcome.ts`, and `src/composition/grade-verification-trace.ts`.

Resolve all repository paths in this document relative to the checkout root. Historical internal plans are background, not authorization to execute their branch, commit, release, or cleanup instructions.

## Product contract

### Purpose and capability ownership

`maintain-project` owns maintenance scope, discovery across debt categories, deduplication, prioritization, selection tracking, and reconciliation of completed work. Existing skills retain ownership of their specialist procedures. Methodrail remains methodology executed by native hosts; add no consumer runtime, scheduler, workflow graph, daemon, database, mandatory CLI, or generated copies of skills.

Keep the new skill explicit with `disable-model-invocation: true`. Ordinary development, debugging, investigation, review, and mechanical edits do not automatically start project maintenance.

### Invocation and authorization

| Request | Behavior |
|---|---|
| `/maintain-project` | Read-only audit and ranked report; end before repairs. |
| `/maintain-project audit src/billing` | Bounded read-only audit of the named area and necessary dependencies. |
| `Fix findings M1 and M3 from that audit` | Revalidate those findings, then repair that selected batch. |
| `/maintain-project repair: fix the verification drift described here` | Inspect the named target and carry the bounded repair through verification. |
| `Find and fix clear low-risk verification/tooling debt in this subsystem` | Authorizes a bounded batch; announce the selected items before edits, without another approval prompt. |
| `Fix all debt` with no practical boundary | Present an evidence-backed batch recommendation; establish a concrete batch before broad implementation. |

These are natural-language examples, not CLI flags requiring a parser. Explicit audit intent wins over generic maintenance wording. A later repair request grants repair authority but does not make an old finding current: check its evidence against current state first. Clear repair authority is not revoked merely because several reversible supporting edits are necessary.

Audit is read-only with respect to product source, project guidance, verification infrastructure, and durable artifacts. Existing checks and isolated local drives may produce disposable outputs; use temporary locations when practical and report incidental generated files. No repair, automatic formatting, index rewrite, knowledge promotion, or committed report occurs during audit. Do not drive production or a shared destructive environment.

An explicit repair request authorizes reversible changes necessary for the selected outcomes. Preserve existing ADR, typed-knowledge, suggest-only review, and consequential-operation boundaries. Ask only for a genuinely unresolved consequential choice or authority missing from the request; do not add a per-finding approval ritual.

### Focused v1 scope

| Lane | Look for | Reuse |
|---|---|---|
| Architecture | Demonstrated caller burden, repeated structural defects, leaky seams, unnecessary layers in relevant active code | `improve-codebase-architecture`, `codebase-design`, then `refactor` |
| Verification | Stale recipes, broken owned helpers, map omissions, inadequate characterization of selected behavior | `maintain-verification-skill`, verification lifecycle, `verify-change` |
| Build/tooling/documentation | Broken canonical commands, recurring setup friction, incorrect CI wiring, stale operational instructions, contradictory pointers | Existing deterministic tools and bounded direct repairs; `debug` for failures needing diagnosis |

A reproducible product defect encountered in these lanes is reported and may enter the selected batch through `debug`. It is classified as a defect, not automatically relabeled technical debt. Intentional behavior change uses `develop` only when the selected repair explicitly requires it.

Dependency upgrades, vulnerability campaigns, production operations, migrations, and a broad operational-maintenance lane are outside v1. Record an evidenced out-of-scope concern with its boundary instead of silently expanding the run.

No generic smell checklist authorizes cleanup. Duplication, churn, file length, missing tests, quiet code, or dependency age are signals that require evidence of cost. A specific reproducible tooling failure can matter in a quiet area; architectural redesign still follows the architecture survey's relevance rules.

### Finding and coverage contracts

Each actionable finding contains:

1. A run-local identifier, category, and precise target.
2. Evidence pointers and the state/revision they describe; label inference and observation honestly.
3. Demonstrated cost or failure, and expected benefit of resolving it.
4. Proposed outcome, behavior/contracts to preserve, and likely execution owner.
5. Verification baseline, required checks, and characterization gaps.
6. Risk, dependencies, effort described qualitatively, and unresolved choices.
7. Disposition: confirmed, needs investigation, rejected, deferred, resolved, or blocked as appropriate to the phase.

Use identifiers only to select work within this run; add no persistent identity system. Rank confirmed items by urgency, demonstrated benefit, effort, risk, and dependency order, explaining material tradeoffs. Do not rank by deleted lines or invent numerical confidence, debt totals, or a project-health score. Keep speculative hypotheses out of the repair queue.

Merge duplicate symptoms when evidence supports a shared cause. Do not merge findings merely because they touch one file. Baseline product failures, environmental blockers, documentation drift, and harness defects remain distinct.

Every report states inspected lanes/paths/features, skipped areas, checks actually executed, and blockers. Partial coverage never becomes a project-wide clean claim. No findings is a valid result.

### Procedure and stopping conditions

Frame scope → establish baseline → discover proportionally → deduplicate/rank/report → execute selected batch when authorized → verify/reconcile.

Start with project guidance and canonical deterministic checks. Reuse existing evidence when it still matches relevant state. Inspect changed/current-work areas before deep structural exploration. Load specialist references only for the lane being examined. A broad request does not automatically launch all skills, all tests, full live feature coverage, or subagents.

Audit ends with a ranked report and top recommendation. Repairs finish when the selected outcomes are verified, a concrete blocker prevents further progress, or an agreed budget is reached. There is no automatic second discovery sweep that adds new work. Unexpected out-of-batch findings return to the report.

Maintain-project owns the portfolio. While one selected item executes, its chosen workflow owns that item's lifecycle, then returns evidence to maintenance. It cannot restart project-wide discovery. Handoffs reuse prior facts and acceptance criteria rather than redoing the full audit. Sequential repairs are the v1 default. Independent read-only discovery can use native isolated workers if cost and host capability justify it; shared-file repairs are not automatically parallelized.

After the last relevant edit, including cleanup, review fixes, and verification maintenance, rerun invalidated checks. A later repair can invalidate earlier evidence for shared files or helpers: recheck those dependents before the batch claim. Reuse unchanged evidence instead of duplicating every check.

A repaired verification helper must be exercised on its affected and dependent flows. A product defect returned by verification maintenance keeps its expected behavior; send it to the selected execution owner. Recheck the repaired flow after the product fix. New contradictory evidence changes the finding's disposition; it is not permission for an unbounded debug/maintenance loop.

Default output stays in chat. Use existing project backlog artifacts only when the user requests persistence; use existing handoff facilities for continuity. Typed knowledge writes remain governed by `reflect`. There is no mandatory debt ledger, source marker, standing-rule update, or automatic issue filing. Finish substantive repair with the existing completion-report block without adding keys to its schema.

## Stage 0 — Establish and preserve the starting state

- [ ] Capture `git status --short`, tracked staged/unstaged patches, untracked path inventory, and the starting HEAD in a temporary directory. Preserve content snapshots of pre-existing changed files you will edit so task-only changes can be identified at the end. Do not print secrets or copy unrelated private data.
- [ ] Run `npm run check` and `npm run doctor`; record command outputs and exact exit statuses.
- [ ] Inspect the invocation and eval registration code before selecting edits. The checkout already includes uncommitted model-routing and plugin-copy work; retain it.

Review baseline on 2026-10-08: typecheck, 246 tests, repository validation, and recorded eval scoring passed. Doctor reported `stale` with 21 shipped-file differences. These are prior observations, not the current run's proof.

If the `tsx` CLI fails with IPC `EPERM` under a sandbox, use the equivalent loader commands below and record the substitution. An environment failure is not a product failure:

```bash
./node_modules/.bin/tsc --noEmit
node --import tsx --test tests/*.test.ts
node --import tsx src/validate.ts
node --import tsx evals/runners/cli.ts
node --import tsx src/doctor.ts
```

The current test files are directly under `tests/`; ensure the fallback also includes any nested tests introduced during implementation. Do not install a new runner or alter package scripts just to bypass this environment limitation.

Completion: the baseline and pre-existing work are distinguishable from this task's changes.

## Stage 1 — Add the maintenance skill and disclosed procedures

Create:

- `skills/maintain-project/SKILL.md`
- `skills/maintain-project/references/discovery.md`
- `skills/maintain-project/references/repair.md`
- `skills/maintain-project/evals/routing.yaml`
- `skills/maintain-project/evals/routing-negative.yaml`

Keep the main body a compact executable workflow with explicit audit/repair branches, inputs, outputs, ownership, and stopping conditions. Put lane-specific discovery and finding details in `discovery.md`, and execution handoffs/evidence invalidation in `repair.md`. Link shared rigor, simplicity, knowledge reuse, task packets, verification lifecycle, and completion reporting rather than copying their procedures. Stay under the repository's 500-line skill limit; do not fill that allowance.

Frontmatter:

```yaml
---
name: maintain-project
description: "Audit and rank evidence-backed architecture, verification, and tooling debt; resolve selected maintenance work when repairs are explicitly requested. A bare invocation audits without edits."
disable-model-invocation: true
---
```

Declare the new orchestrator Methodrail-native in capability documentation. Do not invent an upstream revision or license provenance for native work. If an actual upstream procedure is copied, preserve its attribution and notices according to existing contribution policy.

Positive routing covers explicit project maintenance. Negative routing covers a local label edit, ordinary debugging, and a standalone architecture or verification audit retaining its existing owner.

Completion: the skill can express all product branches without duplicating specialist algorithms or requiring a consumer implementation.

## Stage 2 — Make existing specialists safely callable

### Architecture survey return

Edit `skills/improve-codebase-architecture/SKILL.md` and `UPSTREAM.md`.

Add a parent-requested `survey-only` phase that performs the existing exploration/classification and returns candidates/evidence to maintain-project. It ends before the standalone selection prompt, grilling loop, or implementation. Keep standalone survey → selection → grilling → brief behavior unchanged. Preserve deletion/deepening/preserve/reject classifications, relevance rules, verification-based recommendation strength, and ADR boundaries.

An already-selected complex structural item can use the existing design operators when uncertainty warrants them; do not force the entire survey or grilling procedure onto a local obvious repair.

### Verification inspection versus application

Edit `skills/maintain-verification-skill/SKILL.md`, `UPSTREAM.md`, and `references/verification-lifecycle.md`.

Separate action phase (`inspect` / `apply`) from coverage (`task-scoped` / `full audit`). Preserve the existing standalone and existing-parent defaults: standalone verification maintenance remains full-audit application; develop/debug/refactor's existing maintenance calls remain task-scoped application. Maintain-project must name both action and coverage explicitly. A read-only parent cannot escalate itself to application.

`inspect` uses the existing index/source/live reconciliation and classification within selected coverage, reports proposed corrections and gaps, and writes none of the owned files. `apply` executes corrections inside the existing edit scope and proves changed driving procedures. Product-code, glossary, spec, ADR, and typed-note restrictions remain intact.

Retain existing apply outcomes `clean`, `changed`, and `blocked`. Add `findings` as an inspect outcome for actionable discrepancies; inspect never reports `changed`. Always state phase and coverage. Full-audit inspection still requires every mapped feature to be exercised or individually blocked; a source-only sample is partial/task-scoped coverage. Broad project maintenance alone does not request a full verification audit.

When no verification skill exists, maintenance discovery records that fact and assesses existing scripts/control evidence. It does not generate one. Create only during authorized repair when the existing lifecycle selects `missing-path`.

Update `src/composition/verification-lifecycle.ts` and `tests/verification-lifecycle.test.ts` to cover the additional contracts while preserving existing protections. Revise static wording assertions to match the chosen clear wording without treating them as execution proof. Init's existing preview/application confirmation boundary remains unchanged.

Completion: parent-only phases are explicit, standalone defaults remain compatible, and inspection cannot write or report an applied repair.

## Stage 3 — Register ownership and document usage

Edit:

- `src/validate.ts`: add `maintain-project` to required skills, workflow skills, explicit skills, and required behavioral coverage.
- `references/capability-map.md`: add the maintenance workflow and its conditional specialist relationships; retain architecture/verification specialist ownership.
- `references/skill-composition.md`: describe portfolio ownership, one-item execution ownership transfer, return artifacts, audit read-only behavior, and conditional full coverage.
- `skills/writing-for-agents/SKILL-MECHANICS.md`: include the new explicit lifecycle entry and authorized parent-composition semantics.
- `README.md`: add the command, audit default, focused scope, and one audit/selected-repair example.
- `tests/invocation-contract.test.ts`: cover explicit registration and negative activation.

Update architecture and verification parent lists where appropriate. Do not scatter maintenance hints across every other skill. Add `maintain-project` to targeted complexity fixtures' forbidden lists to protect ordinary tiny work. Add maintainer documentation to `evals/README.md` or a new linked `evals/reports/maintain-project-v1-verification.md` report as needed.

The plugin manifest already discovers the skills directory; a command registry or adapter-specific copy is unnecessary. Keep the family invariant/global rule unchanged unless a concrete cross-host invariant must change; if changed, regenerate host projections with `npm run project-hosts`, never hand-edit them. No package version bump is needed for this review handoff.

Completion: capability ownership and invocation agree across the skill, validator, docs, and tests, with no permanent-context expansion.

## Stage 4 — Build behavioral fixtures and outcome graders

Declarative skill YAML verifies specification coverage, not execution. Add at least:

- `evals/behavioral/maintain-project.yaml`
- `evals/pressure/maintain-project-scope.yaml`
- `evals/complexity/maintain-project-overtrigger.yaml`
- `evals/composition/maintain-project-specialists.yaml`

Create three small, runnable fixture families under `evals/fixtures/`:

1. **`maintenance-audit`**: a demonstrated broken canonical command, stale verification recipe, evidence-backed active structural friction, an already-deep module, and a quiet speculative candidate. Task asks for audit/ranking only. Correct result prioritizes evidenced work, rejects speculative cleanup, distinguishes verification drift from product failure, reports coverage, and leaves the fixture bytes unchanged.
2. **`maintenance-repair`**: a selected bounded repair with a real failure, adequate existing scripts, unrelated user work, and an unselected tempting cleanup. Correct result fixes only the selected problem/supporting work, preserves public behavior and user content, keeps unselected work intact, and proves the outcome. Include a second run against repaired state to establish no additional diff.
3. **`maintenance-verification`**: verification-owned drift/helper defect plus a product defect and at least two flows sharing a helper. Exercise inspect and apply as separate tasks/variants. Inspect changes no files. Apply fixes only owned infrastructure, preserves the product oracle, returns the product defect, and exercises affected dependents after helper edits. Include a blocked prerequisite variant.

Every fixture needs `README.md`, `task.md`, `expected.yaml`, runnable checks where relevant, and exact forbidden-change/expected-output oracles. Fixtures must not rely on the real user checkout, credentials, external services, or wall-clock timing. Follow existing fixture conventions; no consumer runtime dependency.

Use focused grader helpers, preferably `src/composition/grade-maintenance-trace.ts`, called from the existing `src/eval/grade-outcome.ts` dispatch. These are maintainer tools, not a maintenance execution engine. Use existing artifact conventions and `EvalRun` schemas.

Register canonical fixture IDs in `REQUIRED_COMPOSITION_FIXTURES` in `src/eval/load.ts`, add canonical constructed baseline/treatment pairs under `evals/runners/examples/`, and add their artifacts under `evals/runners/artifacts/`. Ensure default `npm run eval` actually scores the new fixtures. Additional variants can be exercised directly by tests rather than adding a canonical fixture for every case.

Grade outcomes from file snapshots/overlays, executable behavior, command records, and event order. For ranking/report claims, the fixture task can request a small structured report in the answer artifact; parse and check its facts and paths, not paragraph phrasing. This fixture-only machine-readable requirement is not a mandatory consumer report format. Missing evidence is incomplete; do not guess a pass from `behaviors_observed`, skill names, or a completion-report claim.

Add tests such as `tests/maintenance-contract.test.ts` and `tests/maintenance-outcome.test.ts`. At minimum prove these cases:

| Case | Required result |
|---|---|
| Audit adds/edits/deletes a product or guidance file | Fail |
| Audit proposes corrections without applying them | Pass when findings/coverage are supported |
| Quiet speculative or already-deep module becomes an actionable rewrite | Fail |
| Duplicate symptoms are ranked as multiple repairs to the same proven cause | Fail for the fixture's known duplicates |
| Adequate scripts exist but a new verify skill is generated | Fail |
| Selected repair works and preserves unrelated user edits/unselected targets | Pass |
| Expected behavior is weakened to make the product defect pass | Fail |
| Shared helper changes but one required dependent flow is skipped | Fail |
| Verification occurs before a later relevant edit, with no rerun | Fail |
| Named prerequisite blocks coverage and narrower evidence is reported | Correct blocked result, never full clean |
| A previously selected finding's evidence is no longer current | Require revalidation; stale facts alone cannot authorize the asserted repair |
| Repaired-state rerun introduces further changes without new evidence | Fail |
| Tiny ordinary task starts maintenance/full audit | Routing/cost violation |
| Standalone architecture and verification defaults change unintentionally | Fail compatibility contract |

Deliberately mutate passing artifacts to prove each important guardrail catches its violation. Do not add tests that merely copy skill sentences. Constructed failures must be labeled constructed; they establish grader sensitivity, not an observed native-agent failure or empirical gain.

Completion: the new cases participate in normal validation/eval execution, and violating artifacts are rejected for the relevant reason.

## Stage 5 — Verify the implementation deterministically

- [ ] Run focused tests during edits, including specialist lifecycle and invocation contracts.
- [ ] Run `npm run check` after the final relevant edit; fix failures introduced by this task.
- [ ] Run `git diff --check` and check new files for whitespace too; tracked diff checks omit untracked files.
- [ ] Verify new relative Markdown links, native frontmatter, required routing coverage, and skill-size limits through repository validation.
- [ ] Inspect the task-only changes against Stage 0 snapshots. Remove only your unrelated edits. Preserve all prior work.
- [ ] Confirm no generated reports, ledgers, temporary drives, runtime infrastructure, mandatory debt files, or dependency upgrades leaked into the implementation.

If a pre-existing failure appears, isolate and report it; do not silently repair unrelated work. Do not change frozen historical artifacts, historical empirical labels, or release policy to obtain a green result. Update a contract test only when the approved new semantics require it, and retain coverage of its original safety property.

Completion: the full maintainer gate is green, or an independently demonstrated pre-existing/environmental blocker is explicitly recorded with the passing subset.

## Stage 6 — Independently exercise the skill with native agents

Use fresh isolated local agent contexts where the host provides them. They should receive the fixture task, fixture path, applicable project guidance, and the treatment skill pointers; they should not receive this plan's expected answers or grader implementations. Read-only trials run against disposable copies too. Use the same pinned model/settings and identical starting fixture content for each baseline/treatment pair. Sequential trial dispatch is sufficient; do not require a particular model or build an agent-launching service.

Predeclare three paired tasks: audit/ranking, selected repair, and verification inspection/application. Run one baseline and one treatment for each task. Baseline means native agent without Methodrail methodology; treatment uses the new workflow and needed canonical specialists. Hold non-methodology task facts and repository guidance constant. Run a separate treatment rerun on repaired state. Record all attempts, including failures; avoid selective retries to manufacture improvement. Document one repeat as limited evidence.

Use the current checkout skill files directly when isolated-agent tooling can load them. If testing plugin-discovered behavior, run `npm run doctor` first. When stale, inspect the guarded copy helper and run `npm run link-plugin`, then require doctor to report `identical`. Never replace a custom directory manually or bypass the helper's refusal conditions. Reload/discovery cannot be assumed from matching hashes: verify the new skill is actually loaded in the fresh trial. If host reload cannot be automated, complete direct-source trials and report plugin-discovery verification as blocked, without claiming it worked.

Record prompt, fixture initial state, source/install identity, host/model/settings, captured answer, command log, final overlay/diff, verification commands/results, and actual specialist usage. The existing Cursor ledger can supply evidence when available; use `npm run ledger -- to-run` according to its actual options. Keep private unrelated chats and real project ledgers out of committed artifacts. Use `hook_captured`, `runner_captured`, or `operator_summary` honestly.

Score live runs using the same outcome graders as constructed fixtures. Store distinct live run names and a verification report; do not overwrite canonical constructed examples or claim `helped` merely because treatment passed. Both-pass pairs may be neutral. Report time, skill/subagent overhead, unnecessary edits, and incomplete coverage. A safety violation or observed behavior regression requires diagnosis and repair before declaring that branch verified.

If the host cannot launch clean isolated native trials, document the exact limitation, keep the runnable fixtures/commands ready, finish all unaffected work, and return `live verification: blocked`. Skill implementation/constructed verification can be complete while empirical benefit remains unproven. Do not install another host, invent subprocess agents, or request a manual action solely to finish static checks.

Completion: three honest paired trials plus a no-change rerun are captured and scored, or live verification is specifically bounded and blocked. No broad empirical improvement claim is made from this small battery.

## Stage 7 — Return the review packet

Create `docs/internal/maintain-project-implementation-review.md` containing:

- Implemented scope and any justified deviations from this plan.
- Task-only changed/new file list, distinguished from pre-existing work.
- Audit/repair examples and ownership/inspection semantics.
- Exact verification commands, results, artifact pointers, and environment substitutions.
- Constructed guardrail outcomes and grader mutation checks.
- Live trial results and limitations; plugin-copy and actual discovery status when tested.
- Remaining risks, blockers, and the next review targets.

Use existing evidence/report conventions. A review packet is an implementation artifact, not a new `.methodrail/knowledge/` note. Finish with a concise in-chat summary and the existing completion-report schema. Leave the work uncommitted for Codex review; do not open a PR or publish it.

## Final acceptance checklist

- [ ] Bare maintenance invocation only audits and ranks.
- [ ] Focused scope covers architecture, verification, and tooling/documentation.
- [ ] Authorized selected repairs continue without repeated confirmation.
- [ ] Specialist ownership and standalone defaults are preserved.
- [ ] Verification inspection is read-only; application proves owned corrections.
- [ ] Product defects retain their oracle and return to the selected repair owner.
- [ ] Findings have demonstrated cost, concrete evidence, and an honest verification route.
- [ ] Final claims account for evidence invalidated by later edits.
- [ ] Existing user changes, project instructions, knowledge boundaries, and cheap paths survive.
- [ ] New fixture outcomes and violating-artifact checks execute under normal maintainer gates.
- [ ] Native-agent verification is captured honestly or explicitly blocked.
- [ ] No dependency upgrades, consumer runtime, persistent debt system, release, or unrelated cleanup was added.
- [ ] Review packet is sufficient for Codex to inspect the implementation without repeating the full discovery.
