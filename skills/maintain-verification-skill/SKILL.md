---
name: maintain-verification-skill
description: "Keep a project's verification skill and feature map honest. Use for an explicit full audit, or when an owning workflow requests task-scoped maintenance. Never edit product code during a run."
disable-model-invocation: true
---

# Maintain a verification skill

Keep a verification procedure and its feature map accurate. Follow [verification lifecycle](../../references/verification-lifecycle.md). The caller names the scope.

Standalone “audit the verification skill” selects **full audit**. A parent workflow must explicitly select **task-scoped** maintenance. Return changes and evidence to the parent. Do not open a pull request, commit, or release from this skill.

## Modes

| Mode | Coverage |
|---|---|
| task-scoped | Affected feature entries, shared instructions, and harness helpers those entries use. Prove every changed driving procedure. State that coverage is limited to that set. |
| full audit | The complete feature map, a check for missing features, and a live exercise of every mapped feature or a concrete blocker for each gap. |

## Outcomes

Name the mode, the coverage, and one outcome:

- **clean** — inspected scope passed; nothing to change. Task-scoped clean does not mean the whole map was audited.
- **changed** — proven documentation, harness, or map corrections in the inspected scope.
- **blocked** — coverage could not finish, or a proven fix could not be applied safely. Name the gap.

## Edit scope

Edit the verification skill's own directory (SKILL.md, features/, harness scripts it owns) and, when the drift is control documentation, `.methodrail/control/CONTROL.md`. Update the feature-map index when entries are added or removed. When a shared harness helper changes, check its dependent flows and exercise the ones the selected scope includes.

Never edit product code, glossaries, specs, ADRs, or typed notes. A contradiction with those artifacts is a project-knowledge contradiction: report it and you may suggest `reflect`. Do not change expected behavior to make a failing product pass.

## Failure classes

- **Documentation drift:** intended behavior is correct; instructions are wrong. Fix the instructions.
- **Harness defect:** behavior works; the harness cannot drive or inspect it. Fix the harness and re-drive.
- **Product defect:** actual behavior violates intended behavior. Record it, leave expected behavior in place, and return it to the parent.

## Task-scoped pass

Accept the task intent, changed paths, affected features, and existing evidence.

1. Locate the verification skill (`.agents/skills/verify-*`, `.cursor/skills/verify-*`, `.claude/skills/verify-*`, `.methodrail/control/`, or the path `PROJECT.md` points at). None → stop and point at `create-verification-skill`.
2. Update affected entries, shared instructions, and helpers. Add or remove an entry, and update the feature-map index, when the task adds or removes user-facing behavior the map should represent. Expand only when a dependency or observed drift reaches outside that set.
3. Reuse fresh evidence that still matches unchanged relevant state. Rerun a check after an edit invalidates it.
4. Prove every changed driving procedure. Report the limited coverage.

## Full audit

0. **Locate the target.** Several candidates → ask. None → stop and point at `create-verification-skill`.
1. **Index hygiene.** Fix missing, extra, duplicate, or dead entries in the feature-map README.
2. **Source wave.** One read-only pass per feature file. Each returns a summary and one live recipe. Children never drive the app and never edit files.
3. **Reconcile.** Every feature file has a summary. Sweep for user-facing surfaces missing from the map. Require a concrete source path before calling one missing.
4. **Live pass.** Exercise every mapped feature, or record `verified-unreachable` with the prerequisite and the route attempted. Hold three invariants: doctor an instance before driving it after anything surprising; evidence survives cleanup; nothing a drive started outlives that drive.
5. **Triage** using the failure classes above.
6. **Ship or stop.** Re-read every changed file before returning `changed`. For `clean` or `blocked`, report the actual coverage. Do not claim a full audit when a mapped feature was neither exercised nor blocked with a named gap.

## Neighbors

```text
Missing verify skill          → create-verification-skill
Project index                 → `.methodrail/PROJECT.md`
Owning workflows              → develop, debug, refactor
```
