# Project harness

The objective is the highest-leverage project-specific AI harness with the least permanent-context cost and maintenance burden.

A tiny project may need only:

```text
.methodrail/PROJECT.md
```

A mature service may need:

```text
.methodrail/
├── PROJECT.md
├── knowledge/          # typed notes after Reflect; decisions/; optional legacy
│   └── decisions/
└── control/
    ├── CONTROL.md
    └── scenarios/
```

Do not generate files merely to satisfy a template. Create richer artifacts when they materially improve future agent performance.

The harness is always addressed at the git root as `.methodrail/`. It may be a normal directory or an ignored repository-bound link to sibling storage. The linked layout keeps its contents out of commits and PR review without making agents search arbitrary workspace folders. `HARNESS.yaml` binds external storage to exactly one repository.

## PROJECT.md is an index

Keep it short. Point to canonical source, glossary/domain docs, specs/plans, ADRs, operational decision logs, knowledge notes, verification skills, and control procedures. It is not the entire knowledge base. Do not copy those artifacts into the index.

```text
small index
↓
precise pointers
↓
on-demand deeper knowledge
```

## Information ROI

```text
                     future agent benefit
information ROI = ──────────────────────────────
                  context + staleness + upkeep
```

High-value: important domain invariants, unexpected ownership boundaries, non-obvious runtime behavior, deployment traps, known failure modes, consequential architectural rationale. Typed notes use the [note contract](knowledge/note-contract.md). Init does not invent them; Reflect proposes them after real work.

Low-value: copied package.json, obvious directory listings, stale API inventories, generic framework documentation.

## Lazy crystallization

```text
initial high-value knowledge
↓
real work
↓
investigation/prototype/debugging
↓
validated discoveries
↓
knowledge proposals
↓
durable project knowledge
```

Do not fully document a repository during init. Do not create files under `.methodrail/knowledge/` during init. Grow the harness around actual engineering work. Later sessions reuse notes through [knowledge reuse](knowledge/reuse.md).

## Existing instructions outrank Methodrail

Inspect `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.cursor/skills/`, `.agents/skills/`, `.claude/`, and `.codex/`. Never overwrite them. Prefer an existing source of truth plus a thin Methodrail pointer. Detect contradictions; repository-specific instructions win.

## Host surfaces

- Cursor: plugin `skills/` and `rules/`
- Claude Code: `.claude/skills/` and `CLAUDE.md`
- Codex: `.agents/skills/` and `AGENTS.md`

Reference canonical Methodrail skills instead of copying their bodies.

When the project has a meaningful executable surface and no adequate existing check, init discovers verification requirements before confirmation and generates guidance only in the confirmed apply phase. Follow [verification lifecycle](verification-lifecycle.md). Do not copy global operators into the repo.

Project verification is shared substrate. `how`, `observe`, `diagnosing-bugs`, `tdd`, `prototype`, `verify-change`, `review`, and `maintain-verification-skill` should reuse it instead of rediscovering launch/drive/reset behavior. Linked external harnesses keep that guidance under `.methodrail/control/`.

See also [agent-friendly codebases](agent-friendly-codebase.md) and [structural enforcement](structural-enforcement.md).
