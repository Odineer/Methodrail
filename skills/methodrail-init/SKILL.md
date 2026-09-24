---
name: methodrail-init
description: Initialize or refresh Methodrail guidance in a repository after inspecting its code, tooling, and existing AI instructions. Run only when explicitly requested, including requests to refresh control knowledge.
disable-model-invocation: true
---

# Methodrail init

Create the highest-leverage project-specific AI harness with the least permanent-context cost and maintenance burden. Inspect first, preserve existing guidance, and make repeated runs safe.

Init is a multiplier for every later skill. Optimize for future skill leverage per unit of permanent context and maintenance. Write all agent-facing harness files with [writing-for-agents](../writing-for-agents/SKILL.md).

Ask internally:

```text
What will many skills repeatedly need?
What project behavior is expensive to rediscover?
What control/verification would improve multiple workflows?
What terminology prevents repeated misunderstanding?
What existing docs should agents be pointed to?
What should NOT be copied because the environment already answers it?
```

A tiny project may need only `.methodrail/PROJECT.md`. A mature service may need knowledge notes, control procedures, and a project-local verification skill. Do not generate files merely to satisfy a template.

Do not copy global Methodrail skills (`how`, `tdd`, `wayfinder`, …) into the project. Global skills stay globally installed. Generate only project-specific material.

## Workflow

```text
inspect repository
↓
discover artifact roles (content + layout)
↓
resolve harness placement (directory vs linked external storage)
↓
discover verification requirements without writing
↓
preview create | update | adopt | unchanged | conflict | unavailable
↓
confirm non-empty writes
↓
apply only the confirmed plan
↓
prove generated verification, or report the partial state
↓
validate paths, integration, and refresh idempotency
↓
report created, adopted, unchanged, blocked, and skipped
```

1. Interview the repository before asking the user. Load [repository interview](references/repository-interview.md) and [artifact interoperability](references/artifact-interoperability.md). Inspect the canonical `.methodrail` path at the git root, including whether it is a linked external harness. Classify each recognized artifact as create, update, adopt, unchanged, conflict, or unavailable. A conflict stops that role before any pointer is written.
2. If a harness already exists, refresh it through that canonical path rather than recreate or move it. Load [control maintenance](references/control-maintenance.md). Collect drift findings and proposed edits. Do not invoke `maintain-verification-skill` before confirmation.
3. If none exists, resolve [harness location](references/harness-location.md) before writing files. Ask whether Methodrail knowledge should live in the repository or in repository-bound external storage. Honor a preference already stated in the request. This choice decides git/PR visibility.
4. Resolve only remaining choices the repository cannot answer. Ask a focused question only when the answer materially changes the generated files.
5. Plan proportionally using [information ROI](references/information-roi.md) and [optional artifacts](references/optional-artifacts.md):
   - always consider `.methodrail/PROJECT.md` as a short index pointing at canonical sources (glossary, ADRs, specs/plans, operational TSV, verification, `AGENTS.md`) rather than copying them;
   - index existing knowledge; add control or a project-local skill only when it removes real recurring uncertainty; do not create files under `.methodrail/knowledge/`;
   - in a monorepo, document shared conventions once and add package-specific detail only where commands or constraints differ.
