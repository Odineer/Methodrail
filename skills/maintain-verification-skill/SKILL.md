---
name: maintain-verification-skill
description: "Keep a project's verification skill and feature map honest. Use for an explicit full audit, or when an owning workflow requests task-scoped maintenance. Never edit product code during a run."
when_to_use: Explicit request only for a full audit, or an owning workflow requests task-scoped maintenance. Never edits product code during a run.
disable-model-invocation: true
---

# Maintain a verification skill

Keep a verification procedure and its feature map accurate. Follow [verification lifecycle](../../references/verification-lifecycle.md). The caller names the action and the coverage.

Standalone “audit the verification skill” selects **full audit** and **apply**. Calls from `develop`, `debug`, and `refactor` stay **task-scoped** and **apply**. `maintain-project` must name both the action and the coverage. A read-only parent cannot switch this skill to **apply**. Broad project maintenance alone does not request a full audit.

Return changes and evidence to the parent. Do not open a pull request, commit, or release from this skill.

## Action and coverage

| Action | Effect |
|---|---|
| inspect | Reconcile the index, source, and live behavior inside the named coverage. Report proposed corrections and gaps. Write none of the owned files. |
| apply | Execute corrections inside the edit scope and prove every changed driving procedure. |

| Coverage | Extent |
|---|---|
| task-scoped | Affected feature entries, shared instructions, and harness helpers those entries use. State that coverage is limited to that set. |
| full audit | The complete feature map, a check for missing features, and a live exercise of every mapped feature or a concrete blocker for each gap. |

A source-only sample is task-scoped coverage, not a full audit. Full-audit inspection still requires every mapped feature to be exercised or individually blocked.

## Outcomes

Always state the action and the coverage.

**apply** outcomes:

- **clean** — inspected scope passed; nothing to change. Task-scoped clean does not mean the whole map was audited.
- **changed** — proven documentation, harness, or map corrections in the inspected scope.
- **blocked** — coverage could not finish, or a proven fix could not be applied safely. Name the gap.

**inspect** outcomes:

- **findings** — actionable discrepancies. Proposed corrections stay unapplied.
- **clean** — no discrepancy in the inspected coverage. Task-scoped clean does not mean the whole map was audited.
- **blocked** — coverage could not finish. Name the gap.

Inspect never reports **changed**.

## Edit scope

Edit the verification skill's own directory (SKILL.md, features/, harness scripts it owns) and, when the drift is control documentation, `.methodrail/control/CONTROL.md`. Update the feature-map index when entries are added or removed. When a shared harness helper changes, check its dependent flows and exercise the ones the selected scope includes.

**inspect** does not use this edit scope. Write none of the owned files.

Never edit product code, glossaries, specs, ADRs, or typed notes. A contradiction with those artifacts is a project-knowledge contradiction: report it and you may suggest `reflect`. Do not change expected behavior to make a failing product pass.

## Failure classes

- **Documentation drift:** intended behavior is correct; instructions are wrong. Fix the instructions during **apply**. Report them during **inspect**.
- **Harness defect:** behavior works; the harness cannot drive or inspect it. Fix the harness during **apply** and re-drive. Report it during **inspect**.
- **Product defect:** actual behavior violates intended behavior. Record it, leave expected behavior in place, and return it to the parent.

## No verification skill

If none exists, record that fact and assess existing scripts or control evidence. Do not generate a verification skill. Point at `create-verification-skill` only when an authorized repair's lifecycle decision is `missing-path` and that parent may create.

## Task-scoped pass

Accept the task intent, changed paths, affected features, and existing evidence.

1. Locate the verification skill (`.agents/skills/verify-*`, `.cursor/skills/verify-*`, `.claude/skills/verify-*`, `.zcode/skills/verify-*`, `.methodrail/control/`, or the path `PROJECT.md` points at). None → follow [No verification skill](#no-verification-skill).
2. During **apply**, update affected entries, shared instructions, and helpers. Add or remove an entry, and update the feature-map index, when the task adds or removes user-facing behavior the map should represent. Expand only when a dependency or observed drift reaches outside that set. During **inspect**, report those corrections and write nothing.
3. Reuse fresh evidence that still matches unchanged relevant state. Rerun a check after an edit invalidates it.
4. During **apply**, prove every changed driving procedure. Report the limited coverage.

## Full audit

0. **Locate the target.** Several candidates → ask. None → follow [No verification skill](#no-verification-skill).
1. **Index hygiene.** During **apply**, fix missing, extra, duplicate, or dead entries in the feature-map README. During **inspect**, report them.
2. **Source wave.** One read-only pass per feature file. Each returns a summary and one live recipe. Children never drive the app and never edit files.
3. **Reconcile.** Every feature file has a summary. Sweep for user-facing surfaces missing from the map. Require a concrete source path before calling one missing.
4. **Live pass.** Exercise every mapped feature, or record `verified-unreachable` with the prerequisite and the route attempted. Hold three invariants: doctor an instance before driving it after anything surprising; evidence survives cleanup; nothing a drive started outlives that drive.
5. **Triage** using the failure classes above.
6. **Ship or stop.** During **apply**, re-read every changed file before returning `changed`. For `clean`, `findings`, or `blocked`, report the actual coverage. Do not claim a full audit when a mapped feature was neither exercised nor blocked with a named gap.

## Neighbors

```text
Missing verify skill          → create-verification-skill only for missing-path repair
Formal model alignment        → maintain-formal-verification-skill
Project index                 → `.methodrail/PROJECT.md`
Owning workflows              → develop, debug, refactor, maintain-project
```
