---
name: refresh-model-routing
description: "Configure or refresh task-based model policy and host bindings. Use when asked to configure models, update model bindings, reconsider cost or quality preference, or repair a rejected model selection. Workflow-callable from methodrail-init. Stay idle for ordinary development and for an ambiguous mention of models."
disable-model-invocation: true
---

# Refresh model routing

Keep one project model policy aligned with the work agents do and with the models this host can actually select. The policy lives at `.methodrail/MODELS.yaml`. Selection rules live in [model routing](../../references/model-routing.md). Field rules live in [schema](references/schema.md).

The bundled checker is `scripts/models-policy.mjs` in this skill directory. Run it with `node`. It validates and plans. It does not write files, call models, or install an SDK.

## When

Use this skill when the user asks to configure models, update bindings, change cost or quality preference, or repair a rejected selection.

`methodrail-init` loads this skill in discovery mode while inspecting, then applies it under the same confirmation as the rest of the harness plan.

Leave it idle during ordinary development, a tiny edit, or a vague mention of models. Saved policy and the host's current controls are enough.

## Workflow

1. Resolve placement. If `.methodrail` is missing, stop and direct placement through `methodrail-init`. If the link is broken or bound to another repository, stop. Do not create a second harness. Completion: placement is ready, uninitialized, or unavailable.
2. Read the existing policy, pins, native model settings, and the optional user role override named in [host capabilities](../../references/host-capabilities.md) when that file exists. Read the model fields only. Completion: preference, pins, and conflicts are named.
3. Discover choices. Run `node scripts/models-policy.mjs propose --host <cursor|claude|other>`. Use a documented host catalog when the host already exposes one. If it does not, keep `documented-only` or `unknown`. Do not add an API key or SDK to list models. Completion: every proposed binding has an availability label.
4. Check current alias and parameter docs for the active host. Label quality notes as guidance. Completion: no binding is described as a benchmark or as measured Methodrail improvement.
5. Build the material diff: previous, new, reason, evidence, and affected roles. Preserve preference, pins, curated prose, and unrelated settings. Run `node scripts/models-policy.mjs plan --current <file> --proposed <file>`, adding `--apply-preference` only when the user changed preference. Completion: a no-op plan writes nothing, including when only a timestamp would change.
6. Preview conflicts and paths. Apply only when the user asked to apply, confirmed the preview, or `methodrail-init` confirmation already covers these paths. An inspect-only request stops here. Completion: preview changed no files.
7. Validate with `node scripts/models-policy.mjs validate --file <file>`. Report configuration separately from live evidence. Run a live model probe only when the user explicitly asks; it spends model usage. Completion: invalid policy, a broken binding, and unknown catalog access stay failures, not proof that routing works.
8. Report changes, preserved pins, unavailable or unknown bindings, and any picker or session action the host still requires. Cursor Auto and its Balance, Cost, or Intelligence mode are picker actions. Claude `opusplan` and aliases are session or settings choices and lose to an existing explicit or managed model. Do not rerun full init. Completion: the report distinguishes configured, recorded-observed, manual action required, and unavailable.

## Offline and restricted hosts

Keep a valid policy. Say that freshness and account access are uncertain. Use the native fallback. A rejected id uses its prevalidated fallback once, then omits `model`. Billing and authentication errors stop without a retry.

## Neighbors

```text
Usually follows:              methodrail-init
Often produces:               .methodrail/MODELS.yaml
Escalate to:                  model routing reference
Avoid combining automatically with: arena, swarm, catalog research during ordinary work
```
