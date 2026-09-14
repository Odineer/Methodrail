# Ponytail upstream comparison

Inspected revision: `356918eba965ee1eac64bd3a7f0dd02108350de5` (HEAD as of 2026-09-13; docs-only logo rename). License: MIT, Copyright (c) 2026 DietrichGebert.

Compared `ponytail`, `ponytail-review`, and `ponytail-audit` against Methodrail principles, the named capability owners, and pstack at Methodrail's recorded revision. Classification: **COMPOSE**. Skills are not shipped. Caveman and Graphify stay out of this change.

## Provenance of "smallest change"

Methodrail already states: "Make the smallest change that fully meets the intent" (`references/principles.md`). That line is Methodrail's own principle, not an import from Ponytail.

pstack's prototype playbook mentions "the Laziness Protocol's smallest change" as a rule that **inverts** for prototypes. pstack `principle-*` skills were already **SKIP**. Do not attribute Methodrail's smallest-complete-change rule to pstack.

Ponytail contributes an operational ladder (reuse, native capability, necessity, shared-owner root cause) and a complexity-hunt vocabulary, not the existence of a smallest-change principle.

## New (compose)

| Instruction | Methodrail owner |
| --- | --- |
| Look for an existing helper/pattern before writing a parallel one | `references/simplicity.md` via `develop`, `codebase-design`, `refactor` |
| Consider stdlib / native / already-installed capabilities without a universal ranking | `references/simplicity.md` |
| Fix the owner of the violated contract; one triggering caller does not imply caller ownership | `diagnosing-bugs` Phase 5; `simplicity.md` owner step |
| Hunt unnecessary complexity: reinvented stdlib, native-capable deps, speculative layers | `code-review` Standards; `improve-codebase-architecture` survey |
| Ban restatement / narration comments; keep rationale, directives, required docs | `references/simplicity.md` comment rule via `develop` and `code-review` |
| Report no unnecessary-complexity findings without an unqualified ship claim | `code-review` |

Ponytail itself marks only `ponytail:` corner-cut comments. The restatement-comment rule is Methodrail's composition. It is not an adoption of skipped pstack `no-comments`.

## Already covered

- Smallest change that meets intent — `references/principles.md`, `develop`, `refactor`
- No speculative features — `tdd`
- Deletion test; one production adapter is a hypothetical seam — `codebase-design`
- Root cause before a patch; no shotgun — `diagnosing-bugs` iron rules (shared-owner *scope* was the gap)
- Cheap path; do not broaden a local request — `develop`, `refactor`, `skill-composition`
- Verification before completion — `verify-change` (stronger than Ponytail's one-check)

## Conflict / skip (fidelity deviations)

- Intensity modes (`lite` / `full` / `ultra`) and always-on persistence
- `/ponytail` command, hooks, host routers, Caveman, Graphify
- `ponytail:` source markers, `ponytail-debt` ledger, `ponytail-gain`, `ponytail-help`
- "Ship the lazy subset and question the rest" — Methodrail delivers the requested behavior
- One-check / no-framework testing — keep the project's TDD and `verify-change`
- "Lean already. Ship." — report no complexity findings; do not treat that as a shipping claim
- Rank candidates by deleted lines — rank by justified benefit and risk
- Auto-delete a single-implementation interface — retain a justified contract or test seam
- "Files exporting one thing" as a delete heuristic — conflicts with deep modules
