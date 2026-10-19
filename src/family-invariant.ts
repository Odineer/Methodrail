import { readFileSync } from "node:fs";
import { join } from "node:path";

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

export function renderClaude(body: string): string {
  return [
    "# Methodrail",
    "",
    body,
    "",
    "Use installed Methodrail skills from `.claude/skills/` only when their descriptions match the task.",
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

export function hostProjections(body: string): Record<string, string> {
  return {
    "rules/methodrail.mdc": renderCursorRule(body),
    "adapters/claude/CLAUDE.md": renderClaude(body),
    "adapters/codex/AGENTS.md": renderCodex(body),
    "adapters/zcode/AGENTS.md": renderZcode(body),
  };
}
