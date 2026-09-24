import { readFileSync } from "node:fs";
import { join } from "node:path";

function section(source: string, heading: string): string {
  const match = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`).exec(source);
  return match?.[1] ?? "";
}

function has(source: string, pattern: RegExp, violations: string[], label: string): void {
  if (!pattern.test(source)) violations.push(label);
}

function decisionCell(lifecycle: string, id: string): string {
  const row = lifecycle.split("\n").find((line) => line.startsWith(`| ${id} |`));
  return row?.split("|").map((cell) => cell.trim())[3] ?? "";
}

/** Static contract check. It does not prove a workflow ran or that verification passed. */
export function staticVerificationContract(root: string): string[] {
  const violations: string[] = [];
  const lifecycle = readFileSync(join(root, "references/verification-lifecycle.md"), "utf8");
  const develop = readFileSync(join(root, "skills/develop/SKILL.md"), "utf8");
  const debug = readFileSync(join(root, "skills/debug/SKILL.md"), "utf8");
  const refactor = readFileSync(join(root, "skills/refactor/SKILL.md"), "utf8");
  const review = readFileSync(join(root, "skills/review/SKILL.md"), "utf8");
  const investigate = readFileSync(join(root, "skills/investigate/SKILL.md"), "utf8");
  const verify = readFileSync(join(root, "skills/verify-change/SKILL.md"), "utf8");
  const create = readFileSync(join(root, "skills/create-verification-skill/SKILL.md"), "utf8");
  const maintain = readFileSync(join(root, "skills/maintain-verification-skill/SKILL.md"), "utf8");
  const init = readFileSync(join(root, "skills/methodrail-init/SKILL.md"), "utf8");
  const maintenance = readFileSync(
    join(root, "skills/methodrail-init/references/control-maintenance.md"),
    "utf8",
  );
  const developVerification = section(develop, "Verification");

  for (const [id, action] of [
    ["adequate-existing", "Reuse"],
    ["scripts-sufficient", "Use them directly"],
    ["missing-path", "Create"],
    ["mapped-change", "Task-scoped"],
    ["widespread", "Full maintenance"],
    ["blocked-prereq", "Report the exact gap"],
  ] as const) {
    if (!decisionCell(lifecycle, id).includes(action)) violations.push(`decision ${id}`);
  }
  has(lifecycle, /adds, changes, or removes user-facing behavior/, violations, "unmapped feature");
  has(lifecycle, /Absence of a `verify-\*` directory is not a reason/, violations, "absence is not creation");
  has(lifecycle, /documentation drift/, violations, "drift class");
  has(lifecycle, /harness defect/, violations, "harness class");
  has(lifecycle, /product defect/, violations, "product class");
  has(lifecycle, /Do not change expected behavior/, violations, "preserve oracle");
  has(lifecycle, /Linked external placement writes under `\.methodrail\/control\/`/, violations, "linked placement");

  has(developVerification, /do not invoke `create-verification-skill` when those already prove/i, violations, "develop cheap path");
  has(developVerification, /application phase only for decision `missing-path`/, violations, "develop create");
  has(developVerification, /the map does not yet list/, violations, "develop unmapped");
  has(developVerification, /Do not start a full audit/, violations, "develop no full audit");
  has(develop, /rerun the affected verification before claiming completion/, violations, "develop rerun");

  has(debug, /harness defect/, violations, "debug harness");
  has(debug, /product defect keeps its expected behavior/, violations, "debug oracle");
  has(refactor, /dependent flows of a changed helper/, violations, "refactor dependents");
  has(review, /Do not invoke `create-verification-skill` or `maintain-verification-skill` unless the user asked for fixes/, violations, "review read-only");
  has(investigate, /Do not invoke `create-verification-skill` or `maintain-verification-skill`/, violations, "investigate read-only");
  has(verify, /Do not invoke `create-verification-skill` or start a `maintain-verification-skill` audit/, violations, "verify returns gap");

  has(section(create, "Discovery"), /Do not write repository files/, violations, "discovery writes");
  has(create, /\.methodrail\/control\//, violations, "create linked placement");
  has(create, /draft or blocked result/, violations, "create draft");
  has(maintain, /Task-scoped clean does not mean the whole map was audited/, violations, "task coverage");
  has(maintain, /Standalone “audit the verification skill” selects \*\*full audit\*\*/, violations, "standalone audit");
  has(maintain, /Exercise every mapped feature/, violations, "full coverage");
  has(maintain, /Do not open a pull request/, violations, "no pr");
  has(maintain, /the map should represent/, violations, "maintain new entry");
  has(init, /discovery mode/, violations, "init discovery");
  has(init, /Do not invoke `maintain-verification-skill` before confirmation/, violations, "init maintenance gate");
  has(init, /report the partial state/, violations, "init partial");
  has(maintenance, /Do not invoke `maintain-verification-skill` during investigation or preview/, violations, "maintenance proposal");
  has(maintenance, /A full audit runs only when the user asks for one/, violations, "one full-audit trigger");

  return violations;
}
