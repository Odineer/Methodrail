import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parse } from "yaml";
import { REQUIRED_COMPOSITION_FIXTURES } from "./eval/load.js";
import { hostProjections, readCanonicalInvariant } from "./family-invariant.js";
import { walkFiles } from "./fs-walk.js";
import { evaluateRepositoryKnowledge } from "./knowledge/report.js";
import { evaluateProjectMd, evaluateProjectMdFile } from "./project-md.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

const SKILL_FILE = "SKILL.md";
const LEGACY_SKILL_FILE = "skill.yaml";
const MAX_SKILL_LINES = 500;
const MAX_GLOBAL_RULE_LINES = 40;
const REQUIRED_SKILLS = new Set([
  "methodrail-init",
  "investigate",
  "develop",
  "debug",
  "refactor",
  "review",
  "how",
  "observe",
  "why",
  "research",
  "domain-modeling",
  "grill-with-docs",
  "wayfinder",
  "prototype",
  "architect",
  "codebase-design",
  "improve-codebase-architecture",
  "tdd",
  "diagnosing-bugs",
  "verify-change",
  "blast-radius",
  "code-review",
  "interrogate",
  "arena",
  "swarm",
  "to-spec",
  "to-tickets",
  "runtime-forensics",
  "trace-forensics",
  "performance",
  "hillclimb",
  "visual-parity",
  "create-verification-skill",
  "maintain-verification-skill",
  "show-me-your-work",
  "reflect",
  "writing-for-agents",
  "handoff",
]);
export const WORKFLOW_SKILLS = [
  "methodrail-init",
  "investigate",
  "develop",
  "debug",
  "refactor",
  "review",
] as const;

export const SUGGEST_ONLY_SKILLS = ["interrogate"] as const;

export const EXPLICIT_SKILLS = new Set([
  "methodrail-init",
  "investigate",
  "develop",
  "debug",
  "refactor",
  "review",
  "prototype",
  "grill-with-docs",
  "wayfinder",
  "architect",
  "improve-codebase-architecture",
  "interrogate",
  "arena",
  "swarm",
  "to-spec",
  "to-tickets",
  "runtime-forensics",
  "trace-forensics",
  "performance",
  "hillclimb",
  "visual-parity",
  "create-verification-skill",
  "maintain-verification-skill",
  "show-me-your-work",
  "reflect",
  "handoff",
]);
const REQUIRED_REFERENCES = [
  "references/rigor.md",
  "references/decision-frontier.md",
  "references/context-management.md",
  "references/agent-friendly-codebase.md",
  "references/structural-enforcement.md",
  "references/knowledge.md",
  "references/knowledge/model.md",
  "references/knowledge/lifecycle.md",
  "references/knowledge/freshness.md",
  "references/knowledge/provenance.md",
  "references/knowledge/note-contract.md",
  "references/knowledge/reuse.md",
  "references/evidence.md",
  "references/protocols/task-packet.md",
  "references/protocols/review-packet.md",
  "references/protocols/evidence-record.md",
  "references/protocols/observation-record.md",
  "references/protocols/decision-record.md",
  "references/project-harness.md",
  "references/principles.md",
  "references/simplicity.md",
  "references/capability-map.md",
  "references/upstream-skill-matrix.md",
  "references/host-capabilities.md",
  "references/methodrail-skill-substrate.md",
  "references/context-economics.md",
  "references/skill-composition.md",
  "references/methodrail-family-invariant.md",
];
const REQUIRED_BEHAVIORAL_SKILLS = [
  "verify-change",
  "observe",
  "diagnosing-bugs",
  "how",
  "why",
  "develop",
  "refactor",
  "domain-modeling",
  "tdd",
  "code-review",
  "wayfinder",
  "architect",
  "interrogate",
  "create-verification-skill",
  "writing-for-agents",
  "handoff",
  "methodrail-init",
];
const REQUIRED_EVAL_KINDS = [
  "routing",
  "behavioral",
  "pressure",
  "complexity",
  "composition",
  "fidelity",
] as const;
const VALID_FIDELITY = new Set([
  "upstream-preserved",
  "upstream-preserved-with-extensions",
  "methodrail-composed",
  "concept-derived",
]);
const MAX_GLOBAL_RULE_CHARS = 1800;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function walk(root: string, predicate: (path: string) => boolean): string[] {
  return walkFiles(root, predicate);
}

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function lineCount(source: string): number {
  return source.length === 0 ? 0 : source.split(/\r?\n/).length;
}

