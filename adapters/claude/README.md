# Claude Code adapter

The root `skills/` directory is Methodrail's source of truth. Claude Code loads
that tree from `.claude-plugin/plugin.json`. Do not copy skill bodies into this
adapter.

`hooks/hooks.json` is shared with Z Code, and Claude Code loads it
automatically from the plugin root. On SessionStart it injects the projected
family invariant from `CLAUDE.md` in this folder. Do not edit that invariant by
hand; change `references/methodrail-family-invariant.md` and run
`npm run project-hosts`. Cursor's ledger stays in `hooks/cursor.json`.

## Install

Plugin (skills plus the session hook):

```text
/plugin marketplace add Odineer/Methodrail
/plugin install methodrail@methodrail
```

For a local checkout, pass its path to `/plugin marketplace add` instead, or
start Claude Code with `claude --plugin-dir <checkout>`. Start a new session,
then run `/methodrail:methodrail-init`.

`.claude-plugin/marketplace.json` is the catalog entry. Source `./` is this
checkout. Do not also paste `CLAUDE.md` into project instructions while the
plugin hook is enabled.

Skills only, without the hook: symlink every `skills/<name>` directory into
`~/.claude/skills/` (or project `.claude/skills/`), and symlink `references/`
and `templates/` next to that `skills/` folder (`~/.claude/references`,
`~/.claude/templates`). Skills link shared files as `../../references/<file>`
and load sibling skills as `../<name>/SKILL.md`, so a partial set breaks those
links and workflow composition. Then copy `CLAUDE.md` from this folder into the
project's `CLAUDE.md` or `~/.claude/CLAUDE.md`. Use one surface only: the plugin
and symlinks together list every skill twice.

## Skill names

Plugin skills are namespaced: `/methodrail:develop`, `/methodrail:simplify`.
Claude Code accepts a bare `/develop` when no other skill uses the name.
Claude Code bundles its own `simplify` and `code-review`, so under the plugin
bare `/simplify` reaches Claude Code's skill. Use `/methodrail:simplify`. A
symlink install does the reverse: the personal or project skill shadows the
bundled one.

## Explicit skills

Claude Code enforces `disable-model-invocation`: an explicit skill leaves
Claude's skill listing and the Skill tool refuses it. Workflows still compose
explicit skills by reading `../<name>/SKILL.md` from the active skill's base
directory. The projected `CLAUDE.md` states this. See
[host capabilities](../../references/host-capabilities.md#claude-code).

## Model controls

Use Claude aliases and controls: `haiku`, `sonnet`, `opus`, `fable`, `best`,
and `opusplan`, with an optional `[1m]` context suffix. `opusplan` splits plan
mode from execution; it is not per-task routing. Existing explicit model
choices and managed settings win. Do not write Cursor slugs into Claude
settings, and do not set `model` on a portable Methodrail skill. Alias access
depends on host version, provider, and organization policy, so a configured
alias is not proof it ran. Recheck
[Claude Code model configuration](https://code.claude.com/docs/en/model-config)
before claiming a binding is available.

## Evidence

Claude Code support is conformance-tested: manifests, the shared hook, and the
projected invariant run under `npm run check`. No live Claude Code eval battery
has run, so make no behavior-improvement claim from it.
