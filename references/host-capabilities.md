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

## Cursor model roles

When the host can set a subagent `model`, use this procedure. `auto` and `inherit-parent` mean omit `model`. If `~/.cursor/rules/pstack-models.mdc` exists and defines the role, use that line. Methodrail does not ship that file and does not require it. Otherwise use the default in the table.

| Role | Default |
|---|---|
| `arena runners` | `claude-opus-5-5-max`, `gpt-5.6-sol-max`, `grok-4.7-xhigh-fast` |
| `arena cross-judge` | One of those three; prefer a different family from the parent when possible |
| `architect runners` | The same three, used instead of `arena runners` |
| `how explorer` | `grok-4.7-xhigh-fast` |
| `how explainer` | `claude-opus-5-5-max` |
| `why investigators` | `grok-4.7-xhigh-fast` |
| `why synthesizer` | `claude-opus-5-5-max` |
| `interrogate reviewers` | A: `claude-opus-5-5-max`; B: `gpt-5.6-sol-max`; C: `grok-4.7-xhigh-fast` |
| `reflect judgment`, `reflect divergent`, `reflect synthesizer` | `claude-opus-5-5-max` |
| `reflect tooling` | `gpt-5.6-sol-max` |
| `swarm workers` | `grok-4.7-xhigh-fast` |
| `hillclimb` | `grok-4.7-xhigh-fast` |
| `perf-issue` | `grok-4.7-xhigh-fast` |

If the Task tool rejects a slug, use the closest slug of that family from the error message and say which slug you selected. Families are `claude-*`, `gpt-*`, and `grok-*`. If the error lists no slug in that family, use the role's Claude default. If that default is also rejected, use the closest Claude slug from the error.

If the host cannot choose models, omit `model` and continue on the host default. Claude Code and Codex keep that fallback.

## Control planes

Methodrail's control plane is the native host plus Methodrail workflow entry skills. Do not load `poteto-mode`, `ask-matt`, `using-superpowers`, or other global routers.
