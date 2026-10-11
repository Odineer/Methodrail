# Model routing

Task-based model policy for Methodrail. This is methodology plus one optional harness file. It is not a router, scheduler, or model client.

Load this reference when choosing a model for a justified subagent, configuring a project policy, or repairing a rejected selection. Ordinary work uses the saved policy and the host's current controls. It does not browse catalogs or run refresh by itself.

Canonical file: `.methodrail/MODELS.yaml`, indexed from `PROJECT.md`. Schema: [MODELS.yaml schema](../skills/refresh-model-routing/references/schema.md). Maintenance: [refresh-model-routing](../skills/refresh-model-routing/SKILL.md).

## Precedence

1. An explicit user model choice, a managed restriction, or an existing authoritative project policy.
2. A preserved pin in `MODELS.yaml` for that role.
3. An optional `~/.cursor/rules/pstack-models.mdc` role line, when that file already exists. Methodrail does not install it.
4. The role's tier in the project policy, adjusted by the stored preference.
5. With no project policy, the host's native parent routing or its documented default.

## Tiers

Preference defaults to `balanced`. `cost` moves balanced work to fast and leaves fast and deep in place. `quality` moves balanced work to deep and leaves fast and deep in place. Existing preferences win; do not ask every project.

| Work | Initial tier | Escalation |
| --- | --- | --- |
| Bounded search, mechanical edits, documentation, running existing checks | Fast. Keep tiny work in the parent. | Conflicting evidence or complex interpretation |
| Normal implementation, focused debugging, refactoring, ordinary review | Balanced | Root cause stays unknown, scope widens, or an important invariant is unclear |
| Architecture, difficult investigation, security-sensitive reasoning, data migration | Deep | A required capability or independent judgment is still unmet |
| Competing designs and independent critique | Deep, with diverse families when the host can supply them | The host cannot provide the requested diversity |

| Role | Tier | Diversity |
| --- | --- | --- |
| `how explorer`, `why investigators`, `swarm workers` | Fast | — |
| `hillclimb`, `perf-issue`, `reflect tooling` | Balanced | — |
| `how explainer`, `why synthesizer`, `reflect judgment`, `reflect divergent`, `reflect synthesizer`, `architect runners` | Deep | Architect runners request families |
| `arena runners`, `arena cross-judge`, `interrogate reviewers` | Deep | Families |

Cheap exploration and difficult synthesis stay on different tiers. A failed test from an ordinary coding mistake is not an escalation. Spawn a subagent only when the skill already justified one. Do not spawn one merely to change models.

## Controls

`auto`, `inherit`, and an omitted `model` argument are different:

- `auto` is native parent routing. It is not a subagent model argument.
- `inherit` follows the parent agent's model.
- Omitting `model` follows that tool's documented default.

Use the host's supported control. On a rejected model, use that tier's prevalidated fallback once, then omit `model`. Do not guess a nearby slug. Do not retry billing or authentication failures. Report a material substitution and suggest `/refresh-model-routing` when the binding needs repair.

Diverse reviewers use distinct families from the host binding's `supported` list. When that list has fewer than two families, use independent contexts and say diversity is unavailable.

## Evidence

Store only the bindings this project uses. Each host binding records version or provider, source, observation date, availability (`observed`, `documented-only`, or `unknown`), and rationale. A public model list does not prove this account can use it. `documented-only` and `unknown` are not live proof. Configuration validation and a live probe are separate results.

Suggest review after `freshness_days` (30 by default), or immediately after a host or provider change or a rejected selection. That threshold is not a correctness guarantee. If policy, bindings, and material evidence are unchanged, leave the file byte-for-byte alone. Do not rewrite it only to refresh a timestamp.

Never store API keys or account identifiers. For a shared repository, treat bindings as evidence from one host environment and revalidate local access before use.

## Hosts

Cursor's parent strategy is native Auto. Balance, Cost, and Intelligence are model-picker modes where Cursor Router is available. Documented Router access is Teams or Enterprise, and a project rule does not change the picker. Report the one-time picker action. Subagent `model` is `inherit` or a supported id; account and plan restrictions can substitute another model. Do not assume the configured id ran.

Claude's parent recommendation for balanced work is `opusplan`, a plan/execute split, not per-task routing. Tier guidance uses the moving aliases `haiku`, `sonnet`, and `opus`. Existing explicit choices and managed settings win. Do not write Cursor slugs into Claude controls, and do not put a `model` override on a portable Methodrail skill.

Other hosts keep their documented control or the native default. Report the limitation.

Checked against Cursor Router, Cursor subagents, and Claude Code model and subagent docs on 2026-10-05. Recheck those docs and the installed host before claiming a binding is available.
