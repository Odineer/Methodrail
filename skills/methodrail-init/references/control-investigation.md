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

If the project has a meaningful executable surface (UI, CLI, service, desktop app), record that an in-repository verification skill is warranted. Generation waits for the confirmed apply phase. This investigation stays read-only. Do not force runtime verification infrastructure onto libraries, docs-only repos, or other projects where it is inappropriate.

If those answers are obvious from a single package script, plan to record the commands in `.methodrail/PROJECT.md` and skip `CONTROL.md` unless the confirmed verification skill still needs a home for non-obvious drive/evidence steps.

If they are non-obvious, coordinated, or easy to get wrong, generate `.methodrail/control/CONTROL.md` using `templates/project/control/CONTROL.md` as a skeleton. The project-local verify skill remains the agent-facing procedure; `CONTROL.md` is the index of commands.

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
