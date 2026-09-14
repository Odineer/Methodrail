# Contributing

Do not create a skill because advice sounds good. Create a skill because a **recurring agent failure** has been observed and the skill **measurably** improves behavior.

**Complexity must earn its keep.** New skills or extra orchestration must answer:

- What recurring failure does this solve?
- Why can't an existing skill solve it?
- Why isn't a deterministic tool better?
- What additional token/context/runtime cost does it introduce?
- When should it NOT trigger?
- How does it compose with existing capabilities?
- How will we test that it improves behavior?

Methodrail prefers evidence over NIH.

```text
Observed recurring agent failure
        ↓
Does Methodrail already solve it?
        │
        ├── yes → improve/eval existing capability
        │
        └── no
             ↓
Does proven upstream work solve it?
        │
        ├── yes → adopt/adapt
        │
        └── no → design a new skill
             ↓
write using writing-for-agents principles
             ↓
baseline behavior
             ↓
skill-enabled behavior
             ↓
pressure cases where relevant
             ↓
ship only when behavior improves
```

New skills must justify:

- problem
- observed failure
- why existing skills are insufficient
- routing behavior
- non-routing behavior
- eval strategy

When adopting upstream work: inspect the current license and commit, record them, preserve notices, keep provenance out of the prompt, and do not import competing global routers. See [upstream maintenance](docs/upstream-maintenance.md) and [capability map](references/capability-map.md).

When adopting or modifying a skill, use the [family integration](docs/family-integration.md) checklist.

## Skill changes

1. **Failure observed** — what the agent actually did wrong, repeatedly.
2. **Skill hypothesis** — how a bounded procedure prevents that failure.
3. **Activation rule** — when a native agent or workflow entry skill should load it.
4. **Non-activation rule** — when it must stay dark (especially expensive skills).
5. **Evals** — at least positive routing, negative routing, behavioral (or structural stand-in), and a pressure case.

Reject skills that are generic advice, long reference manuals, personality text, duplicate methodology, or work a compiler/linter/test should enforce.

Each skill directory requires `SKILL.md` with standard Agent Skills frontmatter. Use `disable-model-invocation: true` for explicit workflow skills and expensive procedures. Put detailed material in directly linked `references/` files.

Do not add Methodrail-specific metadata when native skill metadata expresses the same intent. Do not expose two skills for the same base capability.

## Architecture boundary

Methodrail defines good engineering behavior. Cursor, Claude Code, Codex, and other Agent Skills-compatible harnesses own context, tool execution, planning, task state, and subagents.

Do not add a router, workflow engine, agent protocol, daemon, database, mandatory CLI, or generated copies of canonical skills. Host-specific adapters must remain thin projections. Do not install `poteto-mode`, `ask-matt`, `using-superpowers`, or Ponytail commands/hooks as additional operating systems.

Shared methodology belongs in `references/`. Skills should stay short and link to it. Project harness artifacts use `.methodrail/PROJECT.md` as a concise index and must preserve existing AI instructions.

## Evals

Maintainer evals live in `evals/routing/`, `evals/behavioral/`, `evals/pressure/`, `evals/complexity/`, `evals/composition/`, `evals/fidelity/`, and `skills/<name>/evals/`. They are not required in consuming projects. Prefer mixed-intent prompts over textbook phrases.

Behavioral, composition, and fidelity evals compare a baseline agent with Methodrail; recorded or live native-harness runs are acceptable. `npm run eval` validates fixtures and scores recorded example runs. It does not ship an agent runtime. Complexity evals guard over-orchestration of simple work. After a failed eval, use `reflect` to classify knowledge / skill / verification / tooling / structural-enforcement problems before adding instructions.

Host guidance must be projected from `references/methodrail-family-invariant.md`. Do not hand-edit Cursor, Claude, or Codex copies of that contract. Run `npm run project-hosts` after changing the invariant.

## Repo commands

```bash
npm install
npm test
npm run validate
npm run eval
npm run check-upstreams
```

Before submitting, inspect the diff for obsolete runtime concepts, duplicated instructions, broken references, invalid plugin metadata, unexplained copied content, and excessive permanent context.
