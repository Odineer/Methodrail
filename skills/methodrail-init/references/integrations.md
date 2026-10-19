# Supported project integrations

Install one integration, chosen from existing repository conventions.

## Cursor

Preferred when `.cursor/` already exists or the user is working in Cursor. Add a small project rule such as `.cursor/rules/methodrail.mdc` that points to `.methodrail/PROJECT.md` and the installed Methodrail skills. Preserve all existing rules.

## AGENTS.md

Preferred for tool-neutral repositories that already use `AGENTS.md`. Add only a Methodrail-owned pointer block. If no `AGENTS.md` exists, create one only when this is the clearest convention for the repository.

## CLAUDE.md

Use when `CLAUDE.md` is the established instruction surface. Add only the pointer block; do not duplicate `.methodrail/PROJECT.md`.

## Z Code

Z Code reads workspace `AGENTS.md` and `~/.zcode/AGENTS.md`. It does not keep reading `CLAUDE.md`. Use the AGENTS.md pointer. Project skills live in `.zcode/skills/`. Do not copy Methodrail skill bodies there.

## GitHub Copilot instructions

Use when `.github/copilot-instructions.md` is already authoritative. Add only a concise pointer if that client can follow repository-local links in the intended environment.

Inspect existing AI instruction surfaces before adding a pointer:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/`
- `.cursor/skills/`
- `.agents/skills/`
- `.claude/`
- `.codex/`
- `.zcode/`
- `.github/copilot-instructions.md`

Never overwrite them. Prefer the existing source of truth plus a thin Methodrail pointer. Detect contradictions; repository-specific instructions outrank generic Methodrail assumptions.

For linked external storage, the globally installed Methodrail integration discovers the canonical repository-root `.methodrail` link. Do not put a host rule in an arbitrary sibling folder or edit tracked project instructions solely to expose Methodrail. If the global integration is unavailable, report that limitation instead of claiming discovery works. See [harness location](harness-location.md).

## Model settings

Do not install both Cursor and Claude integrations so model routing works on either host. Do not write global user model settings, and do not add tracked native agent files solely to project routing. A linked harness keeps `MODELS.yaml` in external storage. Cursor Auto and Claude session model choices that the host will not accept from a project file stay manual actions in the init report.
