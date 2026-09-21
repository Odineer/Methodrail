# Install Methodrail

Methodrail is a Cursor plugin and a portable Agent Skills family. Consuming projects do not install an npm dependency, run a daemon, or use a Methodrail CLI.

Three supported installs:

## 1. Cursor Marketplace (once listed)

When the plugin is listed, install **Methodrail** from the Cursor marketplace and reload the window. Then in a project:

1. Run `/methodrail-init`.
2. Use `/investigate`, `/develop`, `/debug`, `/refactor`, or `/review`.

Until it is listed, use the local symlink below. Submission is a maintainer action at https://cursor.com/marketplace/publish — see the checklist at the end of this page.

## 2. Local symlink (maintainers)

Clone or already have this repository, then point Cursor at HEAD:

```bash
mkdir -p ~/.cursor/plugins/local
ln -s /absolute/path/to/Methodrail ~/.cursor/plugins/local/methodrail
```

Reload the Cursor window. Methodrail appears in **Cursor Customize**.

Before any live observation, from this checkout:

```bash
npm run doctor
```

Doctor must report `status: linked` (the plugin directory resolves to this checkout). `identical` means a copy that currently matches; `stale` or `missing` means do not record live evidence.

A clone into `~/.cursor/plugins/local/methodrail` also works for consumers, but it will go stale. Maintainers developing Methodrail itself must symlink.

## 3. Claude Code and Codex

Reusable skills stay compatible with Agent Skills-oriented hosts. Do not copy skill bodies.

- Claude Code: [adapters/claude/README.md](../adapters/claude/README.md) — expose selected skills through `.claude/skills/` and the projected invariant in `adapters/claude/CLAUDE.md`.
- Codex: [adapters/codex/README.md](../adapters/codex/README.md) — expose selected skills through `.agents/skills/` and the projected invariant in `adapters/codex/AGENTS.md`.

Change `references/methodrail-family-invariant.md` and run `npm run project-hosts` rather than editing those copies by hand.

## Session ledger

The Cursor plugin ships an observational hook that appends a session ledger under `~/.local/state/methodrail/sessions` only in repositories that already have a `.methodrail/` harness. It never writes inside the repository. The ledger records skill and reference paths, shell commands with exit codes, and final responses. Disable it with `METHODRAIL_LEDGER=0`, or relocate it with `METHODRAIL_LEDGER_DIR`.

## Marketplace submission checklist

Maintainer-only. Do not treat this list as a live listing.

- [x] Manifest `.cursor-plugin/plugin.json`: unique kebab-case `name` (`methodrail`), `displayName`, `version`, `description`, relative `skills` / `rules` / `hooks` / `logo`
- [x] `README.md` usage (start in under a minute)
- [x] Logo committed at `assets/logo.svg` (monochrome rail glyph; no external assets)
- [ ] Local test after a Cursor window reload: Customize shows Methodrail 0.9.2 and `/develop` autocompletes (Task 0.2 / human checkpoint 1)
- [ ] Submit at https://cursor.com/marketplace/publish when checkpoint 1 is confirmed and the operator wants it listed

Do not bump the plugin version for marketplace. Version stays `0.9.2` until the v0.10.0 release commit.
