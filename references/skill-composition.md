# Skill composition

Skills are members of one Methodrail family. Organize them by functional role, not upstream origin.

Share infrastructure aggressively. Compose procedures conservatively. A skill should invoke or suggest another skill only when that additional procedure materially reduces uncertainty, reduces risk, provides missing evidence, or creates reusable value.

Invocation is two layers. **Host discovery** (`disable-model-invocation`) decides whether mixed intent may load a skill. **Parent composition** decides whether an already-active skill may load a named skill when its procedure's conditions match. Explicit skills are workflow-callable, not human-only. `interrogate` is suggest-only: name it and wait. Canonical rules: [SKILL-MECHANICS](../skills/writing-for-agents/SKILL-MECHANICS.md).

Do not turn every task into:

```text
how → observe → domain-modeling → wayfinder → architect
→ prototype → tdd → blast-radius → code-review → interrogate → reflect
```

That would be a failure.

## One workflow owner at a time

`/develop` owns the feature lifecycle. Inside it, `wayfinder`, `architect`, `prototype`, and `tdd` are bounded operators. They must not independently restart another full development lifecycle. Under `develop`, `architect` returns alternatives, a recommendation, and unresolved questions; it does not implement. [Simplicity](simplicity.md) is a shared reference those owners load when considering a helper, dependency, or abstraction, assessing complexity, or deciding whether this change made something unused. Mechanical edits skip the procedure while retaining comment discipline and change-created cleanup. It is not a workflow, command, or extra review axis.

`/debug` owns debugging. `diagnosing-bugs` owns the diagnosis procedure inside it. `runtime-forensics` is an escalation operator. `verify-change` is an evidence gate.

Avoid process recursion such as develop → wayfinder → architect → full develop → review → another workflow.

## Communicate through artifacts

A later skill should reuse outputs created by an earlier skill where relevant. Do not force one skill to invoke another solely so that every Methodrail skill appears in the process.

```text
how                    → implementation understanding
observe                → runtime evidence
why                    → historical rationale
domain-modeling        → vocabulary + invariants
prototype              → empirical evidence
wayfinder              → decision map/tickets
architect              → architecture decision
tdd                    → executable behavioral evidence
verify-change          → fresh verification evidence
code-review            → findings
show-me-your-work      → operational TSV trail; ADR only via the three-part gate
reflect                → learning candidates; sole writer of typed notes after approval
handoff                → bounded continuity artifact
```

Use an ephemeral result when future reuse is unlikely. Persist durable artifacts only when value is clear.

Worth preserving: domain terminology, consequential decisions, surprising stable behavior, known recurring failures, expensive runtime discovery, project verification procedures.

Usually not: ordinary source summaries, one-off local variable behavior, temporary hypotheses, trivial implementation detail.

## Functional roles

### Harness

`methodrail-init`, `create-verification-skill`, `maintain-verification-skill`

### Understand

`how`, `observe`, `why`, `research`, `domain-modeling`

### Decide

`grill-with-docs`, `wayfinder`, `prototype`, `architect`

### Design / act

`codebase-design`, `improve-codebase-architecture`, `tdd`, `diagnosing-bugs`

### Assure

`verify-change`, `code-review`, `blast-radius`, `interrogate`

### Scale / specialize

`arena`, `swarm`, `runtime-forensics`, `trace-forensics`, `performance`, `hillclimb`, `visual-parity`

### Continuity / learning

`handoff`, `show-me-your-work`, `reflect`, `writing-for-agents`

These are functional groupings inside one Methodrail family. Do not expose upstream families in user-facing organization.

## Cheap path first

```text
deterministic tool
↓
local source inspection
↓
single skill
↓
isolated subagent
↓
parallel exploration
↓
competing candidates
↓
multi-model adversarial review
```

Only move downward when the current level cannot reliably resolve the problem or risk justifies escalation.

## Parallel semantics

Keep these distinct. Do not introduce a generic "parallelize everything" abstraction.

```text
swarm              = partition independent work
arena              = multiple candidates for the same problem
interrogate        = independent adversarial review
how explorers      = partition understanding
code-review axes   = independent review dimensions
```

## Multi-agent cost gate

Guidance, not a scheduler. Explicit user invocation remains allowed.

| Rigor | Parallel posture |
|---|---|
| 0–1 | Prefer one context |
| 2 | Isolated subagents only where they improve context quality or independence |
| 3 | Parallel exploration may be justified |
| 4 | Arena may be justified; name `interrogate` and wait |
| 5 | Strong independent evidence/review is expected where available |

See [rigor](rigor.md) and [host capabilities](host-capabilities.md).

## Proportional examples

### Tiny change

```text
rename → inspect → edit → deterministic verification
```

### Normal feature

```text
develop → relevant understanding → acceptance criteria → tdd → verify
```

### Runtime bug

```text
debug → diagnosing-bugs → observe → runtime-forensics only if needed
→ regression evidence → fix → verify
```

### Large uncertain change

```text
develop → wayfinder → domain-modeling → how → architect
→ prototype empirical unknowns → implementation → blast-radius
→ code-review → verify
→ name interrogate if risk warrants; wait
```

## Decision ladder

Operational TSV rows and durable ADRs are one ladder, not two competing stores. `show-me-your-work` owns the six-column trail. `domain-modeling` / `grill-with-docs` offer ADRs through the shared [decision-record](protocols/decision-record.md) gate. Do not auto-promote.

## Knowledge and verification

Feature maps may link canonical project knowledge. They do not copy claims and they do not write notes. Fresh verification evidence may feed `reflect`; it never crosses the durable knowledge boundary automatically.

## Control planes

Methodrail-native workflow skills remain the primary lifecycle entrypoints. Do not import or activate `ask-matt`, `poteto-mode`, `using-superpowers`, or Ponytail commands/hooks as global routers. Do not let `wayfinder`, `architect`, or other rich operators become global control planes either.

See [capability map](capability-map.md) for canonical ownership.
