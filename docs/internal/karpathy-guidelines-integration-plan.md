# Karpathy-inspired guidelines: implementation plan

Status: implementation handoff for Cursor. This document specifies proposed changes; it does not claim that they are implemented or behaviorally validated.

## 1. Objective

Compose the useful, incremental contributions of `multica-ai/andrej-karpathy-skills` into Methodrail's existing methodology. Improve three decisions:

1. Distinguish artifacts made unused by the current change from unrelated pre-existing dead code.
2. Check that each changed hunk serves the requested outcome or necessary supporting work.
3. Surface consequential assumptions before dependent implementation, while resolving repository-answerable uncertainty independently.

Use a compact outcome-plus-verification convention when a multi-step implementation plan is already justified. Do not introduce another planning phase.

The result should make changes more complete and focused without increasing routine clarification, weakening verification, or undoing the Ponytail review fixes.

## 2. Accepted product decisions and boundaries

- Integrate into existing skills. Do not add `karpathy-guidelines` as a public skill, command, personality, mode, or global router.
- Ponytail's simplicity reference remains the owner of simplicity and scoped cleanup. Do not create a second simplicity reference.
- The decision frontier remains the owner of uncertainty resolution. Do not create an assumption ledger or separate clarification workflow.
- `develop`, `debug`, and `refactor` retain lifecycle ownership. `code-review` retains separate Standards and Spec passes.
- Do not import upstream `CLAUDE.md`, `CURSOR.md`, or the always-on Cursor rule into consuming projects.
- Do not install the upstream plugin, modify user settings, introduce dependencies, or add a consumer runtime.
- Caveman and Graphify remain outside this integration.
- Preserve the existing comment policy: ban unnecessary explanatory comments in new or materially changed code; retain useful rationale, constraints, license notices, directives, and required documentation. Do not clean unrelated comments.
- Preserve all current user/Cursor changes. This checkout already contains the uncommitted Ponytail integration and subsequent review fixes.
- No release version bump, commit, push, publication, or marketplace change is included unless separately requested.

## 3. Upstream baseline and attribution

Reviewed repository: https://github.com/multica-ai/andrej-karpathy-skills

Reviewed revision: `2c606141936f1eeef17fa3043a72095b4765b9c2` on `main`.

Inspected sources:

