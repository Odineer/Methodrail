# Maintenance repair fixture

Selected repair of one broken canonical command. `scripts/tests.mjs` already proves checkout. `src/quiet/format.js` is unselected. `notes/USER_WIP.md` is unrelated user work.

```bash
npm test
node scripts/tests.mjs
```

## Report fields

```yaml
maintenance_report:
  mode: repair
  selected: [T1]
  target: package.json
  evidence_current: true
  product_defects: []
```

Set `evidence_current: false` when the selected finding was not rechecked against the current tree. A repaired-state rerun uses `mode: repaired-rerun` and records no `edit` phase.
