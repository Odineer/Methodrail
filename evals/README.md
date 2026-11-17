# Evals

These evals are for Methodrail maintainers. Consuming projects do not run them.

```text
fixture
    │
    ├── baseline agent without Methodrail
    │
    └── agent with Methodrail
            │
            ▼
        comparison
            │
            ▼
        judgment
```

The runner scores recorded runs. It is not an agent runtime.

## Layout

- `evals/routing/` — mixed-intent skill selection
- `evals/behavioral/` — whether loading a skill improves behavior
- `evals/pressure/` — discipline under schedule, shotgun, inference, and environment pressure
- `evals/complexity/` — simple work must not activate expensive operators
- `evals/composition/` — skills should reinforce each other
- `evals/fidelity/` — upstream behavior must not be weakened
- `evals/fixtures/` — mini-repos with task, expected behavior, and forbidden behavior
- `evals/runners/` — fixture validation, scoring, and comparison
- `evals/reports/` — comparison report format and generated output
- `skills/<name>/evals/` — per-skill positive and negative routing

## Running

```bash
npm run eval
npm run eval -- validate
npm run eval -- score evals/runners/examples/simple-change.methodrail.json
npm run eval -- compare evals/runners/examples/simple-change.baseline.json evals/runners/examples/simple-change.methodrail.json
```

`npm test` / `npm run validate` check fixture shape, unique ids, coverage, and that host projections match the family invariant.

`maintenance-audit`, `maintenance-repair`, and `maintenance-verification` are constructed specification fixtures. Their canonical pairs must not be labeled as live improvement. Outcome graders live in `src/composition/grade-maintenance-trace.ts`.

To evaluate live agents:

1. Run the fixture task without Methodrail skills.
2. Run the same task with Methodrail available in a fresh context.
3. Record a JSON run for each condition (`evals/runners/examples/` is the schema).
4. Compare. A longer Methodrail path can still win if it prevents an expensive miss.

For Claude Code, `evals/runners/run-claude-code.sh <fixture> <baseline|methodrail> <dest> [skill]` runs `claude -p` on a fresh copy of the fixture. The methodrail condition loads this checkout with `--plugin-dir`. Then `node evals/runners/collect-claude-code-run.mjs <dest> <fixture> <condition> claude-code-r<n>-<condition>` writes the artifacts and a draft run. Fill in `evidence`, `behaviors_observed`, and `failure_modes` after reading the transcript. The standalone CLI must be logged in (`claude auth login`).

## Reports

A comparison should answer: did Methodrail help, where, at what cost, and what extra complexity appeared. Track skill count, loaded references, subagents, verification steps, and latency when known. Do not optimize only for fewer actions.
