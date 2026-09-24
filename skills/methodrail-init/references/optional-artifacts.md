# Optional artifacts

Create optional files only when their expected reuse exceeds their maintenance cost. See [information ROI](information-roi.md) and [project harness](../../../references/project-harness.md).

Skeletons live in `templates/project/`. Fill them from repository evidence; omit empty sections and unneeded files.

## Knowledge

`.methodrail/PROJECT.md` remains a concise index. It may point to existing canonical glossary/domain docs, ADRs, specs/plans, operational decision-log conventions, verification skills and feature maps, and existing `.methodrail/knowledge/` notes. Adopt those artifacts by pointer. Do not copy them and do not mark an adopted artifact as Methodrail-owned.

Do not create files under `.methodrail/knowledge/` during init (typed or untyped). Reflect promotes typed notes after real work using [note.md](../../../templates/project/knowledge/note.md). Existing architecture, domain, behavior, and operations files remain valid legacy notes: index them, do not invent new ones.

If init finds expensive undocumented knowledge, report it as a candidate. Do not write the note.

Cite source paths or decisions, record a relevant revision when the claim is code-derived, and label uncertain claims. See [knowledge lifecycle](../../../references/knowledge/lifecycle.md).

Do not mirror the README, issue tracker, or source tree.

## Project control guidance

Use `.methodrail/control/CONTROL.md` when starting, checking readiness, exercising, inspecting, capturing evidence from, resetting, or stopping the project requires non-obvious coordination. See [control investigation](control-investigation.md).

## Project-local skills

`methodrail-init` may create project-local skills such as:

```text
verify-project
run-integration-environment
inspect-database
release-project
migrate-database
```

only when:

- the procedure is nontrivial;
- repeated use is likely;
- mistakes are expensive;
- project-specific knowledge is required.

Do not create a skill for every command.

For an in-repository harness, place a new skill in the repository's established native skill location (`.agents/skills/`, `.cursor/skills/`, or `.claude/skills/`). Preserve an existing skill with the same name unless the user approves a merge. For linked external storage, do not create a host-native skill outside its discovery root; keep the reusable verification procedure under `.methodrail/control/`.

## verify-project

When the project has a meaningful executable surface, plan a verification skill rather than a hand-written stub. Generation waits for the confirmed apply phase and produces launch/doctor/drive/evidence/cleanup plus a feature map.

Create `.agents/skills/verify-project/SKILL.md` (or the established native skill location) only for an in-repository harness when project verification requires a reusable decision tree that agents cannot infer cheaply. A static command map is enough when there is no user-facing runtime. Linked external placement uses `.methodrail/control/` instead.

Required frontmatter:

```yaml
---
name: verify-project
description: Verify changes in this project using its established checks. Use before claiming project changes complete.
---
```

The body should map change types to the smallest relevant existing checks, then describe broader checks for cross-boundary changes. Keep commands sourced from the repository.
