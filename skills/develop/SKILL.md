---
name: develop
description: Implement a requested feature from repository evidence through focused verification. Run only when explicitly requested. Do not use for behavior-preserving structural work; use refactor for that.
when_to_use: Explicit request only (/develop), or an active workflow names it. Implements a requested feature; behavior-preserving structural work is refactor.
disable-model-invocation: true
---

# Develop

Deliver the requested change with the smallest justified scope. This workflow sets intent, proportionality, and phase ownership. It does not duplicate leaf-skill procedures.

One workflow owner at a time. Leaf skills are bounded operators. They must not restart another development lifecycle.

```text
task
↓
cheap project-context lookup
↓
understand relevant existing system
↓
identify uncertainty
↓
resolve current decision frontier
↓
define observable success
↓
architecture/prototype only if justified
↓
plan proportionally
↓
implement with canonical discipline
↓
code-review when the change is substantive
↓
repair material findings
↓
verify the final relevant state
↓
one owner completion report
```

## Cheap path first

Match effort to [rigor](../../references/rigor.md). Do not activate the whole stack.

**Tiny bounded change:** inspect → edit → deterministic check → done. An adequate existing check does not invoke `code-review`, `create-verification-skill`, `create-formal-verification-skill`, or a full `maintain-verification-skill` or `maintain-formal-verification-skill` audit. A mechanical task may report a concise claim plus that check.

**Normal feature:** `how` if needed → acceptance criteria and the existing proof → `domain-modeling` when the change introduces or changes product terms, ownership, lifecycle, or domain invariants → `tdd` / implementation in verified slices → `code-review` on the substantive delta → repair material findings → `verify-change` on the final state. Domain documentation is part of the feature when those concepts crystallize; use the canonical glossary and update its project index. Offer an ADR only when the [decision-record](../../references/protocols/decision-record.md) criteria hold, and wait for approval before writing it. Create or task-scoped verification maintenance only when [verification lifecycle](../../references/verification-lifecycle.md) selects it.

**Large uncertain redesign:** `wayfinder` → `domain-modeling` → `how` → `architect` (design only: alternatives, recommendation, and unresolved questions; it must not implement) → `prototype` only for empirical claims → decision → implementation → `blast-radius` → `code-review` → repair material findings → `verify-change`. If rigor is high, name `interrogate` and wait for the user to invoke it. Review depth follows [rigor](../../references/rigor.md). Do not start `arena` because the host can run it.

Do not load `wayfinder`, `architect`, `prototype`, `arena`, or `swarm` for routine work. Never load `interrogate` from this workflow.

## Workflow

