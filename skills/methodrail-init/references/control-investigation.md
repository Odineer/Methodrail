# Control investigation

During initialization or refresh, explicitly investigate:

```text
How do I start this project?
How do I know it is ready?
How do I drive representative behavior?
How do I inspect state?
How do I capture evidence?
How do I reset it?
How do I stop it?
```

If the project has a meaningful executable surface (UI, CLI, service, desktop app), record that verification guidance is warranted. Invoke `create-verification-skill` in discovery mode and return the proposal. Do not invoke `create-verification-skill` in generate mode from this reference. This investigation stays read-only. Do not force runtime verification infrastructure onto libraries, docs-only repos, or other projects where it is inappropriate. Existing tests or scripts that already prove the behavior are the proposal; do not generate a skill only because one is absent.

If those answers are obvious from a single package script, plan to record the commands in `.methodrail/PROJECT.md` and skip `CONTROL.md` unless the confirmed verification skill still needs a home for non-obvious drive/evidence steps.

If they are non-obvious, coordinated, or easy to get wrong, propose `.methodrail/control/CONTROL.md` using `templates/project/control/CONTROL.md` as a skeleton for the confirmed apply phase. The project-local verify skill remains the agent-facing procedure; `CONTROL.md` is the index of commands. Linked external placement keeps that guidance under `.methodrail/control/` rather than a tracked native skill.

Possible sections:

```text
Start
Doctor/readiness
Drive
Inspect
Capture
Reset
Stop
Known limitations
```

Do not invent capabilities. Use real repository commands and real tooling. If a step cannot be performed in this environment, record the limitation instead of fabricating a procedure.
