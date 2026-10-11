# Claude Code adapter

The root `skills/` directory is Methodrail's source of truth. A consuming
project can expose selected skills through Claude Code's native
`.claude/skills/` location and place the projected family invariant from
`CLAUDE.md` in its project instructions. Do not edit that invariant by hand;
change `references/methodrail-family-invariant.md` and run `npm run project-hosts`.

Do not copy skill bodies into this adapter. Link or install the canonical skill
directories so updates remain centralized.

## Model controls

Use Claude aliases and controls: `haiku`, `sonnet`, `opus`, and `opusplan`.
`opusplan` splits plan mode from execution; it is not per-task routing. Existing
explicit model choices and managed settings win. Do not write Cursor slugs into
Claude settings, and do not set `model` on a portable Methodrail skill. Alias
access depends on host version, provider, and organization policy, so a
configured alias is not proof it ran. Recheck
[Claude Code model configuration](https://code.claude.com/docs/en/model-config)
before claiming a binding is available.
