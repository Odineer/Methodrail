---
name: create-verification-skill
description: "Generate a project-local verification skill that drives the app the way a user does. Use when explicitly requested, or when an authorized workflow names discovery or application. Do not use on libraries with no runnable surface, and do not generate only because a verify directory is absent."
disable-model-invocation: true
---

# Create a verification skill

Establish a reusable way to drive the real app and prove behavior. Follow [verification lifecycle](../../references/verification-lifecycle.md). The caller names the phase and the scope. Write the result for the next agent with `writing-for-agents`.

Do not copy global Methodrail skills into the project. Do not repair product code from this skill. Return a product defect to the parent workflow.

## Discovery

Inspect existing tests, scripts, harnesses, control documentation, and skills. Identify the surface and the observable success criteria. Determine launch, readiness, driving, evidence, isolation, and cleanup. Return the proposed files and any unresolved prerequisites.

Do not write repository files in discovery-only mode. When an adequate harness already proves the requested behavior, return that path and stop. `methodrail-init` investigation and preview stay in this phase.

## Application

Run this section only when the caller authorizes application: `methodrail-init`'s confirmed apply phase, a parent workflow whose lifecycle decision is `missing-path`, or a direct invocation of this skill. An unqualified request from `methodrail-init` before confirmation stays in Discovery.

## 1. Interview the repo, not the user

Answer these from the codebase and only ask the user what you cannot observe:

- **Surface:** what does a user actually touch? Web UI, CLI/TUI, desktop, API, mobile, library? Pick the primary one and note the rest.
- **Run:** how does the app start locally? Prefer the repo's own documented command. Note ports, env vars, seed data, auth.
- **Drive:** how can an agent interact programmatically? Existing harnesses first. Only then pick a generic recipe.
- **Observe:** what evidence can be captured?
- **Isolate:** can two instances run side by side? If not, say so: refusing to double-drive a shared instance beats corrupting the user's session.
- **Reset / stop:** how is state restored and the process torn down?

If the checkout doesn't build or start as-is, report it precisely and stop. If there is no meaningful executable surface, document appropriate static verification and stop.

## 2. Generate the skill

In-repository guidance uses the repository's established native skill location, preferring:

```text
.agents/skills/verify-<app>/SKILL.md
```

Fall back to `.cursor/skills/verify-<app>/` or `.claude/skills/verify-<app>/` only when that is already the project's convention. Linked external placement writes the procedure under `.methodrail/control/` and does not add a tracked native skill. YAML frontmatter is required for a native skill (`name: verify-<app>` and a description that names the app, the surface, and when to reach for it).

Preserve existing curated content. Sections, each grounded in the interview (no placeholders):

- **Launch:** exact command, readiness signal, teardown. For a short-lived CLI there is no server to keep alive.
- **Doctor:** one read-only check that answers "is this instance worth driving?"
- **Drive:** harness recipe with real selectors/commands from this repo.
- **Evidence:** what to capture and where. Exercise the real user path. Capture action and resulting state. Verify side effects. Mocks only at production boundaries.
- **Cleanup:** tear down instances the run created. Never kill by process name. Evidence survives teardown.
- **Helpers:** any shipped script is executable and its invocation is shown in the skill body.

Also record start/doctor/drive/inspect/capture/reset/stop in `.methodrail/control/CONTROL.md` when those steps are non-obvious. `PROJECT.md` should point at both.

## 3. Seed the feature map

Create `features/README.md` plus one file per user-facing feature you can identify (aim for the top 3–5). Follow [`references/feature-map-example/`](references/feature-map-example/). Each file answers, from the user's point of view: what the feature is, how to reach it, how to drive it, and what observable end state proves it works. Required H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with <harness>`, `Gotchas`. Optional `Related project knowledge` may sit immediately after `Sub-features`.

Read canonical docs and eligible knowledge as discovery inputs. Confirm every user path from current source and live behavior. Link only knowledge that materially constrains or explains a feature. Do not copy claims into the map.

## 4. Prove the generated skill before handing it over

Run its own instructions end to end once: launch, doctor, drive ONE mapped feature, capture evidence, clean up. After cleanup, confirm the evidence still exists. Failed or unexecuted output is a draft or blocked result, not proven infrastructure.

## 5. Offer the maintenance loop

Point at `maintain-verification-skill` for keeping the map honest as the app changes. Return the result to the parent. Do not open a pull request, commit, or release from this skill.

## Neighbors

```text
Usually follows:              methodrail-init, develop, debug, refactor
Often produces:               project-local verify skill; feature map; CONTROL.md pointers
Escalate to:                  maintain-verification-skill, writing-for-agents
Avoid combining automatically with: how, architect
```
