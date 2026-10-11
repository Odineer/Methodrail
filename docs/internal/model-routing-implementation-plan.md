# Task-based model selection and refresh

Status: proposed implementation plan for Cursor. Prepared 2026-10-05.

## Outcome

During `/methodrail-init`, configure model selection around the work an agent performs. Later, `/refresh-model-routing` checks changed host capabilities and available models, then refreshes the same configuration without reinitializing the project.

Use native host routing and per-subagent model controls. Methodrail supplies a small policy and selection procedure; it remains methodology plus a project harness. Do not introduce an agent runtime, routing service, scheduler, mandatory SDK dependency, or model calls from a custom classifier.

## Existing implementation

- `skills/methodrail-init/SKILL.md` already has inspect, preview, confirmation, application, and idempotency phases. Model configuration joins those phases.
- `references/host-capabilities.md` owns hardcoded Cursor model defaults and an optional user override at `~/.cursor/rules/pstack-models.mdc`. Existing skills select named roles through this reference.
- `tests/invocation-contract.test.ts` asserts those fixed model slugs and their absence from skill bodies. Replace the fixed-slug assertions with policy and fallback contracts.
- `.methodrail/PROJECT.md` is the index. Harness placement can be in the repository or linked external storage. Generated artifacts must follow that placement.
- `src/` is maintainer validation infrastructure, not a consumer runtime. Any script a consuming skill needs must be bundled with the skill and work from an installed plugin without this repository's TypeScript tooling.
- There are pre-existing working-tree changes. Preserve them; implement this feature without reverting or committing unrelated work.

## Host capability boundary

The initial research supports these mechanisms. Cursor must recheck current documentation and the installed host before implementing or claiming support.

| Surface | Supported direction | Limit to report |
| --- | --- | --- |
| Cursor parent agent | Prefer native Auto; use Balance where Router is available | The documented Router currently requires Teams or Enterprise. A rule cannot be assumed to change the active model picker. Detect support and report any one-time picker action. |
| Cursor subagents | Parent supplies a supported model at launch; custom definitions can use `model` | Account, plan, and organization restrictions can cause substitution. Do not assume a configured model actually ran. |
| Claude Code parent | A native hybrid such as `opusplan` can separate planning from execution | This is a plan/execute split, not arbitrary per-task routing. Existing explicit model choices and managed settings take precedence. |
| Claude Code subagents | Per-invocation models or model frontmatter, using supported aliases or IDs | Alias resolution depends on host version, provider, session, overrides, and organization policy. |
| Other hosts | Use their documented model controls when available | Otherwise keep the native default and report the limitation. |

