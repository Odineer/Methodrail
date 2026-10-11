---
name: maintain-project
description: "Audit and rank evidence-backed architecture, verification, and tooling debt; resolve selected maintenance work when repairs are explicitly requested. A bare invocation audits without edits."
disable-model-invocation: true
---

# Maintain project

Own maintenance scope, discovery across the v1 lanes, deduplication, ranking, selection tracking, and reconciliation of completed work. Specialist skills keep their procedures. Methodrail stays methodology executed by native hosts. Add no consumer runtime, scheduler, workflow graph, daemon, database, mandatory CLI, or generated copies of skills.

Ordinary development, debugging, investigation, review, and mechanical edits do not start this skill.

## Inputs

- The request, plus any named paths or run-local finding ids.
- `.methodrail/PROJECT.md` when it exists. Follow [knowledge reuse](../../references/knowledge/reuse.md) before treating a stored note as current.
- Canonical checks named by that guidance.

## Invocation

Explicit audit intent wins over generic maintenance wording. A later repair request authorizes repair. It does not make an old finding current: revalidate its evidence against current state first. Clear repair authority is not revoked because several reversible supporting edits are necessary.

| Request | Behavior |
|---|---|
| `/maintain-project` | Read-only audit and ranked report. Stop before repairs. |
| `/maintain-project` plus a named area | Read-only audit of that area and necessary dependencies. |
| Fix named findings from an audit | Revalidate those findings, then repair that batch. |
| Repair a named target | Inspect it and carry the bounded repair through verification. |
| Find and fix clear low-risk debt in a named subsystem | Announce the selected items, then repair that batch. No extra approval prompt. |
| Fix all debt, with no practical boundary | Recommend one evidence-backed batch. Establish that batch before broad implementation. |

Audit is read-only for product source, project guidance, verification infrastructure, and durable artifacts. Existing checks may write disposable output. Use a temporary location when practical and report incidental generated files. Do not repair, automatically format, rewrite an index, promote knowledge, or commit a report during audit. Do not drive production or a shared destructive environment.

An authorized repair may make reversible changes required for the selected outcomes. Preserve existing ADR, typed-knowledge, suggest-only review, and consequential-operation boundaries. Ask only under the [human-decision rule](../../references/decision-frontier.md#consequential-assumptions), or for authority the request does not give. Do not add a per-finding approval ritual. Substantive repairs use the review selection in [rigor](../../references/rigor.md).

## Scope

v1 lanes are architecture, verification, and build/tooling/documentation. Lane procedure and the finding contract: [discovery](references/discovery.md).

Dependency upgrades, vulnerability campaigns, production operations, migrations, and a broad operational-maintenance lane are outside v1. Record an evidenced out-of-scope concern with its boundary. Do not silently expand the run.

No generic smell checklist authorizes cleanup. Duplication, churn, file length, missing tests, quiet code, or dependency age need evidence of cost. A reproducible tooling failure can matter in a quiet area. Architectural redesign still follows the architecture survey's relevance rules.

Match depth to [rigor](../../references/rigor.md). Load [simplicity](../../references/simplicity.md) when a repair considers a helper, dependency, or abstraction, or when deciding whether this change made something unused.

## Procedure

Frame scope, establish a baseline, discover proportionally, deduplicate, rank, and report. Execute a selected batch only when the request authorizes repair. Then verify and reconcile. Handoffs and evidence invalidation: [repair](references/repair.md).

1. Start with project guidance and the canonical deterministic checks that match the scope. Reuse evidence that still matches relevant state. Inspect changed and current-work areas before deep structural exploration. Load a specialist reference only for the lane under examination. A broad request does not launch every skill, every test, full live feature coverage, or subagents.
2. Record findings with the [discovery](references/discovery.md) contract. Identifiers select work inside this run only. Rank confirmed items by urgency, demonstrated benefit, effort, risk, and dependency order. Explain material tradeoffs. Do not rank by deleted lines. Do not invent a confidence number, a debt total, or a project-health score. Keep speculative hypotheses out of the repair queue.
3. An audit ends with the ranked report and a top recommendation.
4. When repair is authorized, revalidate the selected findings, then hand each item to its owner. Sequential repairs are the default. Independent read-only discovery may use native isolated workers when cost and host capability justify it. Do not automatically parallelize shared-file repairs.
5. Stop when the selected outcomes are verified, a concrete blocker prevents further progress, or an agreed budget is reached. Do not start a second discovery sweep. Unexpected out-of-batch findings return to the report.

A reproducible product defect found in these lanes is reported and may enter the selected batch through `debug`. Classify it as a defect. Do not relabel it as technical debt. Use `develop` only when the selected repair explicitly requires an intentional behavior change.

## Outputs

Default output stays in chat. Use an existing project backlog artifact only when the user asks to persist it. Use existing handoff facilities for continuity. Typed knowledge writes stay with `reflect`. There is no mandatory debt ledger, source marker, standing-rule update, or automatic issue filing.

Every report states inspected lanes, paths, and features; skipped areas; checks actually executed; and blockers. Partial coverage is not a project-wide clean claim. No findings is a valid result.

Finish a substantive repair with the [completion report](../../references/protocols/completion-report.md). Do not add keys to that schema.

## Ownership

This skill owns the portfolio. While one selected item executes, its chosen workflow owns that item's lifecycle, then returns evidence here. That workflow must not restart project-wide discovery. Handoffs reuse prior facts and acceptance criteria. See [skill composition](../../references/skill-composition.md) and [task packets](../../references/protocols/task-packet.md).

## Neighbors

```text
Usually follows:              a human maintenance request
Often produces:               ranked audit; selected-repair evidence
Escalate to:                  improve-codebase-architecture, maintain-verification-skill, refactor, debug, develop
Avoid combining automatically with: ordinary edits, standalone debug, review, a standalone architecture survey, a standalone verification audit
```
