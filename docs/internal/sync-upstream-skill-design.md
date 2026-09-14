# sync-upstream: maintainer skill design

Status: implemented. Preflight JSON and the maintainer skill exist; this document is the design record, not a claim that every upstream is currently in sync.

## 1. Objective

Give Methodrail maintainers a repeatable, evidence-driven way to keep adapted skills current with their upstream sources. Today `npm run check-upstreams` reports drift and `docs/upstream-maintenance.md` describes the manual import loop, but nothing turns "upstream changed" into a verified, Methodrail-shaped update.

The skill inspects recent upstream changes, judges relevance to Methodrail, tailors what belongs here, verifies the result, and stops for human review.

## 2. Accepted product decisions and boundaries

- **Depth**: inspect, judge relevance, apply tailored edits in-repo, update provenance, run checks and relevant evals, then stop before commit. No commit, push, or release step.
- **Scope per invocation**: one upstream source (one `upstreams/*.yaml` record).
- **Packaging**: maintainer-only. The skill lives outside the plugin skill tree so consumers never receive it. `.cursor-plugin/plugin.json` keeps pointing at `./skills/` only.
- **Orchestration**: parent plus one subagent worker per changed Methodrail skill, in the Superpowers/`swarm` partition style. Subagents are host-optional with a sequential fallback.
- **Discovery**: new upstream skills and existing `SKIP` / `COMPOSE` rows are reported only. The skill never adopts a new capability mid-sync.
- Never blind-overwrite a Methodrail adaptation.
- No new router, workflow engine, daemon, or maintainer runtime. `CONTRIBUTING.md` remains the policy owner; this skill is the operator.

## 3. Architecture

Entry is explicit, naming one upstream (for example `/sync-upstream matt-pocock`).

```text
user names one upstream
↓
deterministic preflight JSON (SHA range, changed paths, mapped skills, discoveries)
↓
parent triages: incorporate | skip-irrelevant | discovery-only
↓
one worker per mapped skill needing incorporation
↓
parent applies and merges tailored edits, updates provenance
↓
verify: tests, validate, relevant evals, family-integration checklist
↓
stop before commit; report for human review
```

Skill location: `maintainer/skills/sync-upstream/SKILL.md`.

## 4. Deterministic preflight

The preflight extends the existing upstream script rather than adding a parallel tool. Human default output stays unchanged.

```bash
node scripts/check-upstreams.mjs --upstream matt-pocock --format json
# human default remains: npm run check-upstreams
```

Payload for one upstream:

```json
{
  "upstream": "matt-pocock",
  "repository": "https://github.com/mattpocock/skills",
  "imported": "<last_reviewed_commit>",
  "head": "<current HEAD or null>",
  "status": "current|changed|unreachable",
  "mapped": [
    {
      "methodrail_skill": "verify-change",
      "origin_path": "skills/verification-before-completion",
      "decision": "ADAPT",
      "upstream_sha_recorded": "...",
      "changed_paths": ["skills/verification-before-completion/SKILL.md"],
      "action_hint": "review"
    }
  ],
  "discoveries": [
    {
      "upstream_path": "skills/new-thing",
      "matrix_decision": "SKIP|COMPOSE|unlisted",
      "note": "report only"
    }
  ],
  "unmapped_changes": ["README.md"]
}
```

Mapping is deterministic, with no model judgment:

1. Read `upstreams/<name>.yaml` for repository and `last_reviewed_commit`.
2. Query current HEAD with `git ls-remote`. On failure, emit `status: unreachable` and stop.
3. Collect the changed file list for `imported..head` through a temporary fetch or shallow clone cache.
4. Match changed paths against `Origin:` lines in `skills/*/UPSTREAM.md` for that upstream, and against `references/upstream-skill-matrix.md` rows for discovery classification.
5. Emit `mapped`, `discoveries`, and `unmapped_changes`.

The script writes no skills, makes no relevance judgment beyond path ownership, and never bumps a recorded SHA.

## 5. Parent and worker contracts

The parent owns every decision that touches the Methodrail tree.

- Run the preflight for the named upstream.
- Produce the triage table: `incorporate`, `skip-irrelevant`, `discovery-only`.
- Spawn one worker per `incorporate` skill, in parallel where the host allows, otherwise sequentially.
- Merge worker results into the real tree.
- Update provenance: the skill's `UPSTREAM.md`, `upstreams/*.yaml` SHA and `last_reviewed_at`, and `THIRD_PARTY_NOTICES.md` when a notice actually changes. `references/upstream-skill-matrix.md` changes only when a mapped skill's classification actually changes; a discovery never edits it.
- Run verification and walk the family-integration checklist.
- Report in chat, leaving the diff uncommitted.

Each worker brief stands alone and carries: upstream name, commit range, changed upstream paths and diffs, the Methodrail skill path with its current body and linked references, the Methodrail-changes notes from `UPSTREAM.md`, the capability-map owner, and the import rules from `docs/upstream-maintenance.md`.

Worker done predicate: a tailored patch with evidence of relevance, or a `SKIP` with a reason.

Worker result vocabulary:

| Result | Meaning |
|---|---|
| `PASS` | Relevant change adapted; files touched, what was preserved, how it was checked locally |
| `ISSUES` | Relevant but blocked, for example a conflict with a Methodrail adaptation, a license question, or a router import |
| `SKIP` | Upstream churn with no behavioral relevance to Methodrail |
| `BLOCKED` | Missing inputs or unreachable upstream content |

Worker discipline: read the diff before editing, never wholesale replace a Methodrail skill body, preserve Methodrail naming, neighbor blocks, project-harness hooks and evidence vocabulary, keep provenance out of `SKILL.md`, and stay inside the assigned skill.

When two mapped skills would edit the same file, usually a shared reference, the parent serializes those workers and resolves the merge itself.

## 6. Verification

1. Per incorporated skill: the cheapest honest structural check, which `npm run validate` covers for frontmatter and links.
2. After all workers: `npm test` and `npm run validate`.
3. For behavioral or compositional changes: exercise the relevant eval fixtures or recorded examples, and report the gap explicitly when a live harness run is not available in-session.
4. Walk `docs/family-integration.md` and mark each item.
5. Advance `last_reviewed_commit` only when every mapped item is resolved. An empty mapped list counts as resolved after unmapped paths and discoveries have been inspected. If any item is `ISSUES` or `BLOCKED`, leave the pin alone by default; a partial-review bump requires an explicit note.

## 7. Packaging and documentation

- `maintainer/skills/sync-upstream/` sits outside the plugin `skills/` tree and is not referenced by the plugin manifest.
- Point to it from `docs/upstream-maintenance.md` and from a maintainer pointer in `.methodrail/PROJECT.md`.
- No consumer entry in `references/capability-map.md`; a maintainer-tools note is optional.
- Update the `docs/upstream-maintenance.md` flow to preflight, skill workers, verify, stop.
- Add unit tests for the preflight JSON mapping using fixture `UPSTREAM.md` files and synthetic changed-path lists.

## 8. Done when

The preflight has run for the named upstream, every mapped changed skill is `PASS`, `SKIP`, or deferred with a recorded reason, discoveries are listed rather than imported, verification evidence exists for each completion claim, and the diff is ready for human review and uncommitted.
