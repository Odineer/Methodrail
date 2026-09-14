# Ponytail integration plan

Status: implemented in v0.9.2. Skill behavior changed through composition into existing owners. No public Ponytail skill.

## Outcome and scope

Compose Ponytail's useful simplicity discipline into Methodrail's existing skills. The governing rule is: make the smallest complete change that meets the user's intent and preserves required behavior. Minimize unnecessary complexity, not line count at the expense of correctness or design.

Include a ban on unnecessary explanatory code comments. Caveman and Graphify remain separately installable tools and are outside this change. Do not add a Ponytail command, hooks, intensity modes, dependency, global router, debt ledger, or branded source markers.

## 1. Establish the exact upstream contribution

Start from the inspected Ponytail revision `356918eba965ee1eac64bd3a7f0dd02108350de5` (MIT). Before implementation, check upstream drift and either retain this baseline explicitly or review the newer diff before changing the pin.

Compare `ponytail`, `ponytail-review`, and `ponytail-audit` against Methodrail's existing principles and the relevant Pstack sources at Methodrail's recorded revision. Trace provenance before attributing a particular minimal-change rule to Pstack. Record which instructions are new, already covered, or conflict with the current methodology.

Classify the three skills as COMPOSE. Skip `ponytail-debt`, `ponytail-gain`, `ponytail-help`, and host activation machinery. Keep provenance outside active skill prompts.

## 2. Write one shared simplicity reference

Add `references/simplicity.md` as the canonical procedure. Keep it short enough for relevant workflows to load without introducing a planning phase.

After understanding the affected flow and acceptance criteria:

1. Exclude speculative additions; fulfill explicit requirements.
2. Look for an existing implementation or established project pattern.
3. Consider standard-library, native-platform, and already-installed capabilities; choose what satisfies semantics and project constraints, rather than enforcing a universal ranking.
4. Add only the implementation and interfaces the present requirement justifies.
5. Address the root cause at its actual owner. A larger coherent change can be necessary when a local patch would duplicate logic or leave other paths broken.
6. Run relevant verification and stop when acceptance is met.

Preserve security, accessibility, error handling, public contracts, justified extension seams, and testability. Never replace the project's testing approach with Ponytail's one-check/no-framework rule. Treat fewer files, lines, dependencies, and abstractions as possible benefits, not success metrics by themselves.

## 3. Define the comment rule precisely

Ban comments that restate visible code, narrate ordinary operations, add decorative section labels, or explain confusing naming that should instead be improved. Do not add `ponytail:` markers or speculative TODOs.

Prefer clear names, straightforward control flow, and executable constraints. Retain concise comments when they convey information the code cannot reasonably express: a non-obvious reason, external constraint, compatibility workaround, units or domain assumptions, or a necessary invariant. Preserve license notices, tool/compiler directives, and required public documentation.

Apply the rule to new and materially changed code. Review redundant comments within the requested diff; do not sweep unrelated files or delete useful comments to meet a quota. Architecture-sketch placeholders and rationale comments need context-specific treatment, not blanket removal.

## 4. Connect existing capability owners

| File / owner | Intended change |
|---|---|
| `references/principles.md` | Link the existing smallest-complete-change principle to the shared reference. |
| `skills/develop/SKILL.md` | Apply the simplicity check after acceptance criteria and before implementation; include the comment rule. |
| `skills/codebase-design/SKILL.md` | Compose reuse and necessity checks with existing depth and deletion tests; preserve justified seams. |
| `skills/refactor/SKILL.md` | Apply the rule to the selected target without expanding cleanup scope. |
| `skills/diagnosing-bugs/SKILL.md` | Reinforce root-cause scope only if the audit finds a gap; avoid duplicating existing diagnosis instructions. |
| `skills/code-review/SKILL.md` | Add actionable unnecessary-complexity and redundant-comment checks to Standards. Preserve the Standards/Spec split. |
| `skills/improve-codebase-architecture/SKILL.md` | Add reuse, native-capability, and unnecessary-layer candidates to the existing survey; rank by justified benefit and risk, not deleted lines. |

Use short conditional pointers instead of repeating the ladder. Do not add another review axis, require a repository survey for a local edit, or alter skill discovery flags. Check adjacent TDD and architecture references for contradictions; edit only confirmed conflicts. Keep permanent host context unchanged unless the implementation demonstrates a specific gap that warrants it.

## 5. Record composition and attribution

Add `upstreams/ponytail.yaml` with repository, reviewed SHA/date, MIT copyright, and adoption boundaries. Update `THIRD_PARTY_NOTICES.md`, `references/upstream-skill-matrix.md`, and affected skills' `UPSTREAM.md` files. Preserve their existing Matt/Pstack provenance and add Ponytail as a composed contribution with explicit fidelity deviations.

Update `references/capability-map.md` to show composed origin without adding a new owner. Add Ponytail to README origins and describe its contribution accurately. Update composition documentation only where needed to explain ownership. Do not claim measured improvement before live evaluation.

## 6. Evaluate both overbuilding and oversimplifying

Add focused behavioral, composition, fidelity, and pressure cases using the existing eval structure:

| Case | Required behavior |
|---|---|
| Existing helper fully meets the requirement | Reuse it; no parallel implementation or unnecessary dependency. |
| Native/stdlib option misses a required semantic | Preserve the requirement and choose the sufficient implementation. |
| Bug has several callers | Fix the real shared cause and verify affected behavior; no symptom-only patch. |
| Abstraction supports a real contract or test seam | Retain it when justified; no automatic deletion based on implementation count. |
| Small edit alongside unrelated cleanup opportunities | Complete the bounded edit without extra workflows or cleanup. |
| Time pressure on security/accessibility/error handling | Preserve required safeguards and meaningful verification. |
| Mixed redundant and useful comments | Remove/avoid restatements; retain rationale, directives, and required documentation. |
| Request explicitly requires a complex behavior | Deliver it; do not substitute an easier feature without agreement. |
| Review finds no unnecessary complexity | Report no such findings; do not turn that into an unqualified shipping claim. |

Include a negative routing check: simplicity requests use existing owners and do not activate a new Ponytail workflow. Confirm reference loading stays proportional and the existing tiny-change path remains cheap.

Run a small paired live pilot comparing current Methodrail with the proposed composition on reuse, root-cause repair, justified complexity, and comment judgment. Use fresh contexts and the same host/model and task conditions for each pair. Record completion, correctness, scope, verification, comments, and overhead. Label unavailable or inconclusive runs honestly. Constructed examples and `npm run eval` alone do not prove live agent improvement.

## 7. Validation and completion

Run `npm test` and `npm run validate` while iterating, then `npm run check` for the completed slice and `npm run check-upstreams` for provenance. Regenerate host projections with `npm run project-hosts` only if the family invariant changes. Inspect the final diff for duplicated guidance, accidental upstream changes, and unrelated cleanup.

The integration is complete when existing workflows apply the new discipline without losing requirements or verification, comment cases distinguish useful rationale from restatement, attribution is accurate, and required checks pass. Publish the live pilot's actual outcome separately from structural validation; resolve any demonstrated behavior regressions before calling the integration ready.

## Implementation order

1. Upstream comparison and shared reference, including comment policy.
2. Development/design/refactor connections and focused behavioral cases.
3. Review/survey connections and composition/pressure cases.
4. Provenance, documentation, full checks, and paired live pilot.

No implementation, installation, commit, or publication is part of creating this plan.
