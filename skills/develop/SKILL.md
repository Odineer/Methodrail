---
name: develop
description: Implement a requested feature from repository evidence through focused verification. Run only when explicitly requested. Do not use for behavior-preserving structural work; use refactor for that.
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
verify
↓
blast-radius/review proportional to risk
↓
retain valuable learning
```

## Cheap path first

Match effort to [rigor](../../references/rigor.md). Do not activate the whole stack.

**Tiny bounded change:** inspect → edit → deterministic check → done.

**Normal feature:** `how` if needed → acceptance criteria → `tdd` / implementation → `verify-change` → `code-review` if warranted.

**Large uncertain redesign:** `wayfinder` → `domain-modeling` → `how` → `architect` (design only: alternatives, recommendation, and unresolved questions; it must not implement) → `prototype` only for empirical claims → decision → implementation → `blast-radius` → `code-review` → `verify-change`. If rigor is high, name `interrogate` and wait for the user to invoke it.

Do not load `wayfinder`, `architect`, `prototype`, `arena`, or `swarm` for routine work. Never load `interrogate` from this workflow.

## Workflow

1. Read `.methodrail/PROJECT.md` if present. Follow pointers only when relevant. Before relying on a stored note, follow [knowledge reuse](../../references/knowledge/reuse.md).
2. Classify uncertainty with the [decision frontier](../../references/decision-frontier.md), including [consequential assumptions](../../references/decision-frontier.md#consequential-assumptions). Resolve only currently actionable questions. Use the cheapest reliable method: deterministic tool, source/`how`, `observe`, `why`, `research`, `prototype`, `domain-modeling`, or a human.
3. Define observable success and a verification strategy before editing. Ask only when a missing choice is product/taste/preference and the repository cannot answer it. When a multi-step implementation plan is warranted, pair each meaningful outcome with the evidence that will verify it. Reuse a check across steps where appropriate; do not introduce a separate test or approval for every step.
4. Load the [simplicity procedure](../../references/simplicity.md) when considering a helper, dependency, or abstraction, or when deciding whether this change made something unused. Rename, label, copy, and other mechanical edits stay inspect → edit → check and do not load that reference. After a replacement or deletion, remove artifacts this change made unused; leave unrelated dead code.
5. Implement in focused increments with `tdd` at agreed seams when that is the honest strategy. Follow established project patterns. Use `refactor` when the request is structural rather than a feature.
6. Before reporting complete, inspect this task's delta. Each hunk should support the requested outcome, necessary supporting work, required verification or metadata, or [change-created cleanup](../../references/simplicity.md#change-created-cleanup). Remove only this agent's unrelated edits; do not revert other contributors' work.
7. Use `observe` and the project verification skill when the claim is behavioral. Finish with `verify-change`. Use `/review` only when the user requests a separate review or rigor requires it. If later edits change relevant state, rerun the affected verification before claiming completion.
8. Summarize changed behavior, files, verification evidence, residual risk, and any durable knowledge worth proposing. Do not persist ordinary summaries.

Matt's `implement` skill is not a public Methodrail skill. `/develop` owns the lifecycle.

## Constraints

- Preserve unrelated user changes.
- For all new or materially changed code, avoid comments that restate visible code or narrate ordinary operations. Keep non-obvious rationale, constraints, directives, license notices, and required documentation; do not clean unrelated comments. See [comment details](../../references/simplicity.md#comments) when judgment is unclear.
- Do not broaden a local request into an architectural rewrite.
- Do not claim completion from code inspection alone.
- Do not commit, push, deploy, or mutate production unless explicitly requested.
- Prefer [isolate or handoff](../../references/context-management.md) over stuffing an oversized conversation.
- See [skill composition](../../references/skill-composition.md) and [context economics](../../references/context-economics.md).

## Done when

Acceptance criteria are met, the task delta is scoped to the request and necessary supporting work, change-created leftovers are removed, and each completion claim has fresh relevant evidence or a clearly reported verification gap. End with the [completion report](../../references/protocols/completion-report.md) block; keep it proportional.

## Neighbors

```text
Usually follows:              investigate
Often produces:               implementation; tdd cycle; verify-change
Escalate to:                  how, architect, prototype, wayfinder
Avoid combining automatically with: arena, swarm, interrogate
```
