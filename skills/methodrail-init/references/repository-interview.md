# Repository interview

Inspect evidence in this order, stopping when the project is understood well enough to generate a useful harness. Do not ask humans questions the repository can answer.

1. Existing AI guidance: `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, `.cursor/skills/`, `.claude/`, `.codex/`, `.zcode/`, `.agents/skills/`, `.github/copilot-instructions.md`, other local skills, and `.methodrail/` at the git root. If `.methodrail` is linked, validate its `HARNESS.yaml`; do not search arbitrary sibling folders. Also read an existing `.methodrail/MODELS.yaml`, role pins, and native model fields already present in project settings. Read those fields only. Do not change global user model settings during the interview.
2. Project identity: README, contribution guide, manifests, lockfiles, workspace definitions, and directory shape.
3. Supported operations: package scripts, Makefiles, task runners, CI jobs, container configuration, deployment configuration, and test configuration.
4. Representative implementation: runtime entrypoints, source layout, one core module, one test, and architecture docs or ADRs when relevant. Confirm each by content, not filename: glossaries, ADR homes, spec/plan/ticket/scratch trees, pstack-compatible `decisions.tsv` / `.audit/*.tsv`, verification feature maps, Matt-shaped domain/ADR layouts, Superpowers `docs/superpowers/specs/` and `plans/`, Methodrail knowledge/control, and existing host instructions. If two artifacts plausibly own the same role, record a conflict and do not guess.
5. Domain terminology as used in code, docs, and tests — not guessed from folder names alone.
6. Repository history only for material unknowns (why a boundary exists, when a risky subsystem landed).

Infer:

- project type and primary languages;
- important modules and ownership boundaries;
- canonical install, build, test, lint, typecheck, format, and run commands that actually exist;
- test strategy and whether runtime verification is practical;
- runtime surface and how to start it;
- existing architectural sources;
- existing AI-harness conventions and conflicts;
- generated/vendor directories to avoid.

For monorepos, sample each distinct package kind. Do not inspect every package when conventions are shared.

Ask the user only about unresolved intent, credentials, unavailable environments, mutually exclusive integration choices, or where Methodrail files should live when that has not already been decided.