function frontmatter(source: string): Record<string, unknown> | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match?.[1]) return undefined;
  const parsed: unknown = parse(match[1]);
  return isRecord(parsed) ? parsed : undefined;
}

function validateMarkdownLinks(path: string, source: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const links = source.matchAll(/(?<!!)\[[^\]]*]\(([^)]+)\)/g);

  for (const match of links) {
    const target = match[1]?.trim().replace(/^<|>$/g, "");
    if (
      !target ||
      target.startsWith("#") ||
      /^[a-z][a-z0-9+.-]*:/i.test(target) ||
      !target.split("#", 1)[0]?.toLowerCase().endsWith(".md")
    ) {
      continue;
    }

    let localPath: string;
    try {
      localPath = decodeURIComponent(target.split("#", 1)[0] ?? "");
    } catch {
      issues.push(issue(path, `Referenced Markdown path is not valid URL-encoded text: ${target}`));
      continue;
    }
    const resolved = resolve(dirname(path), localPath);
    if (!existsSync(resolved) || !statSync(resolved).isFile()) {
      issues.push(issue(path, `Referenced Markdown file does not exist: ${localPath}`));
    }
  }

  return issues;
}

function validateSkill(path: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const source = readFileSync(path, "utf8");
  const metadata = frontmatter(source);

  if (!metadata) {
    return [issue(path, "SKILL.md must start with YAML frontmatter")];
  }

  const folder = basename(dirname(path));
  if (typeof metadata.name !== "string" || metadata.name.trim() === "") {
    issues.push(issue(path, "Skill frontmatter requires a non-empty name"));
  } else if (metadata.name !== folder) {
    issues.push(issue(path, `Skill name "${metadata.name}" must match folder "${folder}"`));
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name) || metadata.name.length > 64) {
    issues.push(issue(path, "Skill name must be lowercase kebab-case and at most 64 characters"));
  }

  if (typeof metadata.description !== "string" || metadata.description.trim() === "") {
    issues.push(issue(path, "Skill frontmatter requires a non-empty description"));
  } else if (metadata.description.length > 1024) {
    issues.push(issue(path, "Skill description must be at most 1024 characters"));
  }

  if (
    metadata["disable-model-invocation"] !== undefined &&
    typeof metadata["disable-model-invocation"] !== "boolean"
  ) {
    issues.push(issue(path, "disable-model-invocation must be a boolean when present"));
  }
  if (EXPLICIT_SKILLS.has(folder) && metadata["disable-model-invocation"] !== true) {
    issues.push(issue(path, `${folder} must set disable-model-invocation: true`));
  }
  if (
    metadata.paths !== undefined &&
    typeof metadata.paths !== "string" &&
    !(Array.isArray(metadata.paths) && metadata.paths.every((value) => typeof value === "string"))
  ) {
    issues.push(issue(path, "paths must be a string or an array of strings when present"));
  }

  const lines = lineCount(source);
  if (lines >= MAX_SKILL_LINES) {
    issues.push(issue(path, `Skill must stay under ${MAX_SKILL_LINES} lines (found ${lines})`));
  }

  issues.push(...validateMarkdownLinks(path, source));
  return issues;
}

