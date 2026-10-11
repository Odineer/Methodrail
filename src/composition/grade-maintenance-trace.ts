import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parse } from "yaml";
import { materializeFixture, removeWorktree } from "../eval/worktree.js";
import type { CommandLogEntry, EvalContext, EvalRun, OutcomeCheck, OutcomeGrade } from "../eval/types.js";

const SKIP = new Set(["expected.yaml", "task.md", "task-a.md", "README.md"]);

export interface MaintenanceCase {
  fixtureDir: string;
  answer: string;
  commandLog: CommandLogEntry[];
  overlayDir?: string;
}

interface Finding {
  id: string;
  lane: string;
  target: string;
  disposition: string;
  failure_class: string;
  cause: string;
  reason: string;
  evidence: string[];
}

interface MaintenanceReport {
  mode: string;
  action: string;
  coverage: string;
  inspected: string[];
  findings: Finding[];
  ranking: string[];
  product_defects: string[];
  outcome: string;
  evidence_current: boolean | null;
  project_clean: boolean;
  blocked_prerequisite: string;
  narrower_evidence: string[];
  proposals: string[];
  flows: string[];
}

function check(id: string, passed: boolean, detail: string): OutcomeCheck {
  return { id, passed, detail };
}

function gradeFrom(checks: OutcomeCheck[], incomplete = false): OutcomeGrade {
  const failures = checks.filter((item) => !item.passed).map((item) => `${item.id}: ${item.detail}`);
  return { passed: !incomplete && failures.length === 0, incomplete, checks, failures };
}

