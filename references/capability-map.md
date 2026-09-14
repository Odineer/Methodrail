# Capability map

Canonical Methodrail surface. One owner per capability. Provenance is metadata, not a visible namespace.

| Capability | Canonical skill | Origin | Invocation | Escalates to | Used by |
|---|---|---|---|---|---|
| Project harness init | `methodrail-init` | Methodrail-native | explicit | `create-verification-skill` | humans |
| Existing-system investigation | `investigate` | Methodrail-native | explicit | `how`, `why`, `observe`, `research`, `prototype`, `blast-radius` | humans |
| Feature delivery | `develop` | Methodrail-native + Ponytail composed + Karpathy-inspired guidelines composed | explicit | `grill-with-docs`, `domain-modeling`, `wayfinder`, `architect`, `prototype`, `tdd`, `code-review`, `verify-change`, `blast-radius` | humans |
| Failure diagnosis and fix | `debug` | Methodrail-native | explicit | `diagnosing-bugs`, `observe`, `runtime-forensics`, `trace-forensics`, `performance`, `hillclimb`, `tdd`, `verify-change` | humans |
| Behavior-preserving restructure of a selected target | `refactor` | Methodrail-native + Ponytail composed + Karpathy-inspired guidelines composed | explicit | `how`, `codebase-design`, `blast-radius`, `code-review`, `verify-change` | humans |
| Change review workflow | `review` | Methodrail-native | explicit | `code-review`, `blast-radius`, `verify-change` | humans |
| Current codebase understanding | `how` | pstack | model-invoked | `observe` | `investigate`, `develop`, `refactor`, `architect` |
| Historical motivation | `why` | pstack | model-invoked | — | `investigate`, `architect` |
| Live behavior | `observe` | Methodrail-native | model-invoked | `runtime-forensics` | `investigate`, `debug`, `verify-change` |
| External/reference research | `research` | Matt Pocock | model-invoked | — | `investigate`, `wayfinder` |
| Impact beyond the diff | `blast-radius` | pstack | model-invoked | `arena` (wide changes) | `develop`, `debug`, `refactor`, `review` |
| Ubiquitous language | `domain-modeling` | Matt Pocock | model-invoked | ADR via same skill | `develop`, `grill-with-docs`, `wayfinder` |
| Ambiguous requirements interview | `grill-with-docs` | Matt Pocock | explicit | `domain-modeling` | `develop`, `wayfinder` |
| Large uncertain planning | `wayfinder` | Matt Pocock | explicit | `grill-with-docs`, `research`, `prototype` | `develop` |
| Empirical experiment | `prototype` | Matt Pocock + Methodrail evidence semantics | explicit | — | `investigate`, `develop`, `wayfinder` |
| Architecture decision exercise | `architect` | pstack | explicit | `how`, `why`, `arena` | `develop` |
| Deep-module design vocabulary | `codebase-design` | Matt Pocock + Ponytail composed | model-invoked | `architect` when a decision exists | `tdd`, `refactor`, `improve-codebase-architecture` |
| Codebase-wide architecture survey and candidate selection | `improve-codebase-architecture` | Matt Pocock + Ponytail composed | explicit | `grill-with-docs`, `codebase-design` | humans |
| Test-first implementation | `tdd` | Matt Pocock | model-invoked | `codebase-design`, `verify-change` | `develop`, `debug` |
| Baseline bug diagnosis | `diagnosing-bugs` | Matt Pocock + Ponytail composed + Karpathy-inspired guidelines composed | model/workflow invoked | `runtime-forensics`, `trace-forensics`, `performance` | `debug` |
| Completion verification | `verify-change` | Superpowers-derived | model/workflow invoked | `observe`, project verify skill | all workflows |
| Two-axis diff review | `code-review` | Matt Pocock + Ponytail composed + Karpathy-inspired guidelines composed | model-invoked | — | `review`, `develop` |
| Adversarial independent review | `interrogate` | pstack | explicit / high rigor | — | `review` (suggested only) |
| Competing candidates | `arena` | pstack | explicit | `verify-change` | `architect`, `blast-radius` |
| Partitioned parallel coverage | `swarm` | pstack | explicit | — | humans, large investigations |
| Durable spec from resolved intent | `to-spec` | Matt Pocock | explicit | — | `develop` after grilling |
| Tracer-bullet tickets | `to-tickets` | Matt Pocock | explicit | `blast-radius` for wide refactors | `develop` |
| Live-process instrumentation | `runtime-forensics` | pstack playbook | explicit | `diagnosing-bugs` | `debug` |
| Captured artifact diagnosis | `trace-forensics` | pstack playbook | explicit | `diagnosing-bugs`, `performance` | `debug` |
| Measured perf investigation | `performance` | pstack playbook | explicit | `hillclimb`, `architect` | `debug` |
| Iterative metric optimization | `hillclimb` | pstack playbook | explicit | `show-me-your-work` | `debug` |
| Rendered visual equivalence | `visual-parity` | pstack playbook | explicit | — | humans |
| Project verify skill generation | `create-verification-skill` | pstack | explicit | `maintain-verification-skill` | `methodrail-init` |
| Verify-skill upkeep | `maintain-verification-skill` | pstack | explicit | `create-verification-skill` if missing | humans |
| Compact decision trail | `show-me-your-work` | pstack | explicit | — | `hillclimb`, long runs |
| Session lessons as candidates | `reflect` | pstack | explicit | knowledge / skill / structural-enforcement candidates | humans |
| Cross-session continuity | `handoff` | Matt Pocock | explicit | — | humans, long sessions, `prototype` round-trips |
| Agent-facing document design | `writing-for-agents` | Matt Pocock | model-invoked | skill mechanics | `methodrail-init`, skill maintenance, harness generation, verification-skill generation, agent-facing docs |

