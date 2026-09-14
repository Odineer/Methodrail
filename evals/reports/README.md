# Eval reports

Maintainer comparison output lives here. `npm run eval` scores recorded example runs against **artifact-backed fixture graders**. It does not launch an agent.

Committed examples are under `evals/runners/examples/`. Artifact overlays, answers, and command logs live under `evals/runners/artifacts/`. Generated files matching `*.generated.md` are ignored.

A report must use disjoint vocabularies:

- **Empirical** (live vs live): `helped` | `neutral` | `harmed` | `incomplete`
- **Specification** (constructed vs constructed): `passed` | `failed`
- **Guardrail** (synthetic): `caught` | `missed`

Constructed pairs must never be quoted as `helped`. Current Codex pilot JSON is `runner_captured` because raw transcripts and artifact bundles exist. Cursor pilot JSON is `operator_summary`; its artifact bundles exist but raw subagent transcripts were unavailable.

`evals/pilot-t5-t10.yaml` is the executable v0.6.1 live-pilot manifest. `evals/pilot-v0.7-knowledge.yaml` is the executable v0.7 knowledge-reuse/refresh live-pilot manifest. The default integrity gate rescores both and fails if a planned pair or required capture artifact disappears.

`evals/pilot-v0.8-knowledge-governance.yaml` is the executable v0.8 knowledge-governance live-pilot manifest. Rubric: [v0.8-knowledge-governance-protocol.md](./v0.8-knowledge-governance-protocol.md). The default integrity gate rescores it.

`evals/pilot-v0.9-project-artifact-interoperability.yaml` is the executable v0.9 live-pilot manifest. Rubric: [v0.9-project-artifact-interoperability-protocol.md](./v0.9-project-artifact-interoperability-protocol.md). The default integrity gate rescores it.

[v0.9.2-ponytail-simplicity-pilot-results.md](./v0.9.2-ponytail-simplicity-pilot-results.md) records that the Ponytail composition paired live battery was unavailable. It is not an integrity-gated manifest.

[karpathy-guidelines-pilot-results.md](./karpathy-guidelines-pilot-results.md) records the Karpathy-inspired guidelines paired live battery (Cursor / grok-4.6, 4/4 empirical-neutral). It is not an integrity-gated manifest and is separate from the Ponytail results.

Layers:

- **Outcome** — derived from the resulting tree, patch/overlay, tests, and final answer
- **Routing** — `appropriate` | `miss` | `violation` (Methodrail skill names never fail a baseline that did the work)
- **Cost** — skills, references, subagents, real verification commands, latency
- **Operational quality** — `clean` | `wasteful` | `violating`

The integrity gate fails on missing pairs, missing artifacts, broken graders, specification `failed`, or guardrail `missed`. It does **not** fail on empirical `harmed`.