6. Investigate control/verification explicitly when the project has a runnable surface. Load [control investigation](references/control-investigation.md). Invoke `create-verification-skill` in discovery mode and include the proposed artifacts in the preview. Do not invoke `create-verification-skill` in generate mode during investigation. Do not write verification skills, control files, or feature maps in this step. If the checkout does not build or start, report that and skip verification-skill generation; do not repair product code. If the surface is not meaningful, plan static verification and do not invent runtime infrastructure.
7. Preview the full plan, including proposed verification artifacts. Inspection is read-only. A non-empty write waits for explicit confirmation. "Inspect Methodrail setup" is not confirmation. If the repository changes after preview, recompute the plan. A no-op refresh reports `unchanged` without a ceremonial question and does not regenerate a working verification skill.
8. Apply only confirmed targets through the git root's canonical `.methodrail/` path using [merge semantics](references/merge-semantics.md). Prefer templates in `templates/project/` as skeletons to fill from evidence, not as files to copy blindly. The link routes external writes to sibling storage. Adopt existing artifacts by pointer; leave their bytes unchanged. When the confirmed plan includes new in-repository verification, invoke `create-verification-skill` in application phase (generate mode). When the confirmed plan uses linked external storage, write the verified procedure under `.methodrail/control/` and do not add a tracked native skill. On refresh, preserve curated verification content and invoke `maintain-verification-skill` in task-scoped mode only when evidence shows affected drift. Do not regenerate a working verification skill blindly.
9. Install exactly one thin, supported integration described in [integrations](references/integrations.md). A linked external harness relies on the globally installed Methodrail integration plus the canonical repository-root link; do not edit tracked instruction files merely to advertise it. If a supported integration already exists, update only the Methodrail-owned pointer or leave it intact.
10. After application, prove a newly generated verification procedure end to end. If that proof fails, report the partial state and a blocked verification result. Do not claim initialization is fully verified.
11. Validate paths, commands, frontmatter, links, and idempotency. Report knowledge health with the freshness caveat in [artifact interoperability](references/artifact-interoperability.md). A second run with unchanged inputs must produce no diff.
12. Report the harness location and every preview classification. Name created, adopted, unchanged, preserved, skipped, blocked, conflicted, unavailable, and still-human items.

## Output constraints

- `.methodrail/PROJECT.md` is a concise index, not the entire knowledge base.
- Keep PROJECT.md pointer-oriented: links, durable facts, and paths. Do not clone the README or generate a giant summary.
- For linked external placement, use the bundled deterministic script from [harness location](references/harness-location.md). The only repository entry is the locally ignored `.methodrail` link; all harness contents live outside the repository, and `HARNESS.yaml` owns the binding.
- Recognize typed notes and legacy untyped notes. Validate that typed notes are indexed. Report dependency-fresh, `review-required`, `unknown`, malformed, disputed, retired, unbounded, and broken-pointer notes. Say that freshness means declared relevant paths did not change; it does not prove the claim is still right. Do not rewrite, resolve, or migrate notes. Do not create files under `.methodrail/knowledge/` during init (typed or untyped).
- Record commands the repository already supports; do not invent infrastructure.
- Preserve existing `AGENTS.md`, `CLAUDE.md`, Cursor rules, copilot instructions, and local skills. Repository-specific instructions outrank generic Methodrail assumptions.
- Do not copy generic Methodrail doctrine into the project.
- Do not create a skill for every command.
- Do not install multiple integrations “for compatibility.”
- Distinguish documentation/control drift from actual product regression. Do not repair product code during init.
- Write generated `AGENTS.md`, `CLAUDE.md`, Cursor rules, project verification skills, and `.methodrail/PROJECT.md` as indexes and pointers. Do not copy canonical docs into them.

## Progressive disclosure

Load only the reference needed for the current phase:

- [repository interview](references/repository-interview.md)
- [artifact interoperability](references/artifact-interoperability.md)
- [harness location](references/harness-location.md)
- [information ROI](references/information-roi.md)
- [PROJECT.md template](references/project-template.md)
- [optional artifacts](references/optional-artifacts.md)
- [control investigation](references/control-investigation.md)
- [control maintenance](references/control-maintenance.md)
- [merge semantics](references/merge-semantics.md)
- [integrations](references/integrations.md)
- [completion checklist](references/completion-checklist.md)

## Neighbors

```text
Runnable surface              → create-verification-skill
Agent-facing prose            → writing-for-agents
Later harness upkeep          → maintain-verification-skill
```

Do not copy global Methodrail operators into the project.

## Completion

Initialization or refresh is complete when harness location is resolved, the preview was confirmed or was a no-op, generated guidance reflects observed repository facts, existing artifacts remain byte-identical unless an owned Methodrail block was approved, control procedures were investigated when applicable, verification is discoverable in the supported location for that placement, a newly generated procedure was proved or the partial state was reported as blocked, one supported integration exposes Methodrail without tracked changes when external storage was chosen, binding validation passes, knowledge health was reported with the freshness caveat, and another unchanged run would be a no-op.
