# Cursor adapter

Methodrail is a native Cursor Plugin. Cursor discovers the canonical skills in
`skills/*/SKILL.md` and the projected family invariant in `rules/methodrail.mdc`
from the repository root using `.cursor-plugin/plugin.json`. Change
`references/methodrail-family-invariant.md` and run `npm run project-hosts`
rather than editing the rule copy by hand.

Do not copy skill or rule bodies into this directory. It only documents the
Cursor projection; the root package content is the source of truth. Cursor
hooks are `hooks/cursor.json`. `hooks/hooks.json` is the Z Code session hook.

## Model controls

Parent work prefers native Auto. Balance, Cost, and Intelligence are model-picker
modes where Cursor Router is available. Documented Router access is Teams or
Enterprise, and a project rule does not change the picker. Report that one-time
picker action. Do not add the Cursor SDK to discover models.

Subagent `model` is `inherit` or a supported id, with bracket parameters such as
`effort` when that id documents them. `inherit` follows the parent. Omitting
`model` follows the tool default. `auto` is not a subagent argument. Plan and
admin restrictions can substitute another model, so a configured id is not proof
it ran. Task policy and fallback live in `references/model-routing.md`.