function validateSkillEvals(skillPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const skill = basename(dirname(skillPath));
  const evalDir = join(dirname(skillPath), "evals");
  const evalFiles = walk(evalDir, (path) => path.endsWith(".yaml") || path.endsWith(".yml"));
  let positive = false;
  let negative = false;

  for (const path of evalFiles) {
    try {
      const fixture: unknown = parse(readFileSync(path, "utf8"));
      if (!isRecord(fixture)) {
        issues.push(issue(path, "Eval fixture must contain a YAML object"));
        continue;
      }
      if (typeof fixture.id !== "string" || typeof fixture.kind !== "string") {
        issues.push(issue(path, "Eval fixture requires string id and kind fields"));
      }
      if (fixture.skill !== skill) {
        issues.push(issue(path, `Eval fixture skill must be "${skill}"`));
      }
      const input = fixture.input;
      if (!isRecord(input) || typeof input.prompt !== "string" || input.prompt.trim() === "") {
        issues.push(issue(path, "Eval fixture requires a non-empty input.prompt"));
      }
      const expected = fixture.expected;
      const skills = isRecord(expected) && isRecord(expected.skills) ? expected.skills : undefined;
      const required = skills && Array.isArray(skills.required) ? skills.required : [];
      const forbidden = skills && Array.isArray(skills.forbidden) ? skills.forbidden : [];
      if (required.includes(skill)) positive = true;
      if (forbidden.includes(skill)) negative = true;
    } catch (error) {
      issues.push(issue(path, `Eval fixture is invalid YAML: ${(error as Error).message}`));
    }
  }

  if (!positive) issues.push(issue(evalDir, `Missing positive routing coverage for ${skill}`));
  if (!negative) issues.push(issue(evalDir, `Missing negative routing coverage for ${skill}`));
  return issues;
}

function validatePlugin(root: string): ValidationIssue[] {
  const path = join(root, ".cursor-plugin", "plugin.json");
  if (!existsSync(path)) return [];

  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return [issue(path, "plugin.json must contain a JSON object")];
    }

    const plugin = value as Record<string, unknown>;
    const issues: ValidationIssue[] = [];
    for (const field of ["name", "version", "description"]) {
      if (typeof plugin[field] !== "string" || plugin[field].trim() === "") {
        issues.push(issue(path, `plugin.json requires a non-empty ${field}`));
      }
    }
    if (
      typeof plugin.name === "string" &&
      !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(plugin.name)
    ) {
      issues.push(issue(path, "plugin.json name must be lowercase and use only letters, numbers, dots, or hyphens"));
    }
    if (
      typeof plugin.version === "string" &&
      !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(plugin.version)
    ) {
      issues.push(issue(path, "plugin.json version must be semantic version syntax"));
    }
    for (const component of ["skills", "rules"]) {
      const configured = plugin[component];
      if (configured === undefined) continue;
      const configuredPaths =
        typeof configured === "string"
          ? [configured]
          : Array.isArray(configured) && configured.every((value) => typeof value === "string")
            ? configured
            : undefined;
      if (!configuredPaths) {
        issues.push(issue(path, `${component} must be a path string or string array when configured`));
        continue;
      }
      for (const configuredPath of configuredPaths) {
        if (!existsSync(resolve(root, configuredPath))) {
          issues.push(issue(path, `Configured ${component} path does not exist: ${configuredPath}`));
        }
      }
    }
    return issues;
  } catch (error) {
    return [issue(path, `plugin.json is not valid JSON: ${(error as Error).message}`)];
  }
}

