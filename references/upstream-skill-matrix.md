# Upstream skill matrix

Classification of considered upstream skills. Decisions: **ADOPT** (substantially intact), **ADAPT** (meaningful Methodrail integration), **COMPOSE** (reused inside another canonical skill), **HOST-SPECIFIC** (not portable enough), **SKIP**.

Inspected revisions: [matt-pocock.yaml](../upstreams/matt-pocock.yaml), [pstack.yaml](../upstreams/pstack.yaml), [superpowers.yaml](../upstreams/superpowers.yaml), [ponytail.yaml](../upstreams/ponytail.yaml), [karpathy-guidelines.yaml](../upstreams/karpathy-guidelines.yaml).

## mattpocock/skills

| Skill | Purpose | Decision | Canonical Methodrail capability | Reason | Host requirements |
|---|---|---|---|---|---|
| domain-modeling | Ubiquitous language, glossary, ADRs | ADAPT | `domain-modeling` | Stronger than Methodrail's version; glossary location made project-native | portable |
| diagnosing-bugs | Feedback-loop diagnosis | ADAPT | `diagnosing-bugs` | Won comparative review vs Superpowers and Methodrail | portable; HITL script optional |
| tdd | Red-green vertical slices at seams | ADAPT | `tdd` | Best seam/anti-pattern guidance; compatible with Methodrail's "not only TDD" rule | portable |
| codebase-design | Deep modules / seams | ADAPT | `codebase-design` | Distinct from `architect` | portable; DESIGN-IT-TWICE prefers subagents |
| code-review | Standards vs Spec axes | ADAPT | `code-review` | Two-axis split is the leaf; `/review` orchestrates | subagent-optional |
| grill-with-docs | Interview + glossary/ADRs | ADAPT | `grill-with-docs` | Composes grilling; explicit only | portable |
| grilling | Design-tree interview | COMPOSE | inside `grill-with-docs` | Avoid a second interview skill | portable |
| wayfinder | Decision-ticket map through fog | ADAPT | `wayfinder` | Operational decision frontier | tracker optional; local markdown fallback |
| prototype | Throwaway logic/UI experiment | ADAPT | `prototype` | Plus Methodrail evidence record | portable |
| research | Primary-source research | ADAPT | `research` | Distinct from how/why/observe | subagent-optional |
| improve-codebase-architecture | Hot-spot deepening hunt | ADAPT | `improve-codebase-architecture` | Distinct from `architect` | portable |
| to-spec | Crystallize resolved intent | ADAPT | `to-spec` | Not a duplicate of grilling | tracker optional |
| to-tickets | Tracer-bullet tickets | ADAPT | `to-tickets` | Tracker behavior isolated | tracker optional |
| implement | Spec/tickets → TDD → review | SKIP | `/develop` | Competes with Methodrail lifecycle ownership; disciplines reused | — |
| ask-matt | Router over Matt skills | SKIP | Methodrail workflows | Competing global control plane | — |
| setup-matt-pocock-skills | Per-repo tracker/domain setup | SKIP | `methodrail-init` | Org-specific bootstrap | — |
| triage | Issue-tracker state machine | SKIP | — | Tracker-specific, not central | issue-tracker |
| resolving-merge-conflicts | Intent-traced merge | SKIP | — | Useful but not core Methodrail | git |
| wizard | HITL bash wizard | SKIP | — | Personal/ops helper, not core | runtime-tool |
| writing-for-agents | Agent-facing document design | ADAPT | `writing-for-agents` | Current canonical skill; subsumes writing-great-skills | portable |
| handoff | Cross-session continuity document | ADAPT | `handoff` | Operational Methodrail handoff transition; explicit-only | portable |
| grill-me / remaining productivity/* | Personal productivity | SKIP | — | Not central | — |
| in-progress/* / misc/* | Unstable or personal | SKIP | — | Do not import incomplete skills | — |

## pstack (cursor/plugins)

| Skill | Purpose | Decision | Canonical Methodrail capability | Reason | Host requirements |
|---|---|---|---|---|---|
| how | Question-driven implementation map | ADAPT | `how` | Stronger than Methodrail how | subagent-optional |
| why | Historical evidence categories | ADAPT | `why` | Stronger epistemics | MCP-optional; git required |
| blast-radius | Prove safety facts beyond grep | ADAPT | `blast-radius` | More than static dependency search | portable |
| architect | Ground, sketch alternatives, implement | ADAPT | `architect` | Distinct from codebase-design | subagent/arena optional |
| arena | Compete on the same artifact | ADAPT | `arena` | Not a generic spawn-agents skill | subagent-required for full fidelity; degrades |
| swarm | Partition independent slices | ADAPT | `swarm` | Distinct from arena | cloud-optional; local subagents degrade |
| interrogate | Independent multi-reviewer verdict | ADAPT | `interrogate` | Replaces Methodrail reimplementation | multi-model-optional |
| create-verification-skill | Interview repo, generate verify skill | ADAPT | `create-verification-skill` | Discovery and application are caller-scoped; init still confirms before writes | runtime-tool when generating live drive |
| maintain-verification-skill | Source + live coverage of feature map | ADAPT | `maintain-verification-skill` | Full audit preserved; task-scoped mode does not ship a PR | runtime-tool; subagent-optional |
| show-me-your-work | Decision/evidence TSV | ADAPT | `show-me-your-work` | Transcript ≠ decision log | portable |
| reflect | Mine session for skill edits | ADAPT | `reflect` | Candidates only, no auto-rules | subagent/multi-model-optional |
| runtime-forensics playbook | Live instrumentation | ADAPT | `runtime-forensics` | Escalation operator | runtime-tool-required |
| trace-forensics playbook | Diagnose from capture | ADAPT | `trace-forensics` | Distinct from live forensics | portable (artifact parser) |
| perf-issue playbook | Measured perf | ADAPT | `performance` | Measurement-first | runtime-tool-optional |
| hillclimb playbook | One-change metric loop | ADAPT | `hillclimb` | Distinct from one-off perf | portable |
| visual-parity playbook | Image-diff equivalence | ADAPT | `visual-parity` | Rendered comparison | browser-required |
| prototype playbook | Specialized probes | COMPOSE | `prototype` reference | Not a second prototype skill | — |
| tdd | pstack TDD | SKIP | `tdd` (Matt) | Duplicate TDD owner | — |
| poteto-mode | Global router + playbooks | SKIP | Methodrail workflows | Competing control plane | Cursor-specific |
| setup-pstack | Model-role assignment | SKIP | — | Host bootstrap | Cursor-specific |
| principle-* | First-principles library | SKIP | Methodrail `references/` | Would duplicate composition language | — |
| automate-me / unslop / bro / no-comments / teach / recall / figure-it-out / technical-writing / typescript-best-practices | Style, personal, or language-specific | SKIP | — | Not core Methodrail | mixed |
| benny automations / Graphite shipping playbooks | Org release flows | SKIP | — | Host/org-specific | GitHub/Graphite |

## obra/superpowers

| Skill | Purpose | Decision | Canonical Methodrail capability | Reason | Host requirements |
|---|---|---|---|---|---|
| verification-before-completion | Hard evidence gate | ADAPT | `verify-change` | Strongest completion gate; Methodrail name kept | portable |
| systematic-debugging | Four-phase root cause | COMPOSE | inside `diagnosing-bugs` | Lost the public-skill comparison; tracing/pressure kept | portable |
| test-driven-development | Iron-law TDD | COMPOSE | inside `tdd` references | Duplicate TDD; pressure/honesty rules reused | portable |
| using-superpowers | Global skill bootstrap | SKIP | Methodrail workflows | Competing control plane | — |
| brainstorming / writing-plans / executing-plans | Planning OS | SKIP | `wayfinder`, `/develop` | Overlapping orchestration | — |
| requesting-code-review / receiving-code-review | Review handshake | SKIP | `/review`, `code-review` | Overlap | — |
| subagent-driven-development / dispatching-parallel-agents | Parallel execution OS | SKIP | `swarm`, `arena` | Overlapping orchestration | subagent-required |
| using-git-worktrees | Worktree isolation | SKIP | arena/swarm output paths | Helper, not a product skill | git |
| finishing-a-development-branch / writing-skills | Superpowers packaging | SKIP | — | Org-specific | — |

## DietrichGebert/ponytail

| Skill | Purpose | Decision | Canonical Methodrail capability | Reason | Host requirements |
|---|---|---|---|---|---|
| ponytail | Reuse, native-capability, and necessity ladder for implementation | COMPOSE | `references/simplicity.md` via `develop`, `codebase-design`, `refactor` | Useful simplicity discipline without a competing workflow | portable |
| ponytail-review | Diff review for unnecessary complexity | COMPOSE | inside `code-review` Standards | Complexity hunt belongs on the existing Standards axis | portable |
| ponytail-audit | Repo-wide over-engineering survey | COMPOSE | inside `improve-codebase-architecture` | Survey owner already exists; rank by benefit and risk, not deleted lines | portable |
| ponytail-debt / ponytail-gain / ponytail-help | Debt ledger, scoreboard, command help | SKIP | — | Markers, metrics, and host commands are out of scope | mixed |
| intensity modes / hooks / host routers | Always-on `/ponytail` activation | SKIP | Methodrail workflows | Competing control plane | host-specific |

Fidelity deviations for the composed skills: no intensity modes; no `ponytail:` markers; no one-check/no-framework testing rule; no "ship the lazy subset" substitution; no "Lean already. Ship." verdict; retain justified contract and test seams. Comparison: [ponytail-upstream-comparison.md](../docs/internal/ponytail-upstream-comparison.md). pstack `no-comments` remains SKIP; Methodrail's comment rule is a separate composition.

## multica-ai/andrej-karpathy-skills

| Skill | Purpose | Decision | Canonical Methodrail capability | Reason | Host requirements |
|---|---|---|---|---|---|
| karpathy-guidelines | Surgical edits, assumptions, verifiable goals | COMPOSE | `references/simplicity.md` and `references/decision-frontier.md` via `develop`, `refactor`, `diagnosing-bugs`, `code-review` | Incremental cleanup, hunk-scope, and assumption handling without a competing workflow | portable |
| CLAUDE.md / CURSOR.md / always-on Cursor rule / plugin marketplace | Host installation and global activation | SKIP | Methodrail workflows | Competing control plane | host-specific |

Fidelity deviations: no stop-when-unclear; no single-use-abstraction ban; no 200-to-50 rewrite metric; no skip of "impossible" failure paths; no assumption ledger; `verify-change` stays stronger than compact success-loop examples. Comparison: [karpathy-upstream-comparison.md](../docs/internal/karpathy-upstream-comparison.md).
