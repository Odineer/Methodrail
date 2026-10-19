# MODELS.yaml

Project model policy. One file at `.methodrail/MODELS.yaml`. Procedure: [model routing](../../../references/model-routing.md).

```yaml
schema_version: 1
owner: methodrail
preference: balanced
freshness_days: 30
roles:
  how explorer:
    tier: fast
pins: {}
hosts: {}
```

| Field | Meaning |
| --- | --- |
| `schema_version` | `1` |
| `owner` | `methodrail`. Any other owner is a conflict; do not overwrite the file. |
| `preference` | `balanced`, `cost`, or `quality`. Refresh preserves it unless the user changes it. |
| `freshness_days` | Review threshold. Default 30. Not a correctness guarantee. |
| `roles` | Every logical role from [model routing](../../../references/model-routing.md). `tier` is `fast`, `balanced`, or `deep`. `diversity: families` requests distinct families. `capabilities` is an optional list of required capability names. |
| `pins` | Role to exact model id. Refresh preserves every pin. |
| `hosts` | Host id to parent strategy, tier bindings, optional `supported` ids, and evidence. |

Parent strategy is `auto` on Cursor. Optional `router_mode` is `cost`, `balance`, or `intelligence` and describes the picker; it does not change the picker. Claude parent values are `opusplan`, `haiku`, `sonnet`, `opus`, `fable`, or `default`. Z Code and any other host use `default`.

Each tier has `selection`, `fallback`, and `effort`. `selection` and `fallback` are `inherit`, `omit`, or a supported id. `auto` is not a tier selection. Fallback must be `inherit`, `omit`, or a selection already present on that host. `effort` is a host parameter string or null.

`supported` lists ids that can satisfy a diversity request. Evidence requires `source`, `availability` (`observed`, `documented-only`, or `unknown`), and `rationale`. `host_version`, `provider`, and `observed_at` may be null. Do not store secrets or account identifiers. Do not set a field that means the policy writes host settings.

The skeleton in `templates/project/MODELS.yaml` is the balanced role map with no host bindings. Fill bindings from the installed host. Identical material input stays byte-identical; a timestamp-only change is not material.
