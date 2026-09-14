# Upstreams

Methodrail is a curated distribution. These records are **metadata only**. Do not vendor entire upstream repositories into this tree.

Tracked sources:

| Record | Repository | Role |
|---|---|---|
| [matt-pocock.yaml](matt-pocock.yaml) | `mattpocock/skills` | Engineering operators: domain, TDD, diagnosis, review, wayfinder |
| [pstack.yaml](pstack.yaml) | `cursor/plugins` (`pstack/`) | Understanding, architecture, verification, forensics, parallel operators |
| [superpowers.yaml](superpowers.yaml) | `obra/superpowers` | Verification gate and debugging pressure resistance |
| [ponytail.yaml](ponytail.yaml) | `DietrichGebert/ponytail` | Composed simplicity discipline; no public Ponytail skill |
| [karpathy-guidelines.yaml](karpathy-guidelines.yaml) | `multica-ai/andrej-karpathy-skills` | Composed change-created cleanup, hunk scope, and consequential assumptions; no public karpathy-guidelines skill |

Each adopted or derived skill keeps a short `UPSTREAM.md` beside `SKILL.md`. Provenance stays out of the skill prompt.

See [upstream skill matrix](../references/upstream-skill-matrix.md), [capability map](../references/capability-map.md), and [upstream maintenance](../docs/upstream-maintenance.md). To incorporate a drifted source, use [sync-upstream](../maintainer/skills/sync-upstream/SKILL.md).