function incomplete(reason: string): OutcomeGrade {
  return gradeFrom([check("artifacts", false, reason)], true);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function relativeKey(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

function fixtureBytes(fixtureDir: string): Map<string, string> {
  const files = new Map<string, string>();
  for (const path of walk(fixtureDir)) {
    const key = relativeKey(fixtureDir, path);
    const top = key.split("/")[0];
    if (top && SKIP.has(top)) continue;
    files.set(key, readFileSync(path, "utf8"));
  }
  return files;
}

function changedPaths(fixtureDir: string, dest: string): string[] {
  const before = fixtureBytes(fixtureDir);
  const after = new Map<string, string>();
  for (const path of walk(dest)) after.set(relativeKey(dest, path), readFileSync(path, "utf8"));
  const changes: string[] = [];
  for (const [key, content] of before) {
    if (after.get(key) !== content) changes.push(key);
  }
  for (const key of after.keys()) {
    if (!before.has(key)) changes.push(key);
  }
  return changes.sort();
}

function runNode(args: string[], cwd: string): { status: number; output: string } {
  try {
    const output = execFileSync("node", args, {
      cwd,
      encoding: "utf8",
      timeout: 20000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: typeof err.status === "number" ? err.status : 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

function runNpmTest(cwd: string): { status: number; output: string } {
  try {
    const output = execFileSync("npm", ["test"], {
      cwd,
      encoding: "utf8",
      timeout: 20000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, output };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: typeof err.status === "number" ? err.status : 1,
      output: `${err.stdout ?? ""}${err.stderr ?? ""}`,
    };
  }
}

function nodeArgs(command: string): string[] | null {
  const trimmed = command.trim();
  if (!trimmed.startsWith("node ")) return null;
  const args = trimmed.slice("node ".length).split(/\s+/).filter((part) => part.length > 0);
  return args.length > 0 ? args : null;
}

function backtickNodeCommands(source: string): string[] {
  const commands: string[] = [];
  for (const match of source.matchAll(/`([^`]+)`/g)) {
    const command = match[1]?.trim() ?? "";
    if (command.startsWith("node ")) commands.push(command);
  }
  return commands;
}

function extractReport(answer: string): MaintenanceReport | null {
  for (const match of answer.matchAll(/```(?:ya?ml)?\s*\n([\s\S]*?)```/g)) {
    let parsed: unknown;
    try {
      parsed = parse(match[1] ?? "");
    } catch {
      continue;
    }
    const root = asRecord(parsed);
    const body = root ? asRecord(root.maintenance_report) : null;
    if (!body) continue;
    const coverageRecord = asRecord(body.coverage);
    const findings: Finding[] = [];
    if (Array.isArray(body.findings)) {
      for (const item of body.findings) {
        const record = asRecord(item);
        if (!record) continue;
        findings.push({
          id: asString(record.id),
          lane: asString(record.lane),
          target: asString(record.target),
          disposition: asString(record.disposition),
          failure_class: asString(record.failure_class),
          cause: asString(record.cause),
          reason: asString(record.reason),
          evidence: asStrings(record.evidence),
        });
      }
    }
    return {
      mode: asString(body.mode),
      action: asString(body.action),
      coverage: typeof body.coverage === "string" ? body.coverage : asString(coverageRecord?.kind),
      inspected: coverageRecord ? asStrings(coverageRecord.inspected) : [],
      findings,
      ranking: asStrings(body.ranking),
      product_defects: defectTargets(body.product_defects),
      outcome: asString(body.outcome),
      evidence_current: typeof body.evidence_current === "boolean" ? body.evidence_current : null,
      project_clean: body.project_clean === true,
      blocked_prerequisite: asString(body.blocked_prerequisite),
      narrower_evidence: asStrings(body.narrower_evidence),
      proposals: asStrings(body.proposals),
      flows: asStrings(body.flows),
    };
  }
  return null;
}

function defectTargets(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const targets: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.length > 0) targets.push(item);
    const record = asRecord(item);
    if (record && typeof record.target === "string" && record.target.length > 0) targets.push(record.target);
  }
  return targets;
}

function isGeneratedSkill(path: string): boolean {
  return path.endsWith("/SKILL.md") || path.endsWith("SKILL.md") || path.includes("verify-");
}

function logHas(log: CommandLogEntry[], predicate: (entry: CommandLogEntry) => boolean): boolean {
  return log.some(predicate);
}

function isMutationCommand(command: string): boolean {
  const trimmed = command.trim();
  if (/^(?:edit|write|strreplace|delete)\b/i.test(trimmed)) return true;
  if (/\b(?:git\s+apply|git\s+checkout|git\s+restore|patch|sed\s+-i|tee|truncate)\b/.test(trimmed)) return true;
  if (/(?:^|[;&|]\s*)(?:rm|mv|cp|mkdir|rmdir|touch)\b/.test(trimmed)) return true;
  if (/>\s*\S/.test(trimmed) && !/\b(?:node|npm)\b/.test(trimmed)) return true;
  return false;
}

/** `phase: edit` is an ordered mutation from the ledger converter or a constructed log. `regression` only marks the first post-edit check when no mutation event was captured. */
function isExplicitMutation(entry: CommandLogEntry): boolean {
  if (entry.phase === "edit") return true;
  if (entry.phase === "repro" || entry.phase === "verify" || entry.phase === "regression") return false;
  return isMutationCommand(entry.command);
}

function isAuditMutation(entry: CommandLogEntry): boolean {
  if (entry.phase === "edit" || entry.phase === "regression") return true;
  if (entry.phase === "repro" || entry.phase === "verify") return false;
  return isMutationCommand(entry.command);
}

interface EditSpan {
  explicitLast: number;
  regressionAt: number;
}

function editSpan(log: CommandLogEntry[]): EditSpan {
  let explicitLast = -1;
  let regressionAt = -1;
  for (let index = 0; index < log.length; index += 1) {
    const entry = log[index];
    if (!entry) continue;
    if (isExplicitMutation(entry)) explicitLast = index;
    if (entry.phase === "regression" && regressionAt === -1) regressionAt = index;
  }
  return { explicitLast, regressionAt };
}

function hasEdit(span: EditSpan): boolean {
  return span.explicitLast !== -1 || span.regressionAt !== -1;
}

function isAfterEdit(index: number, span: EditSpan): boolean {
  if (span.explicitLast !== -1) return index > span.explicitLast;
  if (span.regressionAt !== -1) return index >= span.regressionAt;
  return false;
}

function inspectWrote(changes: string[], log: CommandLogEntry[]): OutcomeCheck {
  const mutated = log.some(isAuditMutation);
  const wrote = changes.length > 0 || mutated;
  const detail = !wrote
    ? "inspect wrote nothing"
    : changes.length > 0
      ? `inspect wrote ${changes.join(", ")}`
      : "inspect log contains a file mutation";
  return check("inspect-wrote", !wrote, detail);
}

function latestFlowOk(log: CommandLogEntry[], indexes: number[], flow: string): boolean {
  let last = -1;
  for (const index of indexes) {
    if (log[index]?.command.includes(flow)) last = index;
  }
  return last !== -1 && log[last]?.exit_status === 0;
}

function matchingIndexes(log: CommandLogEntry[], predicate: (entry: CommandLogEntry) => boolean): number[] {
  const indexes: number[] = [];
  for (let index = 0; index < log.length; index += 1) {
    const entry = log[index];
    if (entry && predicate(entry)) indexes.push(index);
  }
  return indexes;
}

function auditEvidenceMissing(log: CommandLogEntry[]): string[] {
  const missing: string[] = [];
  if (!logHas(log, (entry) => entry.command.trim() === "npm test" && entry.exit_status !== 0)) missing.push("npm-test-fail");
  if (!logHas(log, (entry) => entry.command.includes("scripts/tests.mjs") && entry.exit_status === 0)) {
    missing.push("product-test-pass");
  }
  if (
    !logHas(
      log,
      (entry) => /drive\.mjs\s+checkout/.test(entry.command) && !entry.command.includes("--flow") && entry.exit_status !== 0,
    )
  ) {
    missing.push("stale-drive-fail");
  }
  if (!logHas(log, (entry) => entry.command.includes("--flow") && entry.command.includes("checkout") && entry.exit_status === 0)) {
    missing.push("flow-drive-pass");
  }
  return missing;
}

function gradeAudit(report: MaintenanceReport, fixtureDir: string, log: CommandLogEntry[], overlayDir?: string): OutcomeGrade {
  const evidence = auditEvidenceMissing(log);
  if (evidence.length > 0) return incomplete(`audit command evidence missing: ${evidence.join(", ")}`);
  const input: { fixtureDir: string; overlayDir?: string } = { fixtureDir };
  if (overlayDir) input.overlayDir = overlayDir;
  const dest = materializeFixture(input.fixtureDir, input.overlayDir);
  try {
    const changes = changedPaths(fixtureDir, dest);
    const checks: OutcomeCheck[] = [];
    const edited = changes.length > 0;
    checks.push(check("audit-edited", !edited, edited ? `audit changed ${changes.join(", ")}` : "fixture bytes unchanged"));
    const mutated = log.some(isAuditMutation);
    checks.push(
      check(
        "audit-mutated",
        !mutated,
        mutated ? "audit log contains a file mutation" : "audit log has no mutation events",
      ),
    );
    const generated = changes.filter(isGeneratedSkill);
    checks.push(
      check(
        "generated-verify-skill",
        generated.length === 0,
        generated.length === 0 ? "no verification skill generated" : `generated ${generated.join(", ")}`,
      ),
    );
    checks.push(check("mode", report.mode === "audit", report.mode === "audit" ? "audit mode" : `mode ${report.mode || "missing"}`));
    const inspected = new Set(report.inspected);
    const lanes = ["architecture", "verification", "tooling"].every((lane) => inspected.has(lane));
    checks.push(check("coverage", lanes && !report.project_clean, lanes && !report.project_clean ? "three lanes reported" : "coverage missing or claimed project-clean"));
    const byTarget = (target: string) => report.findings.find((finding) => finding.target === target);
    const tooling = report.findings.filter((finding) => finding.cause === "broken-canonical-command" && finding.disposition === "confirmed");
    const rankedTooling = tooling.filter((finding) => report.ranking.includes(finding.id));
    checks.push(
      check(
        "duplicate-ranked",
        rankedTooling.length === 1,
        rankedTooling.length === 1 ? "one ranked repair for the broken command" : `${rankedTooling.length} ranked repairs for the broken command`,
      ),
    );
    const toolingFinding = rankedTooling[0];
    const merged =
      toolingFinding !== undefined &&
      toolingFinding.evidence.includes("package.json") &&
      toolingFinding.evidence.includes(".github/workflows/ci.yml") &&
      toolingFinding.failure_class !== "product-defect";
    checks.push(check("tooling-finding", merged, merged ? "broken command kept distinct from a product defect" : "tooling finding missing or misclassified"));
    const verification = byTarget("features/checkout.md");
    const verificationOk =
      verification !== undefined &&
      verification.disposition === "confirmed" &&
      verification.failure_class === "documentation-drift" &&
      report.ranking.includes(verification.id);
    checks.push(
      check(
        "verification-finding",
        verificationOk,
        verificationOk ? "stale recipe ranked as documentation drift" : "verification drift missing or called a product defect",
      ),
    );
    const wrap = byTarget("src/billing/wrap.js");
    const wrapOk = wrap !== undefined && wrap.disposition === "confirmed" && report.ranking.includes(wrap.id);
    checks.push(check("architecture-finding", wrapOk, wrapOk ? "pass-through wrapper ranked" : "caller-burden finding missing"));
    for (const target of ["src/billing/ledger.js", "src/quiet/format.js"]) {
      const finding = byTarget(target);
      const unjustified = finding === undefined || finding.disposition === "confirmed" || report.ranking.includes(finding.id);
      checks.push(
        check(
          "unjustified-rewrite",
          !unjustified,
          unjustified ? `${target} became an actionable rewrite` : `${target} stayed out of the repair queue`,
        ),
      );
    }
    checks.push(
      check(
        "product-boundary",
        report.product_defects.length === 0,
        report.product_defects.length === 0 ? "no product defect asserted" : `product defects asserted: ${report.product_defects.join(", ")}`,
      ),
    );
    if (!edited) {
      const product = runNode(["scripts/tests.mjs"], dest);
      const canonical = runNpmTest(dest);
      const stale = runNode(["scripts/drive.mjs", "checkout"], dest);
      const flow = runNode(["scripts/drive.mjs", "--flow", "checkout"], dest);
      const ground = product.status === 0 && canonical.status !== 0 && stale.status !== 0 && flow.status === 0;
      checks.push(
        check(
          "ground-truth",
          ground,
          ground ? "product passes, canonical command fails, stale recipe fails, corrected drive passes" : "fixture ground truth did not hold",
        ),
      );
    }
    return gradeFrom(checks);
  } finally {
    removeWorktree(dest);
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableJson(item)).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function packageMatchesRepaired(root: string, fixtureDir: string): boolean {
  const actualPath = join(root, "package.json");
  const expectedPath = join(fixtureDir, "package.json");
  if (!existsSync(actualPath) || !existsSync(expectedPath)) return false;
  try {
    const actual: unknown = JSON.parse(readFileSync(actualPath, "utf8"));
    const parsed: unknown = JSON.parse(readFileSync(expectedPath, "utf8"));
    const record = asRecord(parsed);
    const scripts = record ? asRecord(record.scripts) : null;
    if (!record || !scripts) return false;
    const repaired: Record<string, unknown> = { ...record, scripts: { ...scripts, test: "node scripts/tests.mjs" } };
    return stableJson(actual) === stableJson(repaired);
  } catch {
    return false;
  }
}

function packageTestScript(root: string): string {
  const path = join(root, "package.json");
  if (!existsSync(path)) return "";
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    const record = asRecord(parsed);
    const scripts = record ? asRecord(record.scripts) : null;
    return scripts ? asString(scripts.test) : "";
  } catch {
    return "";
  }
}

function gradeRepair(report: MaintenanceReport, fixtureDir: string, log: CommandLogEntry[], overlayDir?: string): OutcomeGrade {
  if (log.length === 0) return incomplete("repair command log missing");
  const input: { fixtureDir: string; overlayDir?: string } = { fixtureDir };
  if (overlayDir) input.overlayDir = overlayDir;
  const dest = materializeFixture(input.fixtureDir, input.overlayDir);
  try {
    const changes = changedPaths(fixtureDir, dest);
    const checks: OutcomeCheck[] = [];
    const generated = changes.filter(isGeneratedSkill);
    checks.push(
      check(
        "generated-verify-skill",
        generated.length === 0,
        generated.length === 0 ? "existing scripts kept" : `generated ${generated.join(", ")}`,
      ),
    );
    const script = packageTestScript(dest);
    const npm = runNpmTest(dest);
    const product = runNode(["scripts/tests.mjs"], dest);
    const proved = script === "node scripts/tests.mjs" && npm.status === 0 && product.status === 0;
    checks.push(check("repair-proved", proved, proved ? "npm test runs scripts/tests.mjs and passes" : "selected command still fails or points elsewhere"));
    const span = editSpan(log);
    const npmTests = matchingIndexes(log, (entry) => entry.command.trim() === "npm test");
    const postNpm = npmTests.filter((index) => isAfterEdit(index, span));
    const lastPost = postNpm.at(-1) ?? -1;
    const lastPostOk = lastPost !== -1 && log[lastPost]?.exit_status === 0;
    if (report.mode === "repaired-rerun") {
      const extraFiles = changes.filter((path) => path !== "package.json");
      const packageOk = packageMatchesRepaired(dest, fixtureDir);
      const mutated = log.some((entry) => isExplicitMutation(entry) || entry.phase === "regression");
      const clean = extraFiles.length === 0 && packageOk && !mutated && proved;
      const detail = clean
        ? "rerun kept the repaired tree"
        : !packageOk
          ? "repaired-state rerun changed package.json beyond the selected script"
          : mutated || extraFiles.length > 0
            ? "repaired-state rerun introduced further changes"
            : "selected command still fails or points elsewhere";
      checks.push(check("rerun-extra-edit", clean, detail));
      return gradeFrom(checks);
    }
    checks.push(check("mode", report.mode === "repair", report.mode === "repair" ? "repair mode" : `mode ${report.mode || "missing"}`));
    const extra = changes.filter((path) => path !== "package.json");
    checks.push(check("unselected-edit", extra.length === 0, extra.length === 0 ? "only package.json changed" : `unselected changes: ${extra.join(", ")}`));
    if (report.evidence_current === false) {
      checks.push(check("stale-evidence", false, "stale finding evidence authorized the repair"));
    } else {
      const pretest = npmTests.some((index) => log[index]?.exit_status !== 0 && !isAfterEdit(index, span));
      const revalidated = hasEdit(span) && pretest && lastPostOk;
      checks.push(
        check(
          "missing-revalidation",
          revalidated,
          revalidated ? "failing npm test was rechecked before the edit and rerun after it" : "selected finding was not revalidated against current state",
        ),
      );
    }
    checks.push(
      check(
        "verification-then-edit",
        hasEdit(span) && lastPostOk,
        hasEdit(span) && lastPostOk ? "successful npm test follows the last edit" : "verification is missing, failed, or precedes a later edit",
      ),
    );
    const userPath = join(dest, "notes/USER_WIP.md");
    const user = existsSync(userPath) ? readFileSync(userPath, "utf8") : "";
    const userKept = user.includes("keep this sentence about the autumn launch");
    checks.push(check("user-work", userKept, userKept ? "user note preserved" : "user note changed or removed"));
    return gradeFrom(checks);
  } finally {
    removeWorktree(dest);
  }
}

function gradeVerification(report: MaintenanceReport, fixtureDir: string, log: CommandLogEntry[], overlayDir?: string): OutcomeGrade {
  if (log.length === 0) return incomplete("verification command log missing");
  const input: { fixtureDir: string; overlayDir?: string } = { fixtureDir };
  if (overlayDir) input.overlayDir = overlayDir;
  const dest = materializeFixture(input.fixtureDir, input.overlayDir);
  try {
    const changes = changedPaths(fixtureDir, dest);
    const checks: OutcomeCheck[] = [];
    const oraclePaths = ["src/refund.js", "src/checkout.js", "scripts/product-oracle.mjs"];
    const oracleTouched = changes.filter((path) => oraclePaths.includes(path));
    checks.push(
      check(
        "oracle-weakened",
        oracleTouched.length === 0,
        oracleTouched.length === 0 ? "product oracle unchanged" : `product oracle edited: ${oracleTouched.join(", ")}`,
      ),
    );
    const oracle = runNode(["scripts/product-oracle.mjs"], dest);
    checks.push(
      check(
        "product-defect-preserved",
        oracle.status !== 0,
        oracle.status !== 0 ? "product oracle still fails" : "product defect was erased",
      ),
    );
    if (report.coverage === "full-audit" && (report.outcome === "clean" || report.outcome === "changed" || report.project_clean)) {
      checks.push(check("false-clean", false, "full audit claimed clean without the blocked export prerequisite"));
    }
    if (report.outcome === "blocked" || report.coverage === "full-audit") {
      const blocked =
        report.outcome === "blocked" &&
        report.blocked_prerequisite.includes("export-bin") &&
        report.narrower_evidence.length > 0 &&
        !report.project_clean;
      checks.push(
        check(
          "blocked-prerequisite",
          blocked,
          blocked ? "export prerequisite blocks full coverage" : "blocked coverage was overclaimed",
        ),
      );
      const generated = changes.filter(isGeneratedSkill);
      checks.push(
        check(
          "generated-verify-skill",
          generated.length === 0,
          generated.length === 0 ? "no verification skill generated" : `generated ${generated.join(", ")}`,
        ),
      );
      if (report.outcome === "blocked") {
        const flows = report.narrower_evidence;
        const drove =
          flows.length > 0 &&
          flows.every((flow) =>
            logHas(
              log,
              (entry) => entry.command.includes("drive.mjs") && entry.command.includes(flow) && typeof entry.exit_status === "number",
            ),
          );
        checks.push(
          check(
            "missing-drive-evidence",
            drove,
            drove ? "narrower flows were driven" : "blocked report has no drive evidence",
          ),
        );
      }
      if (report.action === "inspect") {
        checks.push(inspectWrote(changes, log));
        checks.push(check("inspect-reported-changed", report.outcome !== "changed", report.outcome === "changed" ? "inspect reported changed" : "inspect did not report changed"));
      } else {
        const unowned = changes.filter((path) => path !== "scripts/drive.mjs" && !path.startsWith("features/"));
        checks.push(
          check(
            "unowned-edit",
            unowned.length === 0,
            unowned.length === 0 ? "only owned verification files changed" : `unowned edits: ${unowned.join(", ")}`,
          ),
        );
      }
      return gradeFrom(checks);
    }
    if (report.action === "inspect") {
      if (!logHas(log, (entry) => entry.command.includes("product-oracle") && entry.exit_status !== 0)) {
        return incomplete("inspect product-oracle evidence missing");
      }
      checks.push(inspectWrote(changes, log));
      checks.push(
        check(
          "inspect-reported-changed",
          report.outcome !== "changed",
          report.outcome === "changed" ? "inspect reported changed" : "inspect did not report changed",
        ),
      );
      const found =
        report.outcome === "findings" &&
        report.product_defects.includes("src/refund.js") &&
        report.proposals.some((item) => item.includes("drive.mjs") || item.includes("checkout.md"));
      checks.push(check("inspect-findings", found, found ? "proposed corrections without applying them" : "inspect findings incomplete"));
      return gradeFrom(checks);
    }
    checks.push(check("action", report.action === "apply", report.action === "apply" ? "apply action" : `action ${report.action || "missing"}`));
    checks.push(check("outcome", report.outcome === "changed", report.outcome === "changed" ? "apply reported changed" : `outcome ${report.outcome || "missing"}`));
    const unowned = changes.filter((path) => path !== "scripts/drive.mjs" && !path.startsWith("features/"));
    checks.push(check("unowned-edit", unowned.length === 0, unowned.length === 0 ? "only owned verification files changed" : `unowned edits: ${unowned.join(", ")}`));
    const checkout = existsSync(join(dest, "features/checkout.md")) ? readFileSync(join(dest, "features/checkout.md"), "utf8") : "";
    const refund = existsSync(join(dest, "features/refund.md")) ? readFileSync(join(dest, "features/refund.md"), "utf8") : "";
    const documented = [...backtickNodeCommands(checkout), ...backtickNodeCommands(refund)];
    const documentedOk = documented.length > 0 && documented.every((command) => {
      const args = nodeArgs(command);
      return args !== null && runNode(args, dest).status === 0;
    });
    const checkoutFlow = runNode(["scripts/drive.mjs", "--flow", "checkout"], dest).status === 0;
    const refundFlow = runNode(["scripts/drive.mjs", "--flow", "refund"], dest).status === 0;
    checks.push(
      check(
        "procedures-proved",
        documentedOk && checkoutFlow && refundFlow,
        documentedOk && checkoutFlow && refundFlow ? "documented drives and both --flow paths pass" : "owned procedure still fails",
      ),
    );
    const span = editSpan(log);
    const postDrives = matchingIndexes(
      log,
      (entry) =>
        (entry.phase === "verify" || entry.phase === "regression") &&
        entry.command.includes("drive.mjs") &&
        entry.command.includes("--flow"),
    ).filter((index) => isAfterEdit(index, span));
    const flowsOk = latestFlowOk(log, postDrives, "checkout") && latestFlowOk(log, postDrives, "refund");
    checks.push(
      check(
        "verification-then-edit",
        hasEdit(span) && flowsOk,
        hasEdit(span) && flowsOk ? "each flow's latest drive check follows the helper edit" : "verification is missing, failed, or precedes a later edit",
      ),
    );
    const helperChanged = changes.includes("scripts/drive.mjs");
    const failedFlows = ["checkout", "refund"].filter((flow) => !latestFlowOk(log, postDrives, flow));
    const dependentsOk = !helperChanged || failedFlows.length === 0;
    checks.push(
      check(
        "missing-dependent",
        dependentsOk,
        dependentsOk ? "checkout and refund exercised after the helper edit" : `missing-dependent:${failedFlows.join(",")}`,
      ),
    );
    checks.push(
      check(
        "product-defect-returned",
        report.product_defects.includes("src/refund.js"),
        report.product_defects.includes("src/refund.js") ? "refund defect returned" : "product defect dropped",
      ),
    );
    return gradeFrom(checks);
  } finally {
    removeWorktree(dest);
  }
}

export function gradeMaintenanceCase(kind: string, fixtureDir: string, caseInput: MaintenanceCase): OutcomeGrade {
  const report = extractReport(caseInput.answer);
  if (!report) return incomplete("maintenance_report missing");
  const overlay = caseInput.overlayDir;
  if (kind === "maintenance-audit") return gradeAudit(report, fixtureDir, caseInput.commandLog, overlay);
  if (kind === "maintenance-repair") return gradeRepair(report, fixtureDir, caseInput.commandLog, overlay);
  if (kind === "maintenance-verification") return gradeVerification(report, fixtureDir, caseInput.commandLog, overlay);
  return incomplete(`no maintenance grader for ${kind}`);
}

export function gradeMaintenanceFixture(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const fixtureDir = join(ctx.repoRoot, "evals", "fixtures", run.fixture_id);
  const answerPath = run.artifacts?.answer ? join(ctx.repoRoot, run.artifacts.answer) : undefined;
  const answer = answerPath && existsSync(answerPath) ? readFileSync(answerPath, "utf8") : (run.outcome ?? "");
  const logPath = run.artifacts?.command_log ? join(ctx.repoRoot, run.artifacts.command_log) : undefined;
  let commandLog: CommandLogEntry[] = [];
  if (logPath && existsSync(logPath)) {
    try {
      const parsed: unknown = JSON.parse(readFileSync(logPath, "utf8"));
      commandLog = Array.isArray(parsed) ? (parsed as CommandLogEntry[]) : [];
    } catch {
      commandLog = [];
    }
  }
  const overlayDir = run.artifacts?.overlay ? join(ctx.repoRoot, run.artifacts.overlay) : undefined;
  const caseInput: MaintenanceCase = { fixtureDir, answer, commandLog };
  if (overlayDir) caseInput.overlayDir = overlayDir;
  return gradeMaintenanceCase(run.fixture_id, fixtureDir, caseInput);
}
