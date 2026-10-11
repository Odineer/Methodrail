# Principles

- Understand the existing system before changing it.
- Prefer direct evidence to plausible assumptions.
- State uncertainty instead of hiding it.
- Make the smallest change that fully meets the intent. Procedure: [simplicity](simplicity.md).
- Match investigation and validation effort to risk.
- Turn recurring failures into durable safeguards such as tests, types, checks, or clearer interfaces.

Resolve uncertainty by type:

- current implementation → source exploration;
- actual behavior → observation;
- historical motivation → history;
- empirical technical uncertainty → a bounded prototype;
- domain ambiguity → domain modeling;
- product preference → a human;
- deterministic fact → a deterministic tool.

## pstack principle index

Use these as situational cues, not as a second workflow or a checklist to recite. Apply a cue when its trigger fits; follow the Methodrail owner for the actual procedure. This incorporates pstack's principle library by reference and adaptation rather than shipping 23 competing skills. See the [upstream skill matrix](upstream-skill-matrix.md) and [pstack upstream record](../upstreams/pstack.yaml) for provenance and scope.

| pstack principle | Methodrail owner | Apply when |
| --- | --- | --- |
| laziness-protocol | [simplicity](simplicity.md) | A change can be solved by removing or simplifying existing behavior. |
| foundational-thinking | [architect](../skills/architect/SKILL.md), [domain-modeling](../skills/domain-modeling/SKILL.md) | Choosing core data structures, ownership, or sequencing foundational work. |
| redesign-from-first-principles | [architect](../skills/architect/SKILL.md), [improve-codebase-architecture](../skills/improve-codebase-architecture/SKILL.md) | A requirement is foundational and the current design has accumulated bolted-on fixes. |
| attack-the-premise | [decision frontier](decision-frontier.md), [diagnosing-bugs](../skills/diagnosing-bugs/SKILL.md) | Multiple fixes based on the same assumption have failed. |
| subtract-before-you-add | [simplicity](simplicity.md), [refactor](../skills/refactor/SKILL.md) | Existing dead weight or duplication is making the requested change harder. |
| minimize-reader-load | [context economics](context-economics.md), [writing-for-agents](../skills/writing-for-agents/SKILL.md) | A design or instruction makes readers hold unnecessary layers or hidden state. |
| outcome-oriented-execution | [develop](../skills/develop/SKILL.md), [refactor](../skills/refactor/SKILL.md) | A planned migration or rewrite needs explicit phases and a clear target state. |
| experience-first | [decision frontier](decision-frontier.md), [grill-with-docs](../skills/grill-with-docs/SKILL.md) | Product trade-offs depend on user experience or preference; ask the human where needed. |
| exhaust-the-design-space | [prototype](../skills/prototype/SKILL.md), [arena](../skills/arena/SKILL.md) | Several materially different options remain and the decision justifies comparison. |
| build-the-lever | [structural enforcement](structural-enforcement.md), [swarm](../skills/swarm/SKILL.md) | Repeated or broad work can be made reproducible with a script, check, or partitioned process. |
| model-the-domain | [domain-modeling](../skills/domain-modeling/SKILL.md) | Domain concepts or relationships are otherwise scattered across conditionals. |
| boundary-discipline | [codebase-design](../skills/codebase-design/SKILL.md), [architect](../skills/architect/SKILL.md) | External input crosses into trusted logic or validation ownership is unclear. |
| type-system-discipline | [codebase-design](../skills/codebase-design/SKILL.md), [tdd](../skills/tdd/SKILL.md) | Types can encode an invariant or make invalid states harder to represent. |
| make-operations-idempotent | [methodrail-init](../skills/methodrail-init/SKILL.md), [develop](../skills/develop/SKILL.md) | Operations may be retried, resumed, or run after partial completion. |
| migrate-callers-then-delete-legacy-apis | [develop](../skills/develop/SKILL.md), [refactor](../skills/refactor/SKILL.md) | A migration can move callers and remove obsolete compatibility paths in one coherent wave. Preserve compatibility when an external contract requires it. |
| separate-before-serializing-shared-state | [architect](../skills/architect/SKILL.md) | Multiple actors may write shared state; remove contention before adding coordination when feasible. |
| prove-it-works | [verify-change](../skills/verify-change/SKILL.md), [evidence](evidence.md) | Before completion; verify the real artifact and report what the evidence proves. |
| fix-root-causes | [diagnosing-bugs](../skills/diagnosing-bugs/SKILL.md) | A symptom has a reproducible causal chain that can be fixed at its owner. |
| sequence-verifiable-units | [rigor](rigor.md), [show-me-your-work](../skills/show-me-your-work/SKILL.md) | Work has multiple edits, phases, or deliveries that should each end in a checkable state. |
| test-behavior-not-implementation | [tdd](../skills/tdd/SKILL.md), [verify-change](../skills/verify-change/SKILL.md) | Adding or changing tests; assert the result visible at the relevant seam. |
| guard-the-context-window | [context economics](context-economics.md), [context management](context-management.md) | Raw material is large; reduce or delegate it while keeping decision-ready findings in the main context. |
| never-block-on-the-human | [decision frontier](decision-frontier.md) | Work is reversible and a reasonable assumption lets progress continue. Ask for consequential unresolved preferences and approval for irreversible actions. |
| encode-lessons-in-structure | [structural enforcement](structural-enforcement.md), [reflect](../skills/reflect/SKILL.md) | A recurring lesson can be enforced in code, metadata, or tooling instead of repeated prose. |

These cues do not override Methodrail's evidence standards, proportional rigor, project contracts, or approval boundaries. In particular, prototype and design-space exploration are optional and risk-weighted; TDD is a strong default for suitable production changes, not the only verification method; parallel work is used only when the slices are genuinely independent.

Context is a budget. Keep permanent rules short, load skills and references only when relevant, and leave durable handoff artifacts instead of conversational sediment.

Complexity must earn its keep. Share infrastructure aggressively. Compose procedures conservatively.

Progressive disclosure:

- [skill substrate](methodrail-skill-substrate.md)
- [context economics](context-economics.md)
- [skill composition](skill-composition.md)
- [rigor](rigor.md)
- [decision frontier](decision-frontier.md)
- [knowledge](knowledge.md)
- [evidence](evidence.md)
- [context management](context-management.md)
- [project harness](project-harness.md)
- [agent-friendly codebase](agent-friendly-codebase.md)
- [structural enforcement](structural-enforcement.md)
- [simplicity](simplicity.md)
- [capability map](capability-map.md)
- [host capabilities](host-capabilities.md)
