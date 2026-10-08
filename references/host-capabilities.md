# Host capabilities

Imported skills should degrade when a host lacks an optional facility. Do not pretend an unavailable capability exists.

## Portable

Methodology that needs only read/write, search, and command execution. Usable in Cursor, Claude Code, Codex, and other Agent Skills hosts.

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

If `~/.cursor/rules/pstack-models.mdc` exists and defines the role, that line overrides the project tier binding. Methodrail does not ship that file and does not require it.

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

## Control planes

Methodrail's control plane is the native host plus Methodrail workflow entry skills. Do not load `poteto-mode`, `ask-matt`, `using-superpowers`, or other global routers.
