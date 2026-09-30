# Skill mechanics

The skill-specific branch of [writing-for-agents](SKILL.md): what changes when the document is a skill (frontmatter, the invocation choice, and router skills). Everything else about writing it is the universal reference in `SKILL.md`.

Methodrail workflow skills are the lifecycle entrypoints. Do not create a competing global router.

## Invocation

`disable-model-invocation` controls **host discovery**, not whether an already-active skill may load another named skill.

### Host discovery

Two choices, trading the two loads:

- **Model-invoked** — omit `disable-model-invocation`. The host may load the skill from its `description` without the user naming it. Typing the name still works. The description is an always-loaded context pointer; write it for mixed-intent trigger branches.
- **Explicit** — set `disable-model-invocation: true`. The host must not load the skill from mixed intent or from the description alone. The description is human-facing. Zero autonomous discovery load.

Pick model-invocation when mixed-intent discovery must reach the skill. If the skill is expensive, or should appear only after a human or an already-active parent named it, make it explicit.

Methodrail already marks workflow entry skills and high-cost operators explicit. Do not silently flip those to model-invoked.

### Parent composition

An already-active skill loads a named skill when **its own procedure** says to and the procedure's conditions match. That is **workflow-callable**, not host discovery. `disable-model-invocation` does not mean "only a human typing the name may ever cause this skill to run."

A human-started workflow may therefore load listed explicit skills on the path that justifies them: `/develop` → `wayfinder` / `architect` / `prototype`; `/methodrail-init` → `create-verification-skill` in discovery mode before confirmation and in application phase after it. `/develop`, `/debug`, and `/refactor` load `create-verification-skill` or task-scoped `maintain-verification-skill` only when [verification lifecycle](../../references/verification-lifecycle.md) selects them. Making a skill workflow-callable does not change `disable-model-invocation`.

**Suggest-only** is a stricter explicit skill: the active skill names it and waits for the user to invoke it. `interrogate` is suggest-only.

Shared reference that two explicit skills both need can live in neither. Push it to a Methodrail `references/` file any skill can point at.

## Splitting by invocation

Split off a model-invoked skill when you have a distinct leading word that should trigger it from mixed intent. You pay context load for the new always-loaded description, so that independent host discovery has to be worth it. Parent composition does not require flipping a skill to model-invoked.

## Router skills

When explicit skills multiply past what a human can remember, a **router skill** names the others and when to reach for each. Methodrail's routers are the native workflow skills: `methodrail-init`, `investigate`, `develop`, `debug`, `refactor`, `review`.

Do not add `ask-matt`, `poteto-mode`, or `using-superpowers`. Do not let `wayfinder` or `architect` become global routers.

A router follows its procedure: load a listed skill when that procedure's conditions match, including explicit skills that are not suggest-only. Keep expensive explicit skills off the cheap path. Host discovery of those explicit skills stays off.

## Methodrail evals

A Methodrail skill is not done when the prose looks good.

```text
Observed recurring agent failure
        ↓
Does Methodrail already solve it?
        │
        ├── yes → improve/eval existing capability
        │
        └── no
             ↓
Does proven upstream work solve it?
        │
        ├── yes → adopt/adapt
        │
        └── no → design a new skill
             ↓
write using writing-for-agents principles
             ↓
baseline behavior
             ↓
skill-enabled behavior
             ↓
pressure cases where relevant
             ↓
ship only when behavior improves
```