function validateMethodrailStructure(root: string, skillPaths: string[]): ValidationIssue[] {
  const packagePath = join(root, "package.json");
  if (!existsSync(packagePath)) return [];

  let packageJson: unknown;
  try {
    packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch {
    return [];
  }
  if (!isRecord(packageJson) || packageJson.name !== "methodrail") return [];

  const issues: ValidationIssue[] = [];
  const pluginPath = join(root, ".cursor-plugin", "plugin.json");
  const rulePath = join(root, "rules", "methodrail.mdc");
  if (!existsSync(pluginPath)) issues.push(issue(pluginPath, "Methodrail requires a Cursor plugin manifest"));
  if (!existsSync(rulePath)) issues.push(issue(rulePath, "Methodrail requires its small global rule"));

  const discovered = new Set(skillPaths.map((path) => basename(dirname(path))));
  for (const skill of REQUIRED_SKILLS) {
    if (!discovered.has(skill)) {
      issues.push(issue(join(root, "skills", skill), `Missing required Methodrail skill: ${skill}`));
    }
  }

  if (existsSync(pluginPath)) {
    try {
      const plugin: unknown = JSON.parse(readFileSync(pluginPath, "utf8"));
      if (
        isRecord(plugin) &&
        typeof packageJson.version === "string" &&
        plugin.version !== packageJson.version
      ) {
        issues.push(issue(pluginPath, "Plugin and package versions must agree"));
      }
    } catch {
      // validatePlugin reports malformed JSON.
    }
  }

  const lockPath = join(root, "package-lock.json");
  if (existsSync(lockPath) && typeof packageJson.version === "string") {
    try {
      const lock: unknown = JSON.parse(readFileSync(lockPath, "utf8"));
      const lockPackages = isRecord(lock) && isRecord(lock.packages) ? lock.packages : undefined;
      const lockRoot = lockPackages && isRecord(lockPackages[""]) ? lockPackages[""] : undefined;
      if (!isRecord(lock) || lock.version !== packageJson.version || lockRoot?.version !== packageJson.version) {
        issues.push(issue(lockPath, "Package lock and package versions must agree"));
      }
    } catch {
      issues.push(issue(lockPath, "package-lock.json is not valid JSON"));
    }
  }

  for (const obsolete of ["workflows", "protocols", "rigor"]) {
    const path = join(root, obsolete);
    if (walk(path, () => true).length > 0) {
      issues.push(issue(path, `Obsolete v0.1 directory must be removed: ${obsolete}`));
    }
  }
  for (const obsoletePath of [
    "src/cli.ts",
    "src/router.ts",
    "src/engine.ts",
    "src/packets.ts",
    "bin/methodrail",
  ]) {
    const path = join(root, obsoletePath);
    if (existsSync(path)) issues.push(issue(path, `Obsolete v0.1 runtime path must be removed: ${obsoletePath}`));
  }
  const obsoleteScripts = [
    "bootstrap-content.mjs",
    "bootstrap-rest.mjs",
    "generate-adapters",
    "eval",
  ];
  for (const script of obsoleteScripts) {
    const path = join(root, "scripts", script);
    if (existsSync(path)) issues.push(issue(path, `Obsolete v0.1 script must be removed: ${script}`));
  }

  for (const relativePath of REQUIRED_REFERENCES) {
    const path = join(root, relativePath);
    if (!existsSync(path)) {
      issues.push(issue(path, `Missing required methodology reference: ${relativePath}`));
    }
  }
  for (const relativePath of [
    "THIRD_PARTY_NOTICES.md",
    "docs/upstream-maintenance.md",
    "upstreams/README.md",
    "upstreams/matt-pocock.yaml",
    "upstreams/pstack.yaml",
    "upstreams/superpowers.yaml",
    "upstreams/ponytail.yaml",
    "upstreams/karpathy-guidelines.yaml",
  ]) {
    const path = join(root, relativePath);
    if (!existsSync(path)) {
      issues.push(issue(path, `Missing required provenance file: ${relativePath}`));
    }
  }

  const referencesRoot = join(root, "references");
  for (const path of walk(referencesRoot, (file) => file.endsWith(".md"))) {
    issues.push(...validateMarkdownLinks(path, readFileSync(path, "utf8")));
  }
  for (const doc of ["README.md", "CONTRIBUTING.md"]) {
    const path = join(root, doc);
    if (existsSync(path)) issues.push(...validateMarkdownLinks(path, readFileSync(path, "utf8")));
  }

  issues.push(...validateMaintainerEvals(root));
  issues.push(...validateUpstreamFidelity(root, skillPaths));
  issues.push(...validateFamilyInvariant(root));
  issues.push(...validateObsoleteTerms(root));
  issues.push(...validateProjectMdQuality(root));
  issues.push(...validateKnowledgeNotes(root));
  issues.push(...validateEvalHarness(root));

  const obsoleteSkill = join(root, "skills", "writing-great-skills");
  if (existsSync(obsoleteSkill)) {
    issues.push(issue(obsoleteSkill, "Do not ship writing-great-skills; writing-for-agents superseded it"));
  }

  if (
    isRecord(packageJson.repository) &&
    typeof packageJson.repository.url === "string" &&
    !packageJson.repository.url.includes("github.com/Odineer/Methodrail")
  ) {
    issues.push(issue(packagePath, "package.json repository URL must point at Odineer/Methodrail"));
  }

  return issues;
}

function validateMaintainerEvals(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const evalsRoot = join(root, "evals");
  for (const kind of REQUIRED_EVAL_KINDS) {
    const dir = join(evalsRoot, kind);
    const files = walk(dir, (path) => path.endsWith(".yaml") || path.endsWith(".yml"));
    if (files.length === 0) {
      issues.push(issue(dir, `Missing maintainer ${kind} eval fixtures`));
      continue;
    }
    for (const path of files) {
      try {
        const fixture: unknown = parse(readFileSync(path, "utf8"));
        if (!isRecord(fixture)) {
          issues.push(issue(path, "Eval fixture must contain a YAML object"));
          continue;
        }
        if (typeof fixture.id !== "string" || typeof fixture.kind !== "string") {
          issues.push(issue(path, "Eval fixture requires string id and kind fields"));
        } else if (fixture.kind !== kind) {
          issues.push(issue(path, `Eval fixture kind must be "${kind}"`));
        }
        const input = fixture.input;
        if (!isRecord(input) || typeof input.prompt !== "string" || input.prompt.trim() === "") {
          issues.push(issue(path, "Eval fixture requires a non-empty input.prompt"));
        }
      } catch (error) {
        issues.push(issue(path, `Eval fixture is invalid YAML: ${(error as Error).message}`));
      }
    }
  }

  const covered = new Set<string>();
  for (const path of walk(join(evalsRoot, "behavioral"), (file) => file.endsWith(".yaml") || file.endsWith(".yml"))) {
    try {
      const fixture: unknown = parse(readFileSync(path, "utf8"));
      if (isRecord(fixture) && typeof fixture.skill === "string") covered.add(fixture.skill);
    } catch {
      // Shape errors are reported above.
    }
  }
  for (const skill of REQUIRED_BEHAVIORAL_SKILLS) {
    if (!covered.has(skill)) {
      issues.push(
        issue(join(evalsRoot, "behavioral"), `Missing behavioral eval coverage for ${skill}`),
      );
    }
  }

  const fixturesReadme = join(evalsRoot, "fixtures", "README.md");
  if (!existsSync(fixturesReadme)) {
    issues.push(issue(fixturesReadme, "Maintainer eval fixtures require a README"));
  }

  return issues;
}

function validateEvalIds(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, string>();
  const files = walk(root, (path) => path.endsWith(".yaml") || path.endsWith(".yml")).filter(
    (path) => path.includes(`${sep}evals${sep}`),
  );
  for (const path of files) {
    try {
      const fixture: unknown = parse(readFileSync(path, "utf8"));
      if (!isRecord(fixture) || typeof fixture.id !== "string") continue;
      const previous = seen.get(fixture.id);
      if (previous) {
        issues.push(issue(path, `Duplicate eval id "${fixture.id}" also used by ${previous}`));
      } else {
        seen.set(fixture.id, relative(root, path).split(sep).join("/"));
      }
    } catch {
      // Skill coverage validation reports malformed per-skill fixtures.
    }
  }
  return issues;
}

function validateGlobalRules(root: string): ValidationIssue[] {
  const candidates = [join(root, "rules"), join(root, ".cursor", "rules")];
  const paths = candidates.flatMap((dir) => walk(dir, (path) => path.endsWith(".mdc")));
  const issues: ValidationIssue[] = [];

  for (const path of paths) {
    const source = readFileSync(path, "utf8");
    const metadata = frontmatter(source);
    if (!metadata) {
      issues.push(issue(path, "Cursor rule must start with YAML frontmatter"));
      continue;
    }
    if (typeof metadata.description !== "string" || metadata.description.trim() === "") {
      issues.push(issue(path, "Cursor rule requires a non-empty description"));
    }
    if (metadata.alwaysApply !== true) {
      issues.push(issue(path, "Global Cursor rule must set alwaysApply: true"));
    }
    const lines = lineCount(source);
    if (lines > MAX_GLOBAL_RULE_LINES) {
      issues.push(
        issue(path, `Global Cursor rule must stay at or below ${MAX_GLOBAL_RULE_LINES} lines`),
      );
    }
    if (source.length > MAX_GLOBAL_RULE_CHARS) {
      issues.push(
        issue(
          path,
          `Global Cursor rule must stay at or below ${MAX_GLOBAL_RULE_CHARS} characters (found ${source.length})`,
        ),
      );
    }
    for (const banned of ["wayfinder", "interrogate", "capability map", "rigor table", "skill graph"]) {
      if (source.toLowerCase().includes(banned)) {
        issues.push(issue(path, `Global Cursor rule must not embed methodology detail: ${banned}`));
      }
    }
  }

  return issues;
}

function validateUpstreamFidelity(root: string, skillPaths: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const valid = [...VALID_FIDELITY].join("|");
  const pattern = new RegExp(`^Fidelity:\\s*(${valid})\\s*$`, "m");

  for (const skillPath of skillPaths) {
    if (!skillPath.startsWith(join(root, "skills"))) continue;
    const skillDir = dirname(skillPath);
    const upstreamPath = join(skillDir, "UPSTREAM.md");
    if (!existsSync(upstreamPath)) continue;
    const source = readFileSync(upstreamPath, "utf8");
    if (!pattern.test(source)) {
      issues.push(
        issue(
          upstreamPath,
          `UPSTREAM.md must declare Fidelity as one of: ${[...VALID_FIDELITY].join(", ")}`,
        ),
      );
    }
  }

  return issues;
}

function validateFamilyInvariant(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const canonicalPath = join(root, "references", "methodrail-family-invariant.md");
  if (!existsSync(canonicalPath)) {
    return [issue(canonicalPath, "Missing canonical Methodrail family invariant")];
  }
  try {
    const body = readCanonicalInvariant(root);
    const projections = hostProjections(body);
    for (const [relativePath, expected] of Object.entries(projections)) {
      const path = join(root, relativePath);
      if (!existsSync(path)) {
        issues.push(issue(path, `Missing host projection of the family invariant: ${relativePath}`));
        continue;
      }
      const actual = readFileSync(path, "utf8");
      if (actual !== expected) {
        issues.push(
          issue(path, "Host projection is out of date; run tsx src/project-family-invariant.ts"),
        );
      }
    }
  } catch (error) {
    issues.push(issue(canonicalPath, (error as Error).message));
  }
  return issues;
}

function validateObsoleteTerms(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const banned = ["control adapter", "result packet", "runtime adapter"];
  const roots = ["skills", "references", "adapters", "rules", "docs"].map((dir) => join(root, dir));
  for (const base of roots) {
    for (const path of walk(base, (file) => file.endsWith(".md") || file.endsWith(".mdc"))) {
      const relativePath = relative(root, path).split(sep).join("/");
      if (relativePath.startsWith("docs/internal/") || relativePath === "CHANGELOG.md") continue;
      const source = readFileSync(path, "utf8").toLowerCase();
      for (const term of banned) {
        if (source.includes(term)) {
          issues.push(issue(path, `Obsolete architecture term must not appear: ${term}`));
        }
      }
    }
  }
  return issues;
}

function validateProjectMdQuality(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const path of walk(root, (file) => basename(file) === "PROJECT.md")) {
    const normalized = relative(root, path).split(sep).join("/");
    if (normalized.startsWith("evals/runners/artifacts/")) continue;
    if (!normalized.includes(".methodrail/")) continue;
    if (!normalized.endsWith("PROJECT.md")) continue;
    const quality =
      normalized.startsWith("evals/") || normalized.startsWith("tests/")
        ? evaluateProjectMd(readFileSync(path, "utf8"))
        : evaluateProjectMdFile(path, root);
    for (const message of quality.issues) {
      issues.push(issue(path, message));
    }
  }
  return issues;
}

