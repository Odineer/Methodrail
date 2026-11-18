# Kilo Code adapter

The root `skills/` directory is Methodrail's source of truth. Kilo Code (the
7.x VS Code extension and the Kilo CLI it bundles) loads it as plain Agent
Skills. Do not copy skill bodies into this adapter.

`methodrail.md` in this folder is the projected family invariant plus Kilo's
explicit-skill guard. Do not edit it by hand; change
`references/methodrail-family-invariant.md` and run `npm run project-hosts`.

## Install

Kilo has no plugin manifest that bundles skills, rules, and hooks, so there is
no plugin install. Kilo plugins are code modules and cannot contribute skills.

1. Symlink every `skills/<name>` directory into `~/.kilo/skills/` (or project
   `.kilo/skills/` for one workspace). Kilo follows symlinked skill directories.
2. Symlink `references/` and `templates/` next to that `skills/` folder
   (`~/.kilo/references`, `~/.kilo/templates`). Skills link shared files as
   `../../references/<file>` and load sibling skills as `../<name>/SKILL.md`,
   so a partial set breaks those links and workflow composition. For a
   workspace-local root, point the symlinks back at this checkout.
3. Copy or symlink `methodrail.md` from this folder to `~/.kilo/rules/methodrail.md`
   (or project `.kilo/rules/methodrail.md`). Kilo loads every file in those
   rules folders as always-on instructions, so this leaves an existing
   `AGENTS.md` untouched.
4. Run `/reload` or start a new session, then run `/methodrail-init`.

Kilo asks for `external_directory` permission the first time a skill reads a
shared file outside the project. That is expected for a global install.

### One skill root

Kilo also scans `~/.agents/skills/`, `~/.claude/skills/`, and the project's
`.agents/skills/` and `.claude/skills/`. If a Codex or Claude Code symlink
install already put Methodrail there, Kilo already sees those skills: add only
the rule file. A second root lists every skill twice, and which same-named copy
wins depends on scan order, not on the documented project-over-global rule. Set
`KILO_DISABLE_CLAUDE_CODE_SKILLS` to stop Kilo reading `.claude/skills/`. The
Claude Code plugin install lives under `~/.claude/plugins/`, which Kilo does
not scan.

Kilo reads `CLAUDE.md` only when there is no `AGENTS.md`. A project that
already carries the Claude projection in `CLAUDE.md` gets the invariant twice
once the rule file is installed; keep one.

## Explicit skills

Kilo reads only `name` and `description` from skill frontmatter. It ignores
`disable-model-invocation` and `when_to_use`, so the workflow entry skills and
expensive operators would otherwise be freely model-invocable. `methodrail.md`
names every explicit skill and tells the agent to load them only when the user
or an active Methodrail skill names them. The list is generated from
`src/skill-invocation.ts`, so validation catches drift.

Every skill is also a slash command: `/develop`, `/simplify`. When a skill name
collides with a Kilo command, Kilo exposes the skill as `/<name>:skill`.

There is no session hook. Kilo has no shell lifecycle hooks; a code plugin
could rewrite the system prompt through an experimental hook, but the rules
folder already does that job without code.

## What stays on Cursor

Cursor Task, AskQuestion, browser tools, model slugs, `disable-model-invocation`,
and the session ledger do not carry over. Use the Kilo Code row in
[host capabilities](../../references/host-capabilities.md#kilo-code).

## Model controls

Parent strategy is `default`. Kilo sets models per agent and per command in
`kilo.jsonc` or `.kilo/agents/*.md`. Do not write Cursor slugs or Claude
aliases there on Methodrail's behalf, and do not set `model` on a portable
Methodrail skill. A listed model id is not proof it ran.

## Evidence

Kilo Code support follows Kilo's documentation and source (Kilo-Org/kilocode,
checked 2026-11-18). The projected rule runs under `npm run check`. No live
Kilo session has run, so make no behavior claim from it.