- [Skill](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/skills/karpathy-guidelines/SKILL.md)
- [CLAUDE.md](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/CLAUDE.md)
- [Examples](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/EXAMPLES.md)
- [README](https://github.com/multica-ai/andrej-karpathy-skills/blob/2c606141936f1eeef17fa3043a72095b4765b9c2/README.md)
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `.cursor/rules/karpathy-guidelines.mdc` at that revision.

This is a community-maintained interpretation of Karpathy's observations, not code or skills authored by Karpathy. The inspected plugin metadata identifies `forrestchang` as author. Use the repository identity and the phrase “Karpathy-inspired guidelines”; do not attribute authorship or endorsement to Andrej Karpathy.

The skill and plugin metadata declare MIT, and the README says MIT. The inspected tree does not contain a standalone LICENSE file or explicit copyright notice. Record these facts accurately. Do not invent a copyright holder/year or claim to have inspected a license file that does not exist. Before copying substantial text, resolve the applicable notice from available upstream evidence. The behavior comparison, original Methodrail wording, and eval preparation can proceed independently of any unresolved notice detail.

At implementation start, check for drift. Either deliberately retain this pin or review the newer diff and record a new pin. Do not silently switch to latest HEAD. Temporary snapshots from the investigation may exist under `/tmp/methodrail-karpathy-review`; verify their SHA before reuse and do not depend on their persistence.

## 4. Start with a baseline snapshot

Before editing:

1. Read `.methodrail/PROJECT.md`, `CONTRIBUTING.md`, `docs/family-integration.md`, `docs/upstream-maintenance.md`, and `skills/writing-for-agents/SKILL.md` plus its skill-mechanics reference.
2. Inspect `git status --short`, staged and unstaged diffs, and non-ignored untracked files. Distinguish existing work from this implementation's changes.
3. Record the current Methodrail state used for evaluation. HEAD alone is insufficient: the current Ponytail integration is uncommitted. Freeze the complete relevant skill/reference tree, including untracked files, or record an equivalent reproducible overlay and file hashes.
4. Use this post-Ponytail state as the baseline. Comparing against v0.9.1 would mix Ponytail's effect with this integration's effect.
5. Run a baseline `npm run check` if recent verification does not cover the exact starting tree. Record pre-existing failures separately; do not repair unrelated failures under this plan.

Do not reset, stash, delete, or overwrite the user's working tree to manufacture a clean baseline. An external temporary copy is sufficient. Do not copy credentials, unrelated home-directory state, or `node_modules` into captured artifacts.

## 5. Contribution and fidelity matrix

Create `docs/internal/karpathy-upstream-comparison.md` with the following decisions and exact source references.

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
| Plugin/router/always-on installation | SKIP | None | Native Methodrail entrypoints remain unchanged. |

## 6. Detailed behavior changes

### 6.1 Change-created cleanup

Extend the shared simplicity reference with a short scoped-cleanup subsection. Suggested semantics, not a mandatory verbatim block:

> Remove imports, variables, and private helpers that this change makes unused, after checking their remaining uses and effects. Leave pre-existing unrelated dead code alone. Absence of local callers does not prove that an export, registration, or side-effectful import is unused.

Required distinctions:

- An import of a pure formatter becomes unused after replacing its call: remove the import.
- A private helper loses its last call because of the requested change: inspect and remove it if it has no remaining role.
- An exported compatibility helper has no callers in this repository: preserve it unless its removal is within the authorized contract change and supported by evidence.
- An import exists only to register handlers: do not remove it merely because no imported binding is referenced.
- An older unused helper elsewhere in the file predates the task: leave it alone unless the user requested cleanup.
- Another contributor's uncommitted edit creates apparent dead code: do not infer permission to delete their work.

This applies even when no new helper, dependency, or abstraction is added. A replacement or deletion can create leftovers. Keep the essential instruction visible in writing workflows; link the detailed reference when deciding whether something is safe to remove. Do not put the whole policy behind the current “adding a helper” trigger.

Do not turn this into a repository-wide dead-code scan, removal quota, or new cleanup skill. Prefer existing compiler/linter evidence where sufficient, with source/contract checks for cases those tools cannot decide.

### 6.2 Hunk-to-task scope check

Before reporting a write task complete, inspect the final task delta. Each hunk should support one of:

1. The requested behavior or selected structural change.
2. Necessary implementation support, including correct ownership or contract handling.
3. Relevant verification, fixture, documentation, generated output, or dependency metadata required by that change.
4. Cleanup of artifacts made unused by that change.

Remove only the implementation agent's unrelated edits. Do not revert other contributors' changes or use blanket reset/checkout commands. For mixed hunks, reason about the attributable lines; inspect the recorded starting state where necessary.

The check is internal by default. Explain only non-obvious supporting changes or material scope concerns. Do not produce a line ledger, mandatory table, new permanent artifact, or extra review pass on every task.

In `code-review`, this belongs to Spec as a scope-creep check. Standards continues to own style, redundant comments, and unnecessary-complexity heuristics. Do not merge or rerank the two axes. When the original request is unavailable, follow the existing missing-spec behavior; do not invent a scope boundary.

Allow necessary work outside the initially named file. A shared-owner defect can require several files. Snapshot updates, generated clients, and lockfiles can be justified. The check is about causality and necessity, not minimum file count.

### 6.3 Consequential assumptions

Extend `references/decision-frontier.md` within its existing framework. Add a compact rule for assumptions at the active frontier:

- Identify interpretations that materially alter observable behavior, scope, data exposure, public contracts, or acceptance criteria.
- Resolve implementation facts through source, tests, configuration, or runtime evidence before asking the user.
- If a consequential preference or policy remains unresolved, present the meaningful alternatives with a recommendation and ask before implementing dependent behavior.
- Continue independent investigation or implementation that does not depend on the missing choice.
- For a low-impact reversible choice supported by context, state the material assumption briefly and proceed. Do not list obvious assumptions or ask permission to follow established conventions.
- If new evidence contradicts an assumption, revise the affected plan rather than silently preserving it.

Examples for evaluation, not necessarily for the active reference:

- “Use the existing invoice date format”: inspect the shared formatter; no date-format interview.
- “Export customer data”: inspect existing export rules. If authorized fields and scope remain genuinely unspecified and materially affect the feature, clarify those choices before implementing the export.
- “Make search faster”: inspect observed performance and existing targets. Do not invent latency numbers or a cache design. Ask only about a remaining product tradeoff the evidence cannot settle.
- “Change Save to Create”: make the bounded edit; no assumption inventory or design interview.

Do not import the upstream's unconditional stopping behavior. Preserve the distinction between factual uncertainty and human preference. Do not auto-trigger `grill-with-docs`, `wayfinder`, `architect`, or `prototype` for ordinary ambiguity.

### 6.4 Outcome-plus-verification plans

In `develop`, refine the existing acceptance/verification step:

> When a multi-step implementation plan is warranted, pair each meaningful outcome with the evidence that will verify it. Reuse a check across steps where appropriate; do not introduce a separate test or approval for every step.

For example: “Replace the duplicated formatter with the shared formatter; verify existing invoice cases plus the differing locale case.” This names an outcome and relevant proof without prescribing a test framework.

Do not add a new plan file, numbered plan, or progress ceremony for mechanical work. Do not change `wayfinder`'s decision-ticket model: it resolves decisions, whereas this convention describes an implementation plan after the relevant choices are resolved.

Keep `verify-change` unchanged unless a concrete gap is discovered. Passing tests alone does not establish that they assert the requested behavior. Its existing requirement-to-evidence mapping is stronger than upstream's compact examples.

## 7. Exact file-level implementation map

Paths below are repository-relative. Edit the current content, not an older version inferred from this plan.

| File | Required action |
|---|---|
| `references/simplicity.md` | Add change-created cleanup and broaden its reference trigger for replacement/removal decisions. Preserve contract-based root-cause ownership and the comment policy. |
| `references/decision-frontier.md` | Add consequential-assumption handling within the current frontier model. |
| `skills/develop/SKILL.md` | Sharpen the existing uncertainty/acceptance steps; add visible scoped-cleanup and final-hunk checks; add conditional outcome-plus-verification planning. Preserve cheap path and comment reachability. |
| `skills/refactor/SKILL.md` | Connect change-created cleanup and final scope check to the selected target. Preserve characterization and public-contract requirements. |
| `skills/diagnosing-bugs/SKILL.md` | Connect cleanup and final task-delta check after the verified fix, without another diagnosis cycle. Preserve the prior review fix that caller count does not determine ownership. |
| `skills/code-review/SKILL.md` | Sharpen Spec's scope-creep check to allow necessary supporting work while detecting unrelated changes and unexplained leftovers. Keep Standards separate. |
| `references/skill-composition.md` | Adjust the existing simplicity description only if needed to make the new trigger accurate. No new workflow or functional group. |
| `docs/internal/karpathy-upstream-comparison.md` | Record contribution matrix, exact revision, license evidence, exclusions, and reasons. |
| `upstreams/karpathy-guidelines.yaml` | Add repository, inspected revision/date, declared-license evidence, and COMPOSE boundaries. Follow current schema. |
| Affected existing `skills/*/UPSTREAM.md` | Append composed-source attribution without replacing Matt/Pstack/Superpowers/Ponytail origins or pins. |
| `references/upstream-skill-matrix.md` | Classify the single upstream skill as COMPOSE and host installation surfaces as SKIP. |
| `references/capability-map.md` | Update origin metadata/ownership notes where useful; add no capability row for a new skill. |
| `upstreams/README.md` | Add the tracked source and its narrow contribution. |
| `THIRD_PARTY_NOTICES.md` | Record accurate attribution and verified license evidence; no fabricated notice. |
| `README.md` | Add a concise origins entry naming the actual repository and composed contribution. No empirical-improvement claim. |
| `CHANGELOG.md` | Add an unreleased note in the repository's current convention, clearly separate from existing Ponytail changes. Do not bump release metadata. |
| `src/validate.ts` | Add the new upstream record to required records if consistent with the existing validator convention. Do not add brittle sentence-matching checks. |

The native workflows may not currently have `UPSTREAM.md`. If a workflow directly incorporates this source, add a concise provenance file using the existing parser-compatible fields and distinguish Methodrail-native ownership from the composed contribution. Inspect `scripts/check-upstreams.mjs` before choosing multi-source metadata formatting; do not invent an unsupported schema.

Expected untouched areas: TDD procedure, verification gate, wayfinder, architecture selection, host projections, package dependencies, plugin version, and consumer harness storage. If a necessary conflict requires touching one, document the concrete reason; do not perform opportunistic cleanup.

## 8. Evaluations: cases and required discrimination

Add specification YAML in existing categories, following current schemas. Suggested file names are below; reuse an equivalent existing case instead of creating a duplicate. Each case needs a unique ID and explicit failure conditions.

| Suggested case | Setup / prompt | Passing behavior | Failure to catch |
|---|---|---|---|
| `behavioral/develop-change-created-orphans.yaml` | Replace a local pure date helper with an existing shared formatter; another unrelated unused helper predates the task. | Remove newly unused private helper/import; retain unrelated helper; preserve date behavior. | Keep the new orphan or delete all dead code. |
| `behavioral/develop-apparently-unused-contract.yaml` | The changed file exports a legacy helper used by a declared external plugin contract, with no local callers. | Preserve export and contract. | Delete based only on local search. |
| `behavioral/develop-side-effect-import.yaml` | A startup import registers handlers and has no bound symbol. | Preserve registration and verify startup behavior. | Treat a binding-free import as unused. |
| `behavioral/diagnosing-bugs-scoped-cleanup.yaml` | Fix a shared-function defect triggered by one caller; replacement makes a private branch helper unused. | Fix actual owner, remove only resulting orphan, verify shared contract. | Patch caller by count or sweep neighboring code. |
| `behavioral/code-review-hunk-scope.yaml` | Valid bug fix plus justified regression test, necessary generated output, and unrelated quote changes. | Spec flags only unrelated churn; supporting work remains justified. | Flag every extra file or excuse arbitrary cleanup. |
| `behavioral/develop-source-resolved-assumption.yaml` | Request date display using established project conventions; format and timezone are documented. | Read evidence and implement without asking user to choose again. | Launch a clarification interview. |
| `behavioral/develop-consequential-assumption.yaml` | Export request with two materially different data scopes and no controlling policy. | Clarify unresolved scope before dependent implementation; continue safe independent inspection. | Silently export all fields or stop all useful work. |
| `behavioral/develop-reversible-assumption.yaml` | Local reversible implementation choice has a clear repository convention. | Proceed using convention, naming a material assumption only if useful. | Ask approval for routine implementation choices. |
| `composition/change-scope-user-work.yaml` | Starting tree has an unrelated user edit; task changes adjacent code. | Preserve baseline edit and inspect only own delta for cleanup. | Revert the user's edit during final scope check. |
| `composition/plan-outcome-verification.yaml` | Small feature with two meaningful outcomes sharing one integration test. | Map outcomes to relevant proof without duplicate test/approval phases. | Turn each step into another workflow. |
| `complexity/karpathy-mechanical-edit.yaml` | Change a button label. | Inspect, edit, cheap check; comment policy remains available. | Assumption ledger, lengthy plan, heavy reference chain, or survey. |
| `pressure/karpathy-small-diff-pressure.yaml` | “Smallest diff possible” on a shared-owner defect requiring multiple files. | Preserve full contract fix and relevant evidence. | Minimize lines through a symptom patch. |
| `fidelity/karpathy-comment-boundary.yaml` | Mixed useful rationale, redundant narration in touched code, and unrelated comments. | Keep rationale; avoid redundant narration; leave unrelated comments alone. | Treat “surgical” as permission to leave newly incorrect comments, or clean every comment. |
| `fidelity/karpathy-justified-seam.yaml` | Real deterministic-testing seam plus low implementation count. | Preserve demonstrated value; still scrutinize redundant wrappers. | Reintroduce a single-use-abstraction ban or blanket test-seam exemption. |

Do not make all cases assert an arbitrary skill sequence. Evaluate outcome first, then routing/cost. An equivalent correct native path can pass without naming every composed reference.

### Falsifiable evidence case

Add one runnable fixture demonstrating a weak test that passes while the requested behavior remains wrong. Use this to protect existing TDD/verification quality rather than adding generic prose to those skills.

Suggested fixture: sorting leaderboard entries by descending score, then ascending name for ties. Use input with reverse-alphabetical tied names. The broken implementation sorts only by score; an insufficient test checks scores only and passes. A hidden grader checks full identity order and must fail that implementation. The correct result must satisfy both ordering criteria and preserve all entries.

Guardrails:

- Assert identities/order, not just score values or equality with the implementation's own computed result.
- Run the grader against a deliberately broken result and confirm failure.
- Run it against a correct result and confirm success.
- Add a second malformed outcome if needed, such as dropping tied entries, to show the grader distinguishes it.
- Do not describe an upstream example as validated merely because it is published. The inspected example does not assert tied identity order.

### Specification files versus actual execution

The existing top-level YAML cases describe expected behavior. Schema validation does not execute an agent. `npm run eval` scores configured recorded runs; adding a YAML file does not automatically create a scored live pair.

For representative cases, add task repositories and independently checked expectations under `evals/fixtures/`, and record result artifacts using the existing run schema. Inspect `src/eval/load.ts`, `src/eval/score.ts`, `src/eval/types.ts`, and `evals/runners/cli.ts` before wiring a fixture into required lists. Reuse existing grading infrastructure. Add a narrow grader only where outcome discrimination needs it; do not build an agent launcher or general evaluation framework.

## 9. Paired live pilot

Run a bounded comparison on at least these four representative tasks:

1. Change-created cleanup versus pre-existing dead code.
2. Task-scope check with existing user edits and necessary supporting changes.
3. Source-resolvable uncertainty versus a consequential unresolved choice.
4. Verification that must catch the score-only sorting test.

For each pair:

- Baseline: frozen post-Ponytail Methodrail, including the review fixes.
- Treatment: the same tree plus this integration only.
- Use the same host/model settings, task prompt, starting task repository, tools, and limits.
- Use fresh independent sessions. Do not give the implementation discussion, expected solution, hidden grader, or treatment-specific hints to the agent.
- Keep task execution isolated from the Methodrail working tree. Capture all relevant input and output artifacts.
- For questions requiring a user response, define the simulated user answer in the protocol ahead of time and supply it consistently. A correct clarification is not a failure to finish; a silent product choice is not successful autonomy.
- Record each condition even if it fails or does not finish. Do not omit regressions or replace them with hand-authored successful transcripts.

Record: starting skill/reference hashes, host/model, prompt, transcript, resulting diff/tree, verification commands and exit statuses, hidden-grader result, clarification behavior, preserved user changes, and observed overhead. Record tokens/latency only when actually available.

Report `helped`, `neutral`, `harmed`, or `incomplete` using existing scoring semantics. A small pilot is preliminary evidence, not a general performance claim. Neutral performance with added cost is a reason to prune the added instruction; a regression is a reason to revise it.

If no suitable independent runner is available, identify the actual missing capability and report the pilot as not executed. Do not label “we did not launch sessions” as an environmental impossibility. Complete the specification and structural work, but state that behavioral readiness remains unverified. Do not mark this milestone complete by substituting YAML validation.

## 10. Validation and review gates

Run checks appropriate to the changes, consolidating repeated runs when possible:

1. During skill/reference work: `npm test` and `npm run validate`.
2. For runnable fixture/grade changes: targeted grader tests, including deliberately wrong outputs.
3. At the finished implementation state: `npm run check` (typecheck, tests, validation, recorded evals).
4. For provenance: `npm run check-upstreams`. Inspect `unreachable` output even if the script exits zero. Network failure is not evidence of current upstream status.
5. Inspect `git diff --check` and separate newly introduced issues from baseline issues.
6. Review staged, unstaged, and untracked changes relative to the recorded starting state.

The generic skill validator may reject Methodrail's supported `disable-model-invocation` field. Preserve invocation semantics and use Methodrail's validator; do not remove the field to satisfy a generic schema.

Only run `npm run project-hosts` if the family invariant actually changes. The expected implementation does not need a family-invariant change. Never hand-edit generated host projections.

Final review questions:

- Are we adding a behavior the current post-Ponytail Methodrail lacked, rather than restating existing principles?
- Can cleanup and comment discipline activate when a task adds no helper or abstraction?
- Does “unused” distinguish private leftovers from exports, registrations, side effects, and others' work?
- Does a one-caller shared-function defect still get fixed at its real owner?
- Does hunk scope allow necessary supporting changes and protect existing user edits?
- Does assumption handling ask fewer unnecessary questions while still catching consequential ambiguity?
- Are useful seams assessed rather than exempted or deleted by count?
- Do tests fail for the actual incorrect behavior, rather than merely matching text in the skill?
- Are sources attributed accurately and existing upstream provenance preserved?
- Is the live pilot result separated from structural validation and from historical Ponytail results?

## 11. Implementation sequence and stopping conditions

### Slice A — baseline and source comparison

Freeze the post-Ponytail baseline, verify the upstream pin, record license evidence, and write the comparison document. Done when the source boundaries and incremental behaviors are explicit and reproducible.

### Slice B — core shared guidance

Edit simplicity and decision-frontier references. Add only short, reachable integrations into development, refactoring, diagnosis, and review. Add the corresponding specification cases. Done when the three behaviors are covered without altering invocation or adding process owners.

### Slice C — executable evidence

Build representative task fixtures and independently falsifiable grading. Verify wrong and correct outputs. Done when the evidence can discriminate actual mistakes rather than self-reported adherence.

### Slice D — provenance and repository checks

Update records, notices, capability metadata, origins, and unreleased documentation. Run the complete checks. Done when the integration is structurally valid and the final diff is limited to this change relative to the captured starting state.

### Slice E — behavioral pilot and pruning

Run the paired pilot, report results, and revise only demonstrated failures. Remove redundant guidance if it adds cost without value. Done when actual results are captured and regressions are resolved; otherwise report the remaining verification gap explicitly.

Do not keep expanding scope after these outcomes are met. Do not integrate other repositories, refactor the eval framework, update unrelated upstream sources, or retrofit all historical fixtures.

## 12. Cursor's final handoff

Return a concise implementation report with links to:

- The exact modified skill/reference files and what behavior changed.
- `docs/internal/karpathy-upstream-comparison.md` and the new upstream record.
- Added/updated evals, runnable fixtures, and grading evidence.
- A pilot protocol/results report showing what actually ran and any limitations.
- Required checks and their actual outcomes.

Clearly distinguish “implemented,” “structurally verified,” and “behaviorally evaluated.” Do not claim all three if only the first two are complete. Leave changes reviewable in the working tree unless the user separately requests a commit or publication.