Typical artifacts, not process nesting: `how` → implementation understanding; `observe` → runtime evidence; `why` → historical rationale; `domain-modeling` → vocabulary; `prototype` → empirical evidence; `wayfinder` → decision map; `architect` → decision; `tdd` → behavioral tests; `verify-change` → fresh verification; `code-review` → findings; `show-me-your-work` → trail; `reflect` → learning candidates; `handoff` → continuity artifact.

## Ownership decisions

- **Debugging baseline:** `diagnosing-bugs` (Matt). Superpowers `systematic-debugging` and the previous Methodrail skill are not public. Superpowers tracing/pressure techniques are composed into `diagnosing-bugs`.
- **TDD:** `tdd` (Matt). Superpowers TDD and pstack TDD are not public. Superpowers pressure material is a `tdd` reference. Verification-without-TDD remains `verify-change`.
- **Prototype:** one public `prototype`. Matt's throwaway branches plus Methodrail evidence semantics. pstack prototype playbook is a reference, not a competing skill.
- **Invocation:** `explicit` means host discovery is off (`disable-model-invocation: true`). Workflows and other parent skills may still load that skill when their procedure's conditions match. `interrogate` is suggest-only: name it and wait. Canonical rules: [SKILL-MECHANICS](../skills/writing-for-agents/SKILL-MECHANICS.md).
- **Review:** `/review` is the workflow; `code-review` is the two-axis leaf. `interrogate` is suggest-only.
- **Implement:** Matt `implement` is not shipped. `/develop` owns the lifecycle and reuses `tdd` / `code-review` / `verify-change`.
- **Simplicity:** `references/simplicity.md` is the shared procedure, including change-created cleanup. There is no public Ponytail or karpathy-guidelines skill, command, or review axis. Compose into `develop`, `codebase-design`, `refactor`, `diagnosing-bugs`, `code-review`, and `improve-codebase-architecture`.
- **Assumptions:** `references/decision-frontier.md` owns uncertainty resolution, including consequential assumptions. Do not add an assumption ledger or a public clarification skill.
- **Architecture maintenance:** `improve-codebase-architecture` owns codebase-wide discovery and selection. `/refactor` executes one selected behavior-preserving change. A survey-shaped `/refactor` request routes to `improve-codebase-architecture` without starting implementation.
- **Control planes:** `poteto-mode`, `ask-matt`, `using-superpowers`, `setup-*` global routers, and Ponytail commands/hooks are not imported.
- **Skill authoring:** `writing-for-agents` subsumes the earlier `writing-great-skills` concept. Do not ship both.
- **Handoff:** operational skill for Methodrail's handoff context transition. Explicit-only.
