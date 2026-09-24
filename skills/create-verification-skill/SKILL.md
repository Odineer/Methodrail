---
name: create-verification-skill
description: "Generate a project-local verification skill that drives the app the way a user does. Interview the repository, not the user. Use when explicitly requested, or in generate mode during methodrail-init's confirmed apply phase. Do not use on libraries with no runnable surface."
disable-model-invocation: true
---

# Create a verification skill

Every serious runnable project needs a scripted way to drive the real app and prove behavior. This skill generates that as a **project-local** skill tailored to the repo. You write the generator's output for the next agent, not for a human: it will be read cold, mid-task, by an agent that has never seen the app. Write it with `writing-for-agents`.

Do not copy global Methodrail skills into the project. This generates only project-specific verification.

## Discover

Answer the interview below from the repository. Return the surface, the proposed skill path, and the file list. Do not write the skill, control documentation, feature files, or execute them. When `methodrail-init` is investigating or previewing, stop at the end of this section.

## Generate

Run this section only during `methodrail-init`'s confirmed apply phase, or when the user invoked `create-verification-skill` directly. An unqualified request from `methodrail-init` before confirmation stays in Discover.

## 1. Interview the repo, not the user

Answer these from the codebase and only ask the user what you cannot observe:

- **Surface:** what does a user actually touch? Web UI, CLI/TUI, desktop, API, mobile, library? Pick the primary one and note the rest.
- **Run:** how does the app start locally? Prefer the repo's own documented command. Note ports, env vars, seed data, auth.
- **Drive:** how can an agent interact programmatically? Existing harnesses first. Only then pick a generic recipe.
- **Observe:** what evidence can be captured?
- **Isolate:** can two instances run side by side? If not, say so: refusing to double-drive a shared instance beats corrupting the user's session.
- **Reset / stop:** how is state restored and the process torn down?

If the checkout doesn't build or start as-is, report it precisely and stop. Do not repair product code from this skill. Under `methodrail-init`, that is a blocker, not a license to edit the app.

If there is no meaningful executable surface (pure library, docs-only, generated bindings), do **not** invent runtime infrastructure. Document appropriate static verification instead and stop.

## 2. Generate the skill

Write the skill in the repository's established native skill location, preferring:

```text
.agents/skills/verify-<app>/SKILL.md
```

Fall back to `.cursor/skills/verify-<app>/` or `.claude/skills/verify-<app>/` only when that is already the project's convention. YAML frontmatter is required (`name: verify-<app>` and a description that names the app, the surface, and when to reach for it). If `methodrail-init` selected linked external storage, it records verification under `.methodrail/control/` instead of invoking this skill.

Sections, each grounded in what the interview actually found (no placeholders):

- **Launch:** exact command, readiness signal, teardown. For a short-lived CLI there is no server to keep alive.
- **Doctor:** one read-only check that answers "is this instance worth driving?"
- **Drive:** harness recipe with real selectors/commands from this repo.
- **Evidence:** what to capture and where. Exercise the real user path. Capture action and resulting state. Verify side effects. Mocks only at production boundaries.
- **Cleanup:** tear down instances the run created. Never kill by process name. Evidence survives teardown.
- **Helpers:** any shipped script is executable and its invocation is shown in the skill body.

Also record start/doctor/drive/inspect/capture/reset/stop in `.methodrail/control/CONTROL.md` when those steps are non-obvious. `PROJECT.md` should point at both.

## 3. Seed the feature map

Create `features/README.md` plus one file per user-facing feature you can identify (aim for the top 3–5). Follow [`references/feature-map-example/`](references/feature-map-example/). Each file answers, from the user's point of view: what the feature is, how to reach it, how to drive it, and what observable end state proves it works. Required H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, `Gotchas`. Optional `Related project knowledge` may sit immediately after `Sub-features`.

Read canonical docs and eligible knowledge as discovery inputs. Confirm every user path from current source and live behavior. Docs alone do not prove a feature exists. Link only knowledge that materially constrains or explains a feature. Do not copy claims into the map.

## 4. Prove the generated skill before handing it over

Run its own instructions end to end once: launch, doctor, drive ONE mapped feature, capture evidence, clean up. After cleanup, confirm the evidence still exists. A generated skill that was never executed is a draft, not a deliverable.

## 5. Offer the maintenance loop

Point at `maintain-verification-skill` for keeping the map honest as the app changes.

## Neighbors

```text
Usually follows:              methodrail-init
Often produces:               project-local verify skill; feature map; CONTROL.md pointers
Escalate to:                  maintain-verification-skill, writing-for-agents
Avoid combining automatically with: how, architect
```

```text
Init                          → methodrail-init
Later upkeep                  → maintain-verification-skill
Agent-facing prose            → writing-for-agents
```
