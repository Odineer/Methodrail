# Host capabilities

Imported skills should degrade when a host lacks an optional facility. Do not pretend an unavailable capability exists.

## Portable

Methodology that needs only read/write, search, and command execution. Usable in Cursor, Claude Code, Codex, Z Code, and other Agent Skills hosts.

## Optional facilities

When a skill mentions parallel work, independent review, or live driving, use what the host actually provides:

| Facility | If available | If missing |
|---|---|---|
| Subagents / Task | Partition independent slices; keep the parent as synthesizer | Do the slices sequentially in this context |
| Multi-model | Prefer diverse model families for arena, interrogate, and critique | Use independent agent contexts if possible; otherwise state the limitation |
| Cloud / remote workers | Use for swarm coverage that does not need the local checkout | Use local subagents or sequential slices |
| Browser / CDP | Drive UI paths and capture rendered evidence | Use API/CLI/headless harnesses the repo already has; record the gap |
| Runtime tools | Instrument, profile, and observe live processes | Stay at source + tests; do not invent runtime evidence |
| MCP servers | Query the mapped evidence category | Document the category as unsearched; do not invent findings |
| Issue tracker CLI | Publish specs/tickets when the project already uses that tracker | Fall back to project-local markdown |

## Model roles

When a skill names a role, resolve the tier and host binding through [model routing](model-routing.md). Project policy lives at `.methodrail/MODELS.yaml` when init or `/refresh-model-routing` created it. With no project policy, use the host's native parent routing or its documented default.

`auto`, `inherit`, and an omitted `model` argument are different controls. `auto` is parent routing, not a subagent argument. `inherit` follows the parent. Omitting `model` follows that tool's documented default.

If `~/.cursor/rules/pstack-models.mdc` exists and defines the role, that line overrides the project tier binding on Cursor. Methodrail does not ship that file and does not require it. Ignore it on Z Code; its slugs are Cursor model ids.

| Role |
|---|
| `arena runners` |
| `arena cross-judge` |
| `architect runners` |
| `how explorer` |
| `how explainer` |
| `why investigators` |
| `why synthesizer` |
| `interrogate reviewers` |
| `reflect judgment` |
| `reflect divergent` |
| `reflect synthesizer` |
| `reflect tooling` |
| `swarm workers` |
| `hillclimb` |
| `perf-issue` |

On an unavailable model, use the tier's prevalidated fallback once, then omit `model`. Do not guess a nearby slug. Do not retry billing or authentication failures. Report a material substitution. If the host cannot choose models, omit `model` and continue. Suggest `/refresh-model-routing` when a binding needs repair. Routine work does not browse model catalogs.

## Z Code

Z Code loads `skills/*/SKILL.md` from this plugin or from `~/.zcode/skills/` and `.zcode/skills/`. Its instruction files are workspace `AGENTS.md` and `~/.zcode/AGENTS.md`. The plugin session hook injects the family invariant. Substitutions follow the same idea as [pstack-claude](https://github.com/michael-denyer/pstack-claude): one workflow, host-native tools.

| Cursor | Z Code |
| --- | --- |
| Task tool, cloud agents | Built-in subagents, or do the slice in this context. A subagent cannot spawn another. |
| AskQuestion | Ask in the conversation. |
| Browser / CDP | Repository CLI, tests, or headless harness. Record the gap. |
| Model ids and `~/.cursor/rules/pstack-models.mdc` | Ignore them. Use `inherit`, a Z Code model id, or omit `model`. |
| `disable-model-invocation` | Ignored. `when_to_use` carries the same guard — `Explicit request only` for explicit skills — and Z Code presents it to the model. |
| Session ledger | Cursor hook only (`hooks/cursor.json`). |

## Control planes

Methodrail's control plane is the native host plus Methodrail workflow entry skills. Do not load `poteto-mode`, `ask-matt`, `using-superpowers`, or other global routers.
