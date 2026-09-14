# Project

Pointer index for Methodrail maintainers. Canonical product docs stay in the repository root and `references/`.

## Purpose

Methodrail is a Cursor plugin and portable Agent Skills family. It is methodology plus a project harness, not an agent runtime.

## Important boundaries

- This repository's harness is git-root `.methodrail/` only. `.methodrail` trees under `evals/fixtures/` and `tests/fixtures/` are fixture data.
- `src/` validates Methodrail, fixtures, and evals; it is not a consumer runtime ([README.md](../README.md)).
- `rules/methodrail.mdc` and `adapters/` are host projections of [family invariant](../references/methodrail-family-invariant.md).

## Canonical commands

- Install: `npm install`
- Test: `npm test`
- Typecheck, tests, validate, and eval: `npm run check`
- Validate only: `npm run validate`
- Eval fixtures and recorded examples: `npm run eval`
- Upstream drift: `npm run check-upstreams`
- One-source JSON preflight: `node scripts/check-upstreams.mjs --upstream <name> --format json`
- Refresh host projections: `npm run project-hosts`

## Verification

This repository has no user-facing runtime, so there is no project-local verify skill. `npm run check` is the maintainer gate: `tsc --noEmit`, tests, `validate`, and `eval`. `npm run eval` scores recorded composition examples; it does not launch an agent.

- Skill, rule, reference, or `src/` change: `npm test` and `npm run validate`; `npm run check` before claiming the slice done
- Family invariant change: `npm run project-hosts`, then `npm run check`
- Upstream records: `npm run check-upstreams`
- Incorporate one drifted source: [sync-upstream](../maintainer/skills/sync-upstream/SKILL.md)

## Architecture pointers

- [README.md](../README.md)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [capability map](../references/capability-map.md)
- [family invariant](../references/methodrail-family-invariant.md)
- [project harness](../references/project-harness.md)
- [eval runner](../evals/README.md)
- [family integration](../docs/family-integration.md)
- [upstream maintenance](../docs/upstream-maintenance.md)
- [sync-upstream](../maintainer/skills/sync-upstream/SKILL.md)

## Important constraints

- After changing the family invariant, run `npm run project-hosts` rather than editing host copies.

## Existing AI guidance

- Cursor plugin rule: [rules/methodrail.mdc](../rules/methodrail.mdc)
- Claude adapter: [adapters/claude/CLAUDE.md](../adapters/claude/CLAUDE.md)
- Codex adapter: [adapters/codex/AGENTS.md](../adapters/codex/AGENTS.md)