Sources: [Cursor Router](https://cursor.com/docs/cursor-router), [Cursor subagents](https://cursor.com/docs/subagents), [Claude Code model configuration](https://code.claude.com/docs/en/model-config), [Claude Code subagents](https://code.claude.com/docs/en/sub-agents). Claude also documents a turn-scoped skill `model` override in [skills](https://code.claude.com/docs/en/skills); keep that out of canonical portable skills in the first release to avoid host-specific copies.

Do not treat `auto`, `inherit`, and an omitted model argument as interchangeable. Auto is host routing; inherit follows the parent; omission follows that tool's documented default.

## Policy design

Add one optional project artifact, `.methodrail/MODELS.yaml`, indexed by a single link from PROJECT.md. Use the canonical `.methodrail` path for either harness placement. Adopt an existing authoritative policy by pointer instead of creating a competing file.

Keep logical policy separate from concrete host bindings within the file:

- Schema version and unmistakable Methodrail ownership.
- Preference: `balanced` by default, with `cost` and `quality` alternatives. Existing project or user preferences win; do not ask every project the same question.
- Three logical tiers: `fast`, `balanced`, and `deep`.
- Role-to-tier mappings, optional capability requirements, and diversity requirements for multiple reviewers.
- User-pinned role overrides that refresh preserves.
- Per-host bindings: native parent strategy and each tier's supported selection, approved fallback, and supported effort parameters.
- Evidence for bindings: host version/provider, discovery source, observation date, availability status, and rationale. Availability may be `observed`, `documented-only`, or `unknown`.
- Freshness policy: suggest a review after 30 days by default, or immediately after host/provider changes or a rejected selection. This is a review threshold, not a guarantee of correctness.

Avoid a complete catalog or price table in permanent context. Store only relevant bindings and evidence. A public model listing does not establish access for the user's account. Never store API keys or account identifiers. For shared repositories, keep the policy portable: mark bindings as evidence from a host environment, and revalidate local access before use rather than asserting every collaborator can use them.

Prefer supported moving aliases or native Auto when the user wants upgrades to follow the host. Preserve exact pins when requested. A newer version number alone does not establish better task performance or an acceptable price. Current official guidance can justify a provisional binding; live outcomes are needed for claims that it improves Methodrail.

Do not persist fresh timestamps on every inspection. If policy, bindings, and material evidence are unchanged, produce no diff. A successful recheck can be reported in chat without rewriting the artifact solely to reset its age.

## Selection procedure

Keep this procedure in a shared reference, loaded when selection is relevant:

1. Honor explicit user model choices, managed restrictions, existing authoritative project policy, and preserved pins. Optional legacy user role overrides remain overrides, not a dependency Methodrail installs.
2. Inspect the task or subtask's scope, uncertainty, risk, and required capabilities. Use the smallest suitable tier; skill name alone is insufficient.
3. Resolve the role through the project's policy and the current host's supported bindings. With no project policy, use native Auto or the host default.
4. Use the host's supported control: native parent routing or the model argument for an already-justified subagent. Do not spawn a worker merely to change the model for a tiny task.
5. Escalate when evidence shows a reasoning gap, increased uncertainty, or wider risk. A failed test caused by an ordinary coding mistake is not by itself a reason to change models.
6. On an unavailable model, use a prevalidated allowed fallback, otherwise inherit/default. Retry at most once for a model-selection rejection; do not guess slugs or repeatedly retry billing/authentication errors.
7. Keep the task moving with the supported fallback. Report a material substitution or loss of capability; suggest `/refresh-model-routing` when bindings need repair.

| Work | Initial tier | Escalation signal |
| --- | --- | --- |
| Bounded search, mechanical edits, documentation, running existing checks | Fast, or remain in the parent for tiny work | Conflicting evidence or complex interpretation |
| Normal feature implementation, focused debugging, refactoring, ordinary review | Balanced | Root cause remains unknown, scope widens, or important invariants are unclear |
| Architecture, difficult investigations, security-sensitive reasoning, data migrations | Deep | Capability requirements or independent judgment remain unmet |
| Competing designs and independent critique | Balanced/deep according to risk; diverse families when possible | Available models cannot provide the requested diversity |

Map every existing role: arena runners/cross-judge, architect runners, how explorer/explainer, why investigators/synthesizer, interrogate reviewers, reflect judgment/divergent/tooling/synthesizer, swarm workers, hillclimb, and perf-issue. Cheap exploration is distinct from difficult synthesis. Diverse reviewers should not silently collapse into the same family. On a host that exposes only one family, use independent contexts and state the diversity limitation.

Routine work uses saved policy and current tool capabilities. It does not browse model catalogs, benchmark models, write routing logs, or run refresh automatically. Show concise selection reasoning for meaningful escalation or fallback; report the actual model only when the host exposes it.

## Init integration

1. During repository inspection, discover existing model instructions, pins, native configuration, and the active host's capabilities. Read relevant configuration fields only.
2. Compose `refresh-model-routing` in discovery mode to propose policy/bindings. Do not write or change settings during inspection.
3. Add the policy artifact, PROJECT.md pointer, and any necessary supported host setting to the existing init preview. Use the established create/update/adopt/unchanged/conflict/unavailable classifications.
4. Apply the confirmed preview using existing merge and harness-binding rules. Init's confirmation covers the model work too; avoid a second confirmation for the same targets.
5. Validate the artifact and thin integration. Distinguish configured, observed-working, manual-picker-action-required, and unavailable outcomes.

For linked external placement, keep policy in external harness storage through the canonical link. Do not create tracked native agent files or settings solely to project routing. Use existing global integration and supported invocation controls; otherwise report the limitation.

Do not install both Cursor and Claude integrations for compatibility. Generating multiple specialist agent files is unnecessary when the host can accept model arguments at invocation. Never alter global user model settings as a side effect of project init.

## One new skill: refresh-model-routing

Create `skills/refresh-model-routing/SKILL.md`, with `disable-model-invocation: true`. It is manually invocable and workflow-callable by an already-active init procedure.

Use it when asked to configure models, update model bindings, reconsider cost/quality preferences, or repair rejected selections. Keep it dark during ordinary development and ambiguous mentions of models.

Workflow:

1. Inspect the existing policy, binding, host version/provider, override sources, and supported controls.
2. Discover actual available choices using a documented host catalog/tool where accessible. If unavailable, consult current official host documentation and mark access unverified. Do not add an API key or SDK dependency merely to list models.
3. Check current documented alias/parameter behavior and relevant model changes. Candidate quality guidance must be labeled as guidance, not a benchmark result.
4. Propose only material changes, with previous/new selection, reason, evidence, and affected roles. Preserve preferences, pins, curated content, and unrelated settings.
5. Preview conflicts and writes; apply when the user explicitly requested application or confirmed the preview. Inspect-only requests remain read-only. Reuse init's authorization when composed there.
6. Validate schema and supported parameters. Live model probes must be explicitly requested because they consume model usage; configuration validation alone must not be labeled live proof.
7. Report changes, preserved pins, unavailable/unknown bindings, and native session/picker actions. The skill does not rerun full init or refresh unrelated project knowledge.

Offline operation preserves valid bindings, reports freshness/access uncertainty, and uses native fallback when needed. A missing or broken linked harness is a placement problem: stop writes rather than silently create a second harness. Standalone configuration in an uninitialized repository should direct placement setup through init.

## Implementation slices

### 1. Shared contract and artifact

- Add `references/model-routing.md` for tiers, precedence, selection, fallback, and evidence semantics.
- Replace concrete defaults in `references/host-capabilities.md` with logical roles and a link to that reference. Remove the closest-slug guessing fallback.
- Add a minimal skeleton at `templates/project/MODELS.yaml` and a schema reference beside the new skill.
- If deterministic parsing/validation is needed, bundle a small `.mjs` helper under the new skill; expose a maintainer wrapper in `src/` using existing harness-binding infrastructure. Do not add a consumer execution engine.

### 2. Refresh skill and init composition

- Implement the single new skill and its discovery/application phases.
- Update init and relevant references: repository interview, optional artifacts, integrations, merge semantics, and completion checklist.
- Add a `model-policy` artifact role to `src/artifacts.ts` where necessary; ensure models YAML does not get classified as typed knowledge or a generic plan.
- Extend maintainer validation and explicit-skill registration in `src/validate.ts`, including required positive/negative routing coverage and behavioral coverage.

### 3. Host guidance and existing roles

- Update Cursor and Claude adapter documentation with supported controls and manual limitations.
- Preserve existing role references in skills where possible. Add a small selection pointer to ordinary workflow guidance only if needed to cover non-subagent work.
- If the family invariant needs a pointer, update its canonical source, run `npm run project-hosts`, and keep projected context within repository limits.
- Do not modify historical eval recordings or upstream provenance to replace old model names.

### 4. Validation, evals, and docs

- Update `tests/invocation-contract.test.ts` to assert logical roles, override precedence, no fixed release defaults in canonical skill bodies, and correct Auto/inherit semantics.
- Add meaningful artifact/helper tests for schema errors, pins, conflicts, linked placement, and no-op refresh.
- Add positive/negative skill routing fixtures, behavioral and pressure cases, and init/refresh composition coverage using existing eval conventions.
- Document `/methodrail-init` setup and `/refresh-model-routing` maintenance in README and capability documentation. Use writing-for-agents principles for skill prose.
- Run `npm run project-hosts` if needed, then `npm run check`. Before live Cursor observations, run `npm run doctor` and resolve a stale plugin using the existing install workflow.

## Acceptance checks

1. Fresh init previews a balanced task policy and applies it under the selected harness placement; repeat init produces no diff.
2. Existing custom model choices remain intact or are reported as conflicts. Refresh does not overwrite pinned IDs or unrelated settings.
3. Bounded exploration and uncertain architecture resolve to different appropriate tiers when the host supports them. A tiny task creates no extra agent or model research.
4. Cursor Auto is used only where available and enabled; model arguments are selected from supported choices. Claude uses its own aliases and controls, never Cursor slugs.
5. A newer model release can be adopted by native alias/Auto behavior or a targeted refresh. Refresh keeps role policy stable unless the user changes preferences.
6. Rejected or removed models fall back without an unbounded retry loop. Restricted, offline, and model-control-unavailable cases remain usable and accurately reported.
7. Multi-reviewer workflows preserve requested diversity when supported, and explicitly report its absence otherwise.
8. Inspect-only init/refresh writes nothing. Linked external placement adds no tracked native projections.
9. Invalid policy, broken binding, or unknown catalog access cannot produce a fabricated claim that routing works. Configuration checks and live evidence are reported separately.
10. Second refresh with identical material inputs is byte-identical. Existing repository checks pass.

First prove the contracts with constructed fixtures. Then compare baseline and policy-enabled native-host runs on a tiny edit, normal feature, and difficult investigation, recording supported selection, outcome, overhead, and available usage evidence. Cost and latency savings are hypotheses until measured; a pilot with one model/account is not general proof.

## Cursor handoff prompt

> Implement `docs/internal/model-routing-implementation-plan.md` in Methodrail. Add task-based model policy setup during methodrail-init and exactly one global skill, refresh-model-routing. Replace hardcoded model defaults with logical roles and supported native host bindings. Recheck current Cursor and Claude documentation and installed-host controls before implementing adapters. Preserve user pins, existing instructions, linked external placement, and unrelated working-tree changes. Keep ordinary work cheap and Methodrail free of a custom agent runtime. Implement in the four slices, add the specified contract/eval coverage, run the required checks, and report which selections are configured versus observed working or require a native picker action.
