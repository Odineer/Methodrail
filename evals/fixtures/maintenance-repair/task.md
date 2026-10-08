Finding T1 is selected: `npm test` fails because `package.json` points at missing `scripts/run-tests.mjs`. The working product check is `scripts/tests.mjs`.

Repair only that selected failure. Preserve `notes/USER_WIP.md`. Leave `src/quiet/format.js` and every unselected file unchanged. Existing scripts are sufficient. Do not add a verification skill.

Revalidate the failure before editing. After the edit, prove `npm test` passes.

Put a fenced `yaml` `maintenance_report` in the answer. A later run against the repaired tree uses `mode: repaired-rerun` and must not edit again. See `README.md`.
