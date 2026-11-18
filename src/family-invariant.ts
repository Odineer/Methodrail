import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPLICIT_SKILLS, SUGGEST_ONLY_SKILLS } from "./skill-invocation.js";

export const INVARIANT_START = "<!-- methodrail-family-invariant:start -->";
export const INVARIANT_END = "<!-- methodrail-family-invariant:end -->";
export const CANONICAL_INVARIANT = "references/methodrail-family-invariant.md";

export function extractInvariantBody(source: string): string {
  const start = source.indexOf(INVARIANT_START);
  const end = source.indexOf(INVARIANT_END);
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Family invariant markers are missing or inverted");
  }
  return source.slice(start + INVARIANT_START.length, end).trim();
}

export function readCanonicalInvariant(root: string): string {
  return extractInvariantBody(readFileSync(join(root, CANONICAL_INVARIANT), "utf8"));
}

export function renderCursorRule(body: string): string {
  return [
    "---",
    "description: Methodrail's cross-cutting engineering invariants",
    "alwaysApply: true",
    "---",
    "",
    body,
    "",
  ].join("\n");
}

// Skills Claude Code bundles under the same names as shipped Methodrail skills.
export const CLAUDE_BUNDLED_SKILL_NAMES = ["simplify", "code-review"] as const;

export function renderClaude(body: string): string {
  const bundled = CLAUDE_BUNDLED_SKILL_NAMES.map((name) => `\`${name}\``).join(" and ");
  return [
    "# Methodrail",
    "",
    body,
    "",
    "Use installed Methodrail skills only when their descriptions match the task.",
    "",
    `Under the plugin install, Methodrail skills are namespaced \`methodrail:<name>\`, and a skill named inside a Methodrail skill means that one. Claude Code's bundled ${bundled} are different skills.`,
    "",
    "The Skill tool cannot load a skill marked `disable-model-invocation: true`. When an active Methodrail skill names one, read `../<name>/SKILL.md` from the active skill's base directory.",
    "",
  ].join("\n");
}

export function renderCodex(body: string): string {
  return [
    "# Methodrail",
    "",
    body,
    "",
    "Use installed Methodrail skills from `.agents/skills/` only when their descriptions match the task.",
    "",
  ].join("\n");
}

export function renderZcode(body: string): string {
  return [
    "# Methodrail",
    "",
    body,
    "",
    "Use installed Methodrail skills only when their descriptions match the task.",
    "",
  ].join("\n");
}

// Kilo Code reads only `name` and `description`, so the explicit-invocation
// guard that other hosts take from frontmatter lives in the projected rule.
export function renderKilo(body: string): string {
  const suggestOnly = new Set<string>(SUGGEST_ONLY_SKILLS);
  const explicit = [...EXPLICIT_SKILLS].filter((name) => !suggestOnly.has(name));
  const list = (names: readonly string[]) => names.map((name) => `\`${name}\``).join(", ");
  return [
    "# Methodrail",
    "",
    body,
    "",
    "Use installed Methodrail skills only when their descriptions match the task.",
    "",
    `Kilo Code ignores \`disable-model-invocation\` and \`when_to_use\`. Load these Methodrail skills only when the user names them or an active Methodrail skill's procedure names them: ${list(explicit)}. Suggest ${list([...suggestOnly])} by name and wait for the user to ask for it.`,
    "",
  ].join("\n");
}

export function hostProjections(body: string): Record<string, string> {
  return {
    "rules/methodrail.mdc": renderCursorRule(body),
    "adapters/claude/CLAUDE.md": renderClaude(body),
    "adapters/codex/AGENTS.md": renderCodex(body),
    "adapters/zcode/AGENTS.md": renderZcode(body),
    "adapters/kilo/methodrail.md": renderKilo(body),
  };
}