1. Read `.methodrail/PROJECT.md` if present. Follow pointers only when relevant. Before relying on a stored note, follow [knowledge reuse](../../references/knowledge/reuse.md).
2. Classify uncertainty with the [decision frontier](../../references/decision-frontier.md), including the [human-decision rule](../../references/decision-frontier.md#consequential-assumptions). Resolve only currently actionable questions. Use the cheapest reliable method: deterministic tool, source/`how`, `observe`, `why`, `research`, `prototype`, `domain-modeling`, or a human. Ask one batch only when both conditions in that rule hold. Routine seams, helper names, and established conventions are not a batch.
3. Define observable success and select existing proof before editing. Apply [Verification](#verification). When a multi-step implementation plan is warranted, pair each meaningful outcome with the evidence that will verify it. Reuse a check across steps where appropriate; do not introduce a separate test or approval for every step. A tiny edit does not acquire a spec document.
4. Load the [simplicity procedure](../../references/simplicity.md) when considering a helper, dependency, or abstraction, or when deciding whether this change made something unused. Rename, label, copy, and other mechanical edits stay inspect → edit → check and do not load that reference. After a replacement or deletion, remove artifacts this change made unused; leave unrelated dead code.
5. Implement in focused increments with `tdd` at agreed seams when that is the honest strategy. Prove each meaningful slice before starting a slice that depends on it. Follow established project patterns. Use `refactor` when the request is structural rather than a feature. Do not commit between slices unless the user asked.
6. If the work resolved or changed a project-specific term, ownership, lifecycle, or invariant, update the canonical glossary during this task through `domain-modeling`. If a new glossary was created, add its pointer to an existing `.methodrail/PROJECT.md`; do not create a second glossary or a project harness just to hold the pointer. Keep implementation details in code/docs where they belong. Offer a durable ADR only for a hard-to-reverse, surprising decision made among real alternatives; wait for approval before writing.
7. Before reporting complete, inspect this task's delta. Each hunk should support the requested outcome, necessary supporting work, required verification or metadata, or [change-created cleanup](../../references/simplicity.md#change-created-cleanup). Remove only this agent's unrelated edits; do not revert other contributors' work.
8. For a substantive change, run `code-review` on the task-owned delta before completion. Pass a [review packet](../../references/protocols/review-packet.md): the request, acceptance criteria, that delta, base and worktree state, applicable standards, verification evidence, and known deviations. Select depth from [rigor](../../references/rigor.md). Repair material findings inside this task. Do not start another lifecycle. Optional suggestions do not expand scope. Use `/review` when the user requests a standalone review. An explicit review request still invokes review even for a mechanical edit.
9. Use `observe` and the project verification skill when the claim is behavioral. If the task adds, changes, or removes user-facing behavior that an existing feature map represents or should represent, including a behavior the map does not yet list, invoke `maintain-verification-skill` in task-scoped mode. Update the index and the affected entries. Do not start a full audit. Then finish with `verify-change` on the final relevant state. If later edits, including review repairs, cleanup, or maintenance, change relevant state, rerun the affected verification before claiming completion.
10. This workflow emits one terminal [completion report](../../references/protocols/completion-report.md) for substantive work. Leaves return their results here. Summarize changed behavior, files, verification evidence, residual risk, and any durable knowledge worth proposing. Do not persist ordinary summaries. A mechanical task may use a concise claim plus its check.

Matt's `implement` skill is not a public Methodrail skill. `/develop` owns the lifecycle.

## Constraints

- Preserve unrelated user changes.
- For all new or materially changed code, avoid comments that restate visible code or narrate ordinary operations. Keep non-obvious rationale, constraints, directives, license notices, and required documentation; do not clean unrelated comments. See [comment details](../../references/simplicity.md#comments) when judgment is unclear.
- Do not broaden a local request into an architectural rewrite.
- Do not claim completion from code inspection alone.
- Do not commit, push, deploy, or mutate production unless explicitly requested.
- Prefer [isolate or handoff](../../references/context-management.md) over stuffing an oversized conversation.
- See [skill composition](../../references/skill-composition.md) and [context economics](../../references/context-economics.md).

## Verification

Follow [verification lifecycle](../../references/verification-lifecycle.md).

- Reuse adequate verification, tests, scripts, or control docs. Do not invoke `create-verification-skill` when those already prove the change.
- Invoke `create-verification-skill` in application phase only for decision `missing-path`, inside this task's authorized scope. Discovery-only requests do not write files.
- Invoke `maintain-verification-skill` in task-scoped mode for decision `mapped-change`, including a new user-facing behavior the map does not yet list. Update the index and the affected entries. Do not start a full audit from this workflow.
- When this task touches covered code of an existing formal check, invoke `maintain-formal-verification-skill` with action `apply` and task-scoped coverage. Invoke `create-formal-verification-skill` only when the task expressly names a formal check or proof target. Retries, concurrency, parsers, and high rigor do not authorize creation. Follow [formal verification](../../references/formal-verification.md).
- A product defect found while creating or maintaining verification returns here. Do not change expected behavior to make it pass.
- Finish with `verify-change` after the last relevant edit.

## Done when

Acceptance criteria are met, the substantive delta was reviewed, material findings were repaired or a concrete blocker remains, the task delta is scoped to the request and necessary supporting work, change-created leftovers are removed, and each completion claim has fresh relevant evidence or a clearly reported verification gap. Substantive work ends with one [completion report](../../references/protocols/completion-report.md) from this workflow.

## Neighbors

```text
Usually follows:              investigate
Often produces:               implementation; tdd cycle; verify-change
Escalate to:                  how, architect, prototype, wayfinder, create-verification-skill, maintain-verification-skill
Avoid combining automatically with: arena, swarm, interrogate
```
