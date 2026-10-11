# Codex adapter

The root `skills/` directory is Methodrail's source of truth. A consuming
project can expose selected skills through Codex's native `.agents/skills/`
location and place the projected family invariant from `AGENTS.md` in its
project instructions. Do not edit that invariant by hand; change
`references/methodrail-family-invariant.md` and run `npm run project-hosts`.

Do not copy skill bodies into this adapter. Link or install the canonical skill
directories so updates remain centralized.

## Model controls

Use Codex's documented model control when it has one. Otherwise keep the native
default and report that per-task routing is unavailable. Do not copy Cursor or
Claude slugs into Codex configuration.
