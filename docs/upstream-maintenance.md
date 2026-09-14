# Upstream maintenance

Adapted skills must not drift silently, and they must not be overwritten blindly.

Maintainer operator: [sync-upstream](../maintainer/skills/sync-upstream/SKILL.md). Policy stays here and in [CONTRIBUTING.md](../CONTRIBUTING.md).

```text
named upstream
↓
deterministic preflight JSON
↓
inspect upstream diff
↓
one worker per mapped Methodrail skill
↓
apply relevant tailored changes
↓
preserve Methodrail integration
↓
run Methodrail checks and relevant evals
↓
update recorded upstream SHA only when mapped items are resolved
↓
stop before commit
```

Never automatically overwrite Methodrail adaptations. New, SKIP, and COMPOSE upstream skills are report-only during a sync.

## Records

- Repository, license, and reviewed SHA: `upstreams/*.yaml`
- Per-skill origin and modifications: `skills/<name>/UPSTREAM.md`
- Required notices: `THIRD_PARTY_NOTICES.md`
- Ownership: `references/capability-map.md`
- Classification of considered skills: `references/upstream-skill-matrix.md`

## Checking for upstream changes

Human summary of every recorded source:

```bash
npm run check-upstreams
```

Structured preflight for one source (used by `sync-upstream`):

```bash
node scripts/check-upstreams.mjs --upstream matt-pocock --format json
```

The script reads recorded repositories and commits, queries current upstream HEAD when the network is available, and reports `current`, `changed`, or `unreachable`. JSON mode also lists changed paths, maps them onto Methodrail skills from `UPSTREAM.md` origins, and classifies unmapped skill paths against the matrix as discoveries. It never writes skills and never bumps a SHA.

## Import rules

1. Inspect the current upstream file and the license that applies to it.
2. Record the commit SHA.
3. Preserve copyright/license notices in `THIRD_PARTY_NOTICES.md`.
4. Keep provenance out of the skill prompt.
5. Preserve invocation semantics (`disable-model-invocation` for expensive/explicit skills).
6. Isolate host-specific model slugs and tracker assumptions.
7. Do not import competing global routers (`poteto-mode`, `ask-matt`, `using-superpowers`, Ponytail commands/hooks).
8. Record `Fidelity:` on `UPSTREAM.md`.
9. Run the [family integration](family-integration.md) checklist.
