---
name: sync-upstream
description: "Sync one Methodrail upstream source: inspect recent diffs, keep only relevant changes, tailor them to Methodrail, verify, and stop before commit. Use for /sync-upstream or explicit maintainer requests to incorporate upstream skill updates. Do not use for consumer project work or mixed-intent coding."
disable-model-invocation: true
---

# Sync upstream

Keep adapted Methodrail skills current with one named upstream. Inspect first. Never overwrite a Methodrail adaptation blindly. Discoveries are reports, not imports.

This skill is maintainer-only. It is not a consumer plugin skill. Policy stays in [CONTRIBUTING.md](../../../CONTRIBUTING.md) and [upstream maintenance](../../../docs/upstream-maintenance.md).

```text
named upstream
↓
deterministic preflight JSON
↓
triage: incorporate | skip-irrelevant | discovery-only
↓
one worker per incorporate skill
↓
parent merges, updates provenance
↓
verify
↓
stop before commit
```

## Start

If the user did not name an upstream, ask for one `upstreams/*.yaml` record (`matt-pocock`, `pstack`, `superpowers`, `ponytail`, `karpathy-guidelines`) and stop until they answer. One upstream per invocation.

## Phase A: Preflight

Run:

```bash
node scripts/check-upstreams.mjs --upstream <name> --format json
```

Read the JSON. Do not guess SHAs or changed paths when the script answered.

| Status | Action |
|---|---|
| `current` | Report current. No workers. Stop. |
| `unreachable` | Report the failure. No edits. Stop. |
| `changed` with `diff_error` | Report that the diff could not be listed. No edits. Stop. |
| `changed` | Continue to triage. |

## Phase B: Triage

Build a table covering every `mapped` row and every `discoveries` row.

- `mapped` with a behavioral Methodrail impact → `incorporate`
- `mapped` that is changelog noise, formatting-only, or host-router/control-plane material Methodrail already rejected → `skip-irrelevant`
- `discoveries` (`SKIP`, `COMPOSE`, `unlisted`) → `discovery-only`. List them. Do not adopt a new capability.

Read [import rules](../../../docs/upstream-maintenance.md#import-rules) and the [upstream skill matrix](../../../references/upstream-skill-matrix.md) before incorporating. Fetch the upstream diffs for incorporate rows (commit range `imported`..`head`).

If no row is `incorporate`, inspect remaining discoveries and unmapped paths, then continue to provenance. An empty mapped list is fully resolved.

## Phase C: Skill workers

One worker per `incorporate` skill. Partition like [swarm](../../../skills/swarm/SKILL.md): independent slices, standalone briefs, `PASS` / `ISSUES` / `SKIP` / `BLOCKED`. Spawn in parallel when the host can; otherwise run the same briefs sequentially. Do not invent a second orchestration OS.

Each brief includes: upstream name, `imported`..`head`, changed upstream paths and diffs, Methodrail skill path plus linked references, `UPSTREAM.md` Methodrail-changes notes, capability owner, and the import rules.

Worker done predicate: a tailored patch with evidence of relevance, or `SKIP` with a reason.

| Result | Meaning |
|---|---|
| `PASS` | Relevant change adapted; files touched; what was preserved; how it was checked locally |
| `ISSUES` | Relevant but blocked (adaptation conflict, license, router import, missing owner) |
| `SKIP` | No Methodrail behavioral relevance |
| `BLOCKED` | Missing inputs or unreachable upstream content |

Workers may edit only `skills/<assigned>/` except `UPSTREAM.md` revision fields. They must read the diff before editing, never wholesale replace the Methodrail body, preserve Methodrail naming, neighbors, harness hooks, and evidence vocabulary, and keep provenance out of `SKILL.md`.

If two incorporate skills would edit the same file, serialize those workers and resolve the merge in the parent.

## Phase D: Parent merge and provenance

Apply remaining worker patches. Update:

- each incorporated skill's `UPSTREAM.md` (revision, Methodrail-changes, fidelity if it changed)
- `upstreams/<name>.yaml` `last_reviewed_commit` and `last_reviewed_at` **only when every mapped item is `PASS`, `SKIP`, or an explicit deferral**. An empty mapped list counts as resolved after unmapped paths and discoveries have been inspected.
- `THIRD_PARTY_NOTICES.md` only when a notice actually changes
- `references/upstream-skill-matrix.md` only when a mapped skill's classification actually changes

If any mapped item is `ISSUES` or `BLOCKED`, leave `last_reviewed_commit` unchanged unless the user explicitly asks for a partial-review bump and you record that note.

Do not commit, push, or bump the package version.

## Phase E: Verify

1. `npm test` and `npm run validate`.
2. For behavioral or compositional skill edits, run or inspect the relevant eval fixtures or recorded examples. If a live harness run is unavailable, say so.
3. Walk [family integration](../../../docs/family-integration.md) and mark each item.
4. Finish with [verify-change](../../../skills/verify-change/SKILL.md) on the completion claim.

## Report

One in-chat report: preflight status, triage table, worker results, files changed, verification evidence, discoveries left unimported, whether the pin moved, and that the diff is uncommitted.

## Neighbors

```text
Usually follows:              check-upstreams
Often produces:               tailored skill edits; provenance updates; discovery report
Escalate to:                  writing-for-agents, family-integration, verify-change
Avoid combining automatically with: develop, wayfinder, arena
```
