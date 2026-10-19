# Z Code adapter

The root `skills/` directory is Methodrail's source of truth. Z Code loads that
tree from `.zcode-plugin/plugin.json`. Do not copy skill bodies into this
adapter.

`hooks/hooks.json` is the Z Code session hook. It injects the projected family
invariant. Cursor's ledger stays in `hooks/cursor.json`. Z Code does not read
`rules/*.mdc`.

Change `references/methodrail-family-invariant.md` and run `npm run project-hosts`
rather than editing `AGENTS.md` by hand.

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
