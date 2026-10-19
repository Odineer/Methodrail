# Z Code adapter

The root `skills/` directory is Methodrail's source of truth. Z Code loads that
tree from `.zcode-plugin/plugin.json`. Do not copy skill bodies into this
adapter.

`hooks/hooks.json` is the Z Code session hook. It injects the projected family
invariant. Cursor's ledger stays in `hooks/cursor.json`. Z Code does not read
`rules/*.mdc`.

Change `references/methodrail-family-invariant.md` and run `npm run project-hosts`
rather than editing `AGENTS.md` by hand.

## Trigger guards

Z Code ignores `disable-model-invocation`, so without a countermeasure the
explicit-only workflows would become freely model-invocable here. Every shipped
skill therefore declares `when_to_use`, which Z Code presents next to the
description: workflow entry skills and expensive operators open with `Explicit
request only` (`interrogate` with `Suggest-only`), and the model-invoked
operators restate their trigger branches there because Z Code truncates long
descriptions. The field restates what each description already says, so Cursor,
Claude Code, and Codex behavior is unchanged. `src/validate.ts` and
`tests/zcode-host.test.ts` enforce the contract.

There is no plugin `commands/` surface, on purpose. Z Code already routes
`/<skill-name>` to skills, and a second entry point would duplicate every
workflow in the `/` menu without removing model invocability — commands do not
take the skill out of the model's invocation list either.

The session hook is a POSIX shell wrapper that probes common Node locations.
On Windows it fails open (no injection, no error). The plugin is maintained on
macOS and Linux.

Z Code support is conformance-tested — manifest, hook schema, frontmatter, and
trigger guards run under `npm run check`. No live Z Code battery has run, so
make no behavior-improvement claim from it.

## Install

Plugin (skills plus the session hook):

1. In Z Code, open Settings → Plugins → Create → Add marketplace.
2. Point it at this repository (GitHub `Odineer/Methodrail`, or the local checkout).
3. Install **methodrail** and start a new session.
4. Run `/methodrail-init`.

`marketplace.json` at the repository root is the catalog entry. Source `./` is this checkout.

Skills only, without the hook: symlink each `skills/<name>` directory into
`~/.zcode/skills/` (or `.zcode/skills/` for one workspace) and append
`adapters/zcode/AGENTS.md` to workspace `AGENTS.md` or `~/.zcode/AGENTS.md`.
Do not paste that block again when the plugin hook is enabled.

Z Code reads those two `AGENTS.md` files only. It does not keep reading `CLAUDE.md`.

## What stays on Cursor

Cursor Task, AskQuestion, browser tools, model slugs, `disable-model-invocation`, and the session ledger do not carry over. Use the Z Code row in [host capabilities](../../references/host-capabilities.md). Skill bodies stay shared; [pstack-claude](https://github.com/michael-denyer/pstack-claude) is the reference for which Cursor primitives need a host substitute, not a second copy of the skills.

## Model controls

Parent strategy is `default`. Do not write Cursor slugs or Claude aliases into Z Code settings. A listed model id is not proof it ran.
