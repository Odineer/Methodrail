import { readFileSync } from "node:fs";
import { join } from "node:path";

export type HandoffEffect = "read" | "write" | "execute" | "implement";

export interface ArchitectHandoff {
  effects: HandoffEffect[];
  returns: string[];
  stopped: boolean;
}

function numberedSteps(source: string): string[] {
  const workflow = /## Workflow\n([\s\S]*?)(?:\n## |\n$)/.exec(source)?.[1] ?? "";
  return [...workflow.matchAll(/^\d+\. [\s\S]*?(?=^\d+\. |\n## |\s*$)/gm)].map((match) => match[0]);
}

function linkedMarkdown(step: string): string[] {
  return [...step.matchAll(/\(([^)]+\.md)\)/g)].map((match) => match[1] ?? "");
}

function writingMaintenance(text: string): boolean {
  for (const sentence of text.split(/(?<=\.)\s+/)) {
    if (!sentence.includes("maintain-verification-skill")) continue;
    if (!/\b(invoke|run)\b/i.test(sentence)) continue;
    if (/\b(do not|don't|never)\b[^.]*\b(invoke|run)\b/i.test(sentence)) continue;
    return true;
  }
  return false;
}

function invocationMode(text: string): Array<"discover" | "generate" | "unqualified"> {
  const modes: Array<"discover" | "generate" | "unqualified"> = [];
  for (const sentence of text.split(/(?<=\.)\s+/)) {
    if (!sentence.includes("create-verification-skill")) continue;
    if (!/\b(invoke|run)\b/i.test(sentence)) continue;
    if (/\b(do not|don't|never)\b[^.]*\b(invoke|run)\b/i.test(sentence)) continue;
    if (/discovery mode|discover mode/.test(sentence)) modes.push("discover");
    else if (/application phase|generate mode/.test(sentence)) modes.push("generate");
    else modes.push("unqualified");
  }
  return modes;
}

function childEffects(skill: string, mode: "discover" | "generate" | "unqualified"): HandoffEffect[] {
  const resolved = mode === "unqualified" ? "generate" : mode;
  if (resolved === "discover") {
    const discover = /## Discovery\n([\s\S]*?)(?=\n## )/.exec(skill)?.[1] ?? "";
    if (discover && !/\b(Write|Create|Run) the\b/.test(discover)) return ["read"];
    return ["read", "write", "execute"];
  }
  const generate = /## Application\n([\s\S]*?)(?=\n## [^A]|$)/.exec(skill)?.[1] ?? skill;
  const effects: HandoffEffect[] = ["read"];
  if (/Write|Create `features/.test(generate)) effects.push("write");
  if (/Run its own instructions|Prove the generated skill/.test(generate)) effects.push("execute");
  if (!effects.includes("write") && /## 2\. Generate the skill/.test(skill)) effects.push("write", "execute");
  return effects;
}

export function initVerificationHandoff(
  root: string,
  phase: "investigate" | "apply",
): HandoffEffect[] {
  const init = readFileSync(join(root, "skills/methodrail-init/SKILL.md"), "utf8");
  const child = readFileSync(join(root, "skills/create-verification-skill/SKILL.md"), "utf8");
  const steps = numberedSteps(init);
  const confirmAt = steps.findIndex((step) => /Preview the full plan/.test(step));
  const visible = phase === "investigate" ? steps.slice(0, confirmAt === -1 ? steps.length : confirmAt) : steps;
  const modes = new Set<"discover" | "generate" | "unqualified">();
  const effects = new Set<HandoffEffect>(["read"]);
  for (const step of visible) {
    for (const mode of invocationMode(step)) modes.add(mode);
    if (writingMaintenance(step)) effects.add("write");
    if (phase === "investigate") {
      for (const relative of linkedMarkdown(step)) {
        const text = readFileSync(join(root, "skills/methodrail-init", relative), "utf8");
        for (const mode of invocationMode(text)) modes.add(mode);
        if (writingMaintenance(text)) effects.add("write");
      }
    }
  }
  for (const mode of modes) {
    for (const effect of childEffects(child, mode)) effects.add(effect);
  }
  return [...effects];
}

export function architectHandoff(root: string, parent: "develop" | "standalone"): ArchitectHandoff {
  const architect = readFileSync(join(root, "skills/architect/SKILL.md"), "utf8");
  const develop = readFileSync(join(root, "skills/develop/SKILL.md"), "utf8");
  if (parent === "standalone") {
    const requested = /standalone implementation[\s\S]{0,240}requested/i.test(architect);
    return {
      effects: requested ? ["read", "implement"] : ["read"],
      returns: [],
      stopped: false,
    };
  }
  const parentAsksDesign = /`architect` \(design only:/.test(develop);
  const childStops = /When `develop` invoked this skill[\s\S]{0,500}Do not implement/.test(architect);
  if (parentAsksDesign && childStops) {
    return {
      effects: ["read"],
      returns: ["alternatives", "recommendation", "unresolved"],
      stopped: true,
    };
  }
  return { effects: ["read", "implement"], returns: [], stopped: false };
}