function validateKnowledgeNotes(root: string): ValidationIssue[] {
  const report = evaluateRepositoryKnowledge(root);
  return report.errors.map((item) => issue(item.path, item.message));
}

function validateEvalHarness(root: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const runner = join(root, "evals", "runners", "cli.ts");
  const reports = join(root, "evals", "reports", "README.md");
  if (!existsSync(runner)) issues.push(issue(runner, "Missing maintainer eval runner"));
  if (!existsSync(reports)) issues.push(issue(reports, "Missing eval reports README"));
  for (const name of REQUIRED_COMPOSITION_FIXTURES) {
    const dir = join(root, "evals", "fixtures", name);
    const task = join(dir, "task.md");
    const expected = join(dir, "expected.yaml");
    if (!existsSync(dir)) issues.push(issue(dir, `Missing composition fixture: ${name}`));
    if (!existsSync(task)) issues.push(issue(task, `Missing task.md for fixture ${name}`));
    if (!existsSync(expected)) {
      issues.push(issue(expected, `Missing expected.yaml for fixture ${name}`));
    }
  }
  return issues;
}

export function validateRepository(root: string): ValidationResult {
  const absoluteRoot = resolve(root);
  const issues: ValidationIssue[] = [];
  const files = walk(absoluteRoot, () => true);
  const skillPaths = files.filter((path) => basename(path) === SKILL_FILE);

  for (const path of files.filter((path) => basename(path) === LEGACY_SKILL_FILE)) {
    issues.push(issue(path, "Legacy skill.yaml is not allowed; use native SKILL.md frontmatter"));
  }
  for (const path of skillPaths) {
    issues.push(...validateSkill(path));
    if (path.includes(`${sep}skills${sep}`) && path.startsWith(join(absoluteRoot, "skills"))) {
      issues.push(...validateSkillEvals(path));
    }
  }

  issues.push(...validatePlugin(absoluteRoot));
  issues.push(...validateGlobalRules(absoluteRoot));
  issues.push(...validateMethodrailStructure(absoluteRoot, skillPaths));
  issues.push(...validateEvalIds(absoluteRoot));
  issues.sort((left, right) =>
    `${left.path}\0${left.message}`.localeCompare(`${right.path}\0${right.message}`),
  );

  return { ok: issues.length === 0, issues };
}

export function formatValidation(result: ValidationResult, root: string): string {
  if (result.ok) return "Repository validation passed.";
  return result.issues
    .map(({ path, message }) => `${relative(root, path).split(sep).join("/")}: ${message}`)
    .join("\n");
}

function main(): void {
  const root = resolve(process.argv[2] ?? process.cwd());
  const result = validateRepository(root);
  console.log(formatValidation(result, root));
  if (!result.ok) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
