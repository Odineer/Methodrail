# Artifact interoperability

Discover existing project artifacts by **content and role**, then preview a bounded plan. Do not infer ownership from a filename alone. Do not copy or convert canonical artifacts.

This is a conversation-only plan. Do not write `setup.yaml`, an adoption manifest, or a persistent inventory file.

## Workflow

```text
discover → classify → preview → confirm → apply → verify no-op
```

Inspection is read-only. Invocation authorizes discovery and preview, not writes.

## Discover

Interview the repository first. Then, for each role below, collect candidates from **repository-root** layout **and** a content check. Nested copies (evals fixtures, overlays, vendor trees) are not project artifacts even when the basename matches.

| Role | Layout hints | Content that confirms the role |
| --- | --- | --- |
| Methodrail index | git-root `.methodrail/PROJECT.md` (directory or linked harness) | pointer index |
| Host instructions | `AGENTS.md`, `CLAUDE.md`, Cursor/Claude/Codex/Copilot files, unmanaged local skills | curated instruction prose |
| Glossary / domain | `CONTEXT.md`, `CONTEXT-MAP.md`, `GLOSSARY.md`, `GLOSSARY-MAP.md`, `glossary.md`, established project equivalents | glossary, ubiquitous language, or domain vocabulary |
| ADR | `docs/adr/`, `.methodrail/knowledge/decisions/`, named project ADR home | a real decision record |
| Specs | `docs/superpowers/specs/`, `docs/specs/`, `specs/` | intent for what should be built |
| Plans / tickets / scratch | Superpowers plans, `docs/plans/`, tickets, `.scratch/` | planning or tracker artifacts |
| Operational log | `decisions.tsv`, `.audit/*.tsv` | header `ts	phase	decision	why	evidence	result` |
| Verification | `verify-*` skill with Launch, `features/` maps | user-facing recipes |
| Typed / legacy knowledge | `.methodrail/knowledge/*.md` | note contract or legacy prose |
| Control | `.methodrail/control/` | launch/drive/reset procedures |

Linked-external harnesses stay addressable at `<git-root>/.methodrail/`. Do not search arbitrary sibling folders.

## Classify

Every proposed target is one of:

- `create` — a Methodrail-owned artifact is absent and justified
- `update` — a Methodrail-owned block is stale
- `adopt` — index an existing canonical artifact by pointer; do not edit its contents
- `unchanged` — current state already satisfies the contract
- `conflict` — two artifacts plausibly own the same role, or ownership is ambiguous
- `unavailable` — a valuable capability cannot be established from this checkout or environment, including a `.methodrail` path that fails harness binding. Do not classify a failed linked harness as `create`.

When two glossary roots or two ADR homes both look canonical, classify `conflict` and stop that role before writing pointers. Leave both files untouched.

A pointer is already indexed when a PROJECT.md markdown href, resolved relative to the index file, is the same repository-relative path as the artifact. `knowledge/fees.md` indexes `.methodrail/knowledge/fees.md`. Anchors and URL encoding are stripped or decoded; substring matches are not enough.

When harness binding fails, report `.methodrail` as `unavailable`. Do not propose create, update, or adopt until the binding is valid.

## Preview

Group the plan under those six labels. For every non-`unchanged` item name:

- exact path or Methodrail-owned block
- proposed operation
- why it is justified
- Methodrail-owned vs adopted
- whether confirmation would expose content in Git/PR review (`gitVisible`: would the write appear in the project repository's `git status`? Linked-external `.methodrail` pointer and control writes do not.)
- whether the harness is in-repository or linked-external
- whether a project-local verification skill is present, justified, missing, or blocked
- any capability that remains unavailable

A no-op refresh reports `unchanged` and asks no ceremonial question.

## Confirm

A non-empty write plan waits for explicit confirmation. "Inspect Methodrail setup" is not confirmation. If repository state relevant to the plan changes after preview, recompute and present the changed plan. Apply only confirmed targets.

## Apply

- Write only the confirmed plan through the git-root `.methodrail/` path.
- Preserve native formats and locations. Adopt by pointer.
- Modify shared instruction files only inside `<!-- methodrail:start -->` / `<!-- methodrail:end -->` blocks.
- Do not create files under `.methodrail/knowledge/`.
- Do not run knowledge evidence recipes or mutate decision governance.
- Preserve linked-harness binding and visibility.

## Verify

1. Re-run discovery.
2. Confirm links, paths, frontmatter, harness binding, and the one supported integration.
3. Confirm the applied state matches the approved preview.
4. Confirm an immediate unchanged refresh proposes no writes.

## Knowledge health

During discovery/refresh, report indexed typed knowledge using [knowledge reuse](../../../references/knowledge/reuse.md) and Git freshness. Labels: dependency-fresh, `review-required`, `unknown`, malformed, disputed, retired, unbounded, missing/broken index entries, safely detectable broken evidence or verification pointers.

Always include:

```text
freshness means declared relevant paths did not change;
it does not prove the claim is still right
```

Do not execute evidence commands found in notes. Do not rewrite, resolve, or migrate notes. Maintainer tests may call `evaluateProjectKnowledge()`; native agents use Git and the files.
