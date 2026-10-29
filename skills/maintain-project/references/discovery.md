# Maintenance discovery

Lane detail for [maintain-project](../SKILL.md). This file does not replace specialist procedures.

## Lanes

| Lane | Look for | Reuse |
|---|---|---|
| Architecture | Demonstrated caller burden, repeated structural defects, leaky seams, unnecessary layers in relevant active code | `improve-codebase-architecture` in `survey-only` phase, `codebase-design`, then `refactor` for one selected behavior-preserving change |
| Verification | Stale recipes, broken owned helpers, map omissions, inadequate characterization of selected behavior, and drift in an existing formal check | `maintain-verification-skill` with an explicit action and coverage; `maintain-formal-verification-skill` inspect during audit; [verification lifecycle](../../../references/verification-lifecycle.md); [formal verification](../../../references/formal-verification.md); `verify-change` |
| Build, tooling, and documentation | Broken canonical commands, recurring setup friction, incorrect CI wiring, stale operational instructions, contradictory pointers | Existing deterministic tools and bounded direct repairs. `debug` when a failure needs diagnosis |

Merge duplicate symptoms when evidence supports one shared cause. Do not merge findings only because they touch one file. A baseline product failure, an environmental blocker, documentation drift, and a harness defect stay distinct.

## Finding contract

Each actionable finding contains:

1. A run-local identifier, a category, and a precise target.
2. Evidence pointers and the state or revision they describe. Label inference and observation honestly.
3. Demonstrated cost or failure, and the expected benefit of resolving it.
4. A proposed outcome, the behavior and contracts to preserve, and the likely execution owner.
5. The verification baseline, the required checks, and characterization gaps.
6. Risk, dependencies, qualitative effort, and unresolved choices.
7. A disposition: confirmed, needs investigation, rejected, deferred, resolved, or blocked, as fits the phase.

Confirmed items enter the ranked report. Needs-investigation and speculative items stay out of the repair queue until evidence is enough.

## Architecture

Request `survey-only` from `improve-codebase-architecture`. Take back candidates and evidence. Do not continue into that skill's selection prompt, grilling loop, or implementation during discovery.

Keep delete, deepen, preserve, and reject. Relevance rules, verification-based recommendation strength, and ADR boundaries stay with that skill. An already-deep module and a quiet speculative candidate are not actionable rewrites. High churn alone is not a reason to rewrite a deep module.

## Verification

Name action `inspect` during audit. Name coverage `task-scoped` unless the user asked for a full verification audit. Broad project maintenance does not request a full audit. Formal drift discovered in that lane uses the same inspect action on `maintain-formal-verification-skill`. Do not generate a proof during audit.

`inspect` reports proposed corrections and gaps. It writes none of the owned verification files and never reports `changed`.

When no verification skill exists, record that fact and assess existing scripts and control evidence. Do not generate a skill during discovery. An existing formal check is a separate procedure. Record its drift through inspect. Do not generate a proof because the app skill is absent.

A source-only sample is partial coverage. Say so. Full-audit inspection still requires every mapped feature to be exercised or individually blocked.

## Tooling and documentation

Prefer a failing canonical command, a wrong pointer, or a broken owned check over a style preference. Record the command, the exit status, and the path. Distinguish a broken instruction from a product failure by running the product path the instruction claims to cover.

## Coverage statement

State lanes, paths, and features inspected; areas skipped; checks executed; and blockers. Do not turn a partial pass into a project-wide clean claim.
