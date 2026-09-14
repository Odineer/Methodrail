# Upstream maintenance

Adapted skills must not drift silently, and they must not be overwritten blindly.

```text
upstream skill changed
↓
inspect upstream diff
↓
understand behavioral reason
↓
apply relevant changes manually
↓
preserve Methodrail integration
↓
run Methodrail behavioral evals
↓
update recorded upstream SHA
↓
record noteworthy change
```

Never automatically overwrite Methodrail adaptations.

## Records

- Repository, license, and reviewed SHA: `upstreams/*.yaml`
- Per-skill origin and modifications: `skills/<name>/UPSTREAM.md`
- Required notices: `THIRD_PARTY_NOTICES.md`
- Ownership: `references/capability-map.md`
- Classification of considered skills: `references/upstream-skill-matrix.md`

## Checking for upstream changes

```bash
npm run check-upstreams
```

The script reads recorded repositories and commits, queries current upstream HEAD when the network is available, and reports `current` or `changed`. It never writes skills.

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
