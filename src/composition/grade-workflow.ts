import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { extractCompletionReport } from "../eval/completion-report.js";
import type { CommandLogEntry, EvalContext, EvalRun, OutcomeCheck, OutcomeGrade } from "../eval/types.js";
import { materializeFixture, readIfExists, removeWorktree } from "../eval/worktree.js";

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

function fixtureDir(ctx: EvalContext, id: string): string {
  return join(ctx.repoRoot, "evals", "fixtures", id);
}

function resolveArtifact(ctx: EvalContext, path: string | undefined): string | undefined {
  if (!path) return undefined;
  return join(ctx.repoRoot, path);
}

function readJson(path: string | undefined): unknown {
  if (!path || !existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8"));
}

function commandLog(run: EvalRun, ctx: EvalContext): CommandLogEntry[] {
  const path = resolveArtifact(ctx, run.artifacts?.command_log);
  const parsed = readJson(path);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is CommandLogEntry => {
    return item !== null && typeof item === "object" && typeof (item as CommandLogEntry).command === "string";
  });
}

function withTree<T>(ctx: EvalContext, id: string, run: EvalRun, fn: (root: string) => T): T {
  const dest = materializeFixture(fixtureDir(ctx, id), resolveArtifact(ctx, run.artifacts?.overlay ?? run.artifacts?.patch));
  try {
    return fn(dest);
  } finally {
    removeWorktree(dest);
  }
}

function runNode(args: string[], cwd: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync("node", args, { cwd, encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "pipe"] });
    return { ok: true, output };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return { ok: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function observe(root: string, source: string): { ok: boolean; output: string; value: unknown } {
  const result = runNode(["--input-type=module", "-e", source], join(root, "repo"));
  try {
    return { ...result, value: result.ok ? JSON.parse(result.output) : undefined };
  } catch {
    return { ...result, ok: false, value: undefined };
  }
}

function preservedOracle(root: string, ctx: EvalContext, id: string, name: string): OutcomeCheck {
  const unchanged = sameFile(root, fixtureDir(ctx, id), `repo/scripts/${name}`);
  return check("oracle-integrity", unchanged, unchanged ? "verification recipe unchanged" : "candidate changed the verification oracle");
}

function sameFile(root: string, originalRoot: string, relativePath: string): boolean {
  return (readIfExists(join(root, relativePath)) ?? "") === (readIfExists(join(originalRoot, relativePath)) ?? "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function gradeW1(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const original = fixtureDir(ctx, run.fixture_id);
    const unchanged = sameFile(root, original, "repo/src/export.js");
    const questions = readJson(join(root, "questions.json"));
    const rounds = isRecord(questions) && Array.isArray(questions.rounds) ? questions.rounds : [];
    const first = isRecord(rounds[0]) ? rounds[0] : undefined;
    const asked = Array.isArray(first?.asked) ? first.asked.filter(isRecord) : [];
    const ids = asked.map((item) => item.id);
    const deferred = Array.isArray(first?.deferred) ? first.deferred.filter((item) => typeof item === "string") : [];
    const both =
      ids.includes("field-scope") &&
      ids.includes("output-format") &&
      asked.every((item) => {
        const alternatives = Array.isArray(item.alternatives) ? item.alternatives : [];
        return (
          typeof item.recommendation === "string" &&
          item.recommendation.length > 0 &&
          typeof item.changes === "string" &&
          item.changes.length > 0 &&
          alternatives.length >= 2
        );
      });
    const waits = deferred.includes("column-order") && !ids.includes("column-order");
    const log = commandLog(run, ctx);
    const inspected = log.some((entry) => /export\.js/.test(entry.command) && entry.phase === "read");
    const edited = log.some((entry) => /export\.js/.test(entry.command) && entry.phase === "edit");
    return gradeFrom([
      check("unchanged", unchanged && !edited, unchanged && !edited ? "export.js unchanged" : "product file changed before answers"),
      check("batch", both, both ? "scope and format asked together" : "independent material choices were not both asked"),
      check("deferred", waits, waits ? "dependent question waited" : "dependent question was asked early"),
      check("inspection", inspected, inspected ? "inspection continued" : "no continued inspection of export.js"),
    ]);
  });
}

function gradeW2(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const result = observe(root, `
      import { header, row } from "./src/export.js";
      const customer = { name: "Ada", email: "a@x.test", invoices: "9", paymentMethods: "card" };
      console.log(JSON.stringify({ header: header(), row: row(customer) }));
    `);
    const exported = result.ok && isRecord(result.value) && result.value.header === "name,email" && result.value.row === "Ada,a@x.test";
    const askedAgain = existsSync(join(root, "questions.json"));
    return gradeFrom([
      check("export", exported, exported ? "approved CSV fields only" : result.output.slice(0, 300)),
      preservedOracle(root, ctx, run.fixture_id, "check-export.mjs"),
      check("no-repeat", !askedAgain, askedAgain ? "repeated a settled choice" : "followed the existing policy"),
    ]);
  });
}

function gradeW3(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const weak = runNode(["--test", "src/greet.test.js"], join(root, "repo"));
    const hidden = observe(root, `
      import { greet } from "./src/greet.js";
      console.log(JSON.stringify([greet("Ada", true), greet("Lin", true)]));
    `);
    const behavior = hidden.ok && Array.isArray(hidden.value) && hidden.value.length === 2 && hidden.value[0] === "hello, Ada" && hidden.value[1] === "hello, Lin";
    const review = readJson(join(root, "review.json"));
    const findings = isRecord(review) && Array.isArray(review.findings) ? review.findings.filter(isRecord) : [];
    const caught = findings.some(
      (item) => item.dimension === "Spec" && item.path === "repo/src/greet.js" && /name/.test(String(item.detail ?? "")),
    );
    const log = commandLog(run, ctx);
    const proved = log.some((entry) => entry.command.includes("hidden-greet") && entry.exit_status === 0);
    return gradeFrom([
      check("weak-green", weak.ok, weak.ok ? "weak suite is green" : "weak suite failed"),
      check("behavior", behavior, behavior ? "greeting includes each supplied name" : "name requirement still fails"),
      preservedOracle(root, ctx, run.fixture_id, "hidden-greet.mjs"),
      check("review", caught, caught ? "spec inspection recorded the gap" : "no spec finding for the untested name"),
      check("evidence", proved, proved ? "final behavior command passed" : "no successful final behavior command"),
    ]);
  });
}

function gradeW4(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const result = observe(root, `
      import { readFileSync } from "node:fs";
      import { label } from "./src/label.js";
      import { limit } from "./src/limit.js";
      const test = readFileSync("src/limit.test.js", "utf8");
      console.log(JSON.stringify({ limit: limit(), label: label(), assertion: test.includes("assert.equal(limit(), 10)") }));
    `);
    const oracle = result.ok && isRecord(result.value) && result.value.limit === 10 && result.value.label === "Create" && result.value.assertion === true;
    const review = readJson(join(root, "review.json"));
    const findings = isRecord(review) && Array.isArray(review.findings) ? review.findings.filter(isRecord) : [];
    const limit = findings.find((item) => item.id === "limit");
    const label = findings.find((item) => item.id === "label");
    const restored = isRecord(limit) && limit.disposition === "restored";
    const authorized = isRecord(label) && label.disposition === "authorized" && /requirement/.test(String(label.reason ?? ""));
    return gradeFrom([
      check("oracle", oracle, oracle ? "limit stays 10 and label is Create" : result.output.slice(0, 300)),
      preservedOracle(root, ctx, run.fixture_id, "hidden-oracle.mjs"),
      check("weakening", restored, restored ? "unjustified weakening restored" : "weakening was not identified"),
      check("legitimate", authorized, authorized ? "authorized rename accepted" : "legitimate test change was not accepted"),
    ]);
  });
}

function gradeW5(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const result = observe(root, `
      import { buttonLabel } from "./src/button.js";
      console.log(JSON.stringify(buttonLabel()));
    `);
    const label = result.ok && result.value === "Create";
    const test = runNode(["--test", "src/button.test.js"], join(root, "repo"));
    return gradeFrom([
      check("label", label, label ? "label is Create" : "label was not updated"),
      check("test", test.ok, test.ok ? "existing test passed" : test.output.slice(0, 300)),
    ]);
  });
}

function gradeW6(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const original = fixtureDir(ctx, run.fixture_id);
    const same = sameFile(root, original, "repo/src/app.js");
    const decisions = readJson(join(root, "decisions.json"));
    const resolved = isRecord(decisions) && Array.isArray(decisions.resolved) ? decisions.resolved.filter(isRecord) : [];
    const both = resolved.length >= 2 && resolved.every((item) => item.method === "source" && typeof item.evidence === "string");
    const grilled = resolved.some((item) => item.method === "grilling") || run.skills_invoked.includes("grill-with-docs");
    const implemented = isRecord(decisions) && decisions.implemented === true;
    return gradeFrom([
      check("both", both, both ? "two source decisions resolved" : "fewer than two evidence-backed decisions"),
      check("chart-only", same && !implemented, same && !implemented ? "destination not implemented" : "chart-only authority implemented the feature"),
      check("no-grill", !grilled, grilled ? "defaulted to grilling" : "did not default to grilling"),
    ]);
  });
}

function gradeW7(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const pack = observe(root, `
      import { readFileSync, realpathSync } from "node:fs";
      import { resolve, sep } from "node:path";
      const packageRoot = realpathSync(process.cwd());
      const pkg = JSON.parse(readFileSync("package.json", "utf8"));
      const files = pkg.files.map((file) => {
        const target = realpathSync(resolve(packageRoot, file));
        if (!target.startsWith(packageRoot + sep)) throw new Error("package file outside fixture");
        return { file, failed: readFileSync(target, "utf8").includes("PACK_FAIL") };
      });
      console.log(JSON.stringify(files));
    `);
    const packaged = pack.ok && Array.isArray(pack.value) && pack.value.length > 0 && pack.value.every((item) => isRecord(item) && item.failed === false);
    const index = readIfExists(join(root, "repo/src/index.js")) ?? "";
    const dynamic = readIfExists(join(root, "repo/src/load-plugin.js")) ?? "";
    const side = readIfExists(join(root, "repo/src/register-metrics.js")) ?? "";
    const protectedOk = index.includes("formatName") && dynamic.includes("process.env.PLUGIN") && side.includes("registerMetrics");
    const removed = !existsSync(join(root, "repo/src/internal/stamp.js"));
    return gradeFrom([
      check("pack", packaged, packaged ? "trusted pack check passed" : pack.output.slice(0, 300)),
      preservedOracle(root, ctx, run.fixture_id, "pack-check.mjs"),
      check("removed", removed, removed ? "unused private target removed" : "private target kept despite packaging cost"),
      check("protected", protectedOk, protectedOk ? "export, dynamic load, and side effect remain" : "a protected target was removed"),
    ]);
  });
}

function gradeW8(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const test = runNode(["--test", "src/add.test.js"], join(root, "repo"));
    const trace = readJson(join(root, "trace.json"));
    const hypotheses = isRecord(trace) && Array.isArray(trace.hypotheses) ? trace.hypotheses.filter(isRecord) : [];
    const ranked = hypotheses.length >= 1 && hypotheses.every((item) => typeof item.prediction === "string" && item.prediction.length > 0);
    const filler = hypotheses.length >= 3 && hypotheses.slice(1).every((item) => item.prediction === "");
    const log = commandLog(run, ctx);
    const red = log.some((entry) => entry.phase === "repro" && entry.exit_status === 1);
    const green = log.some((entry) => entry.phase === "verify" && entry.exit_status === 0);
    return gradeFrom([
      check("fixed", test.ok, test.ok ? "1 + 1 is 2" : "original failure remains"),
      check("hypothesis", ranked && !filler, ranked && !filler ? "ranked falsifiable hypothesis" : "filler hypothesis quota"),
      check("loop", red && green, red && green ? "red then verify" : "red-capable loop was not recorded"),
    ]);
  });
}

function causalFixSequence(log: CommandLogEntry[]): boolean {
  let failed = 0;
  let lastFailure = -1;
  let reassessAt = -1;
  let probeAt = -1;
  let guardedFixes = 0;
  let lastFix = -1;
  for (const [index, entry] of log.entries()) {
    if (entry.phase === "reassess") {
      const causal = /causal:\s*\S/.test(entry.stdout ?? "");
      reassessAt = failed >= 3 && causal ? index : -1;
      probeAt = -1;
    } else if (["probe", "repro", "regression"].includes(entry.phase ?? "") && reassessAt > lastFailure) {
      if ((entry.exit_status === 0 || entry.exit_status === 1) && (entry.stdout ?? "").trim()) probeAt = index;
    } else if (entry.phase === "fix") {
      if (entry.exit_status === null || !Number.isInteger(entry.exit_status)) return false;
      if (failed >= 3) {
        if (reassessAt <= lastFailure || probeAt <= reassessAt || probeAt >= index) return false;
        guardedFixes++;
      }
      lastFix = index;
      if (entry.exit_status !== 0) {
        failed++;
        lastFailure = index;
      } else {
        failed = 0;
      }
    }
  }
  return guardedFixes > 0 && log.slice(lastFix + 1).some((entry) => entry.phase === "verify" && entry.exit_status === 0);
}

function gradeW9(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const test = runNode(["--test", "src/index.test.js"], join(root, "repo"));
    const log = commandLog(run, ctx);
    const stopped = causalFixSequence(log);
    const human = log.some((entry) => entry.phase === "ask");
    return gradeFrom([
      check("fixed", test.ok, test.ok ? "symptom fixed after reassessment" : "symptom remains"),
      check("reassess", stopped, stopped ? "new causal evidence preceded another fix" : "patching continued without reassessment"),
      check("no-meeting", !human, human ? "asked without a qualifying blocker" : "investigation stayed autonomous"),
    ]);
  });
}

function gradeW10(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const design = readJson(join(root, "design.json"));
    const record = isRecord(design) ? design : undefined;
    const alternatives = record && Array.isArray(record.alternatives) ? record.alternatives.filter((item) => typeof item === "string") : [];
    const distinct = new Set(alternatives).size >= 2 && typeof record?.synthesis === "string";
    const arena = record?.arena === true;
    const reason = record ? String(record.justification ?? "") : "";
    const justified = /consequential|explicit/.test(reason);
    const auto = arena && !justified;
    return gradeFrom([
      check("alternatives", distinct, distinct ? "two alternatives and a synthesis" : "missing a distinct alternative"),
      check("arena", !auto, auto ? "arena ran because the host supports it" : "arena stayed conditional"),
    ]);
  });
}

function gradeW11(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const original = fixtureDir(ctx, run.fixture_id);
    const models = sameFile(root, original, ".methodrail/MODELS.yaml");
    const verify = sameFile(root, original, ".agents/skills/verify-project/SKILL.md");
    const log = commandLog(run, ctx);
    const researched = log.some((entry) => /models-policy\.mjs propose|live probe|catalog/.test(entry.command));
    return gradeFrom([
      check("files", models && verify, models && verify ? "policy and verification unchanged" : "refresh wrote files"),
      check("no-research", !researched, researched ? "catalog research or live probe ran" : "no catalog research or live probe"),
    ]);
  });
}

function gradeW12(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const original = fixtureDir(ctx, run.fixture_id);
    const unselected = sameFile(root, original, "repo/src/unselected.js");
    const a = (readIfExists(join(root, "repo/src/a.js")) ?? "").includes("repaired");
    const b = (readIfExists(join(root, "repo/src/b.js")) ?? "").includes("repaired");
    const log = commandLog(run, ctx);
    const editB = log.findIndex((entry) => entry.phase === "edit" && /b\.js/.test(entry.command));
    const recheck = editB >= 0 && log.slice(editB + 1).some((entry) => entry.phase === "verify" && /check-a/.test(entry.command) && entry.exit_status === 0);
    return gradeFrom([
      check("repairs", a && b, a && b ? "both selected repairs landed" : "a selected repair is missing"),
      check("recheck", recheck, recheck ? "shared check reran after the later edit" : "batch claim skipped the invalidated check"),
      check("unselected", unselected, unselected ? "unselected file unchanged" : "unselected file changed"),
    ]);
  });
}

function gradeW13(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answerPath = resolveArtifact(ctx, run.artifacts?.answer);
  const answer = answerPath && existsSync(answerPath) ? readFileSync(answerPath, "utf8") : "";
  const standalonePath = resolveArtifact(ctx, run.artifacts?.transcript);
  const standalone = standalonePath && existsSync(standalonePath) ? readFileSync(standalonePath, "utf8") : "";
  if (!answer.trim() || !standalone.trim()) return incomplete("completion fixture requires answer and standalone transcript artifacts");
  const ownerBlocks = answer.match(/methodrail_completion:/g) ?? [];
  const owner = extractCompletionReport(answer);
  const leaf = extractCompletionReport(standalone);
  return gradeFrom([
    check("one-report", ownerBlocks.length === 1 && owner?.claim !== undefined, ownerBlocks.length === 1 ? "one owner report" : `${ownerBlocks.length} completion blocks`),
      check(
        "leaves",
        /Standards:/.test(answer) && /evidence:/.test(answer),
        /Standards:/.test(answer) && /evidence:/.test(answer) ? "owner answer carries leaf evidence" : "leaf evidence missing from the owner answer",
      ),
    check("standalone", leaf?.claim !== undefined && leaf.verification !== undefined, leaf ? "standalone verify report parses" : "standalone report missing"),
  ]);
}

function gradeW14(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  return withTree(ctx, run.fixture_id, run, (root) => {
    const tickets = ["01-fields.md", "02-csv.md"].map((name) => readIfExists(join(root, "tickets", name)) ?? "");
    const covered = (tickets[0] ?? "").includes("approved fields") && (tickets[1] ?? "").includes("csv header");
    const proof = tickets.every((ticket) => /verify-project/.test(ticket) && /scenario:/.test(ticket) && /expected:/.test(ticket));
    const copied = tickets.some((ticket) => /npm start|reset the database/.test(ticket));
    const quiz = tickets.some((ticket) => /granular enough|which seam/i.test(ticket));
    return gradeFrom([
      check("coverage", covered && tickets.every((ticket) => ticket.length > 0), covered ? "both outcomes have tickets" : "a required outcome has no ticket"),
      check("proof", proof && !copied, proof && !copied ? "tickets point at the existing flow" : "tickets copy driving instructions or omit the scenario"),
      check("autonomous", !quiz, quiz ? "asked a routine granularity question" : "routine cut was chosen"),
    ]);
  });
}

function gradeW15(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const usage = run.usage;
  if (!usage) return gradeFrom([check("usage", false, "usage record missing")]);
  const reportPath = resolveArtifact(ctx, usage.artifact);
  const report = readJson(reportPath);
  if (!isRecord(report)) return incomplete("usage artifact missing");
  const fields = ["input_tokens", "output_tokens", "cached_input_tokens", "total_tokens"] as const;
  const exact = fields.every((field) => usage[field] === report[field]);
  const scope = usage.scope === report.scope;
  const zeroFill = fields.every((field) => report[field] === null) && fields.some((field) => usage[field] === 0);
  const fullClaim = usage.scope !== "complete-run" && /full task cost/i.test(run.outcome);
  const dollars = /\$|dollar/i.test(run.outcome);
  return gradeFrom([
    check("counters", exact && scope && !zeroFill, exact && scope && !zeroFill ? "counters match the native report" : "counters were altered, zero-filled, or mis-scoped"),
    check("scope-label", !fullClaim, fullClaim ? "partial usage presented as full task cost" : "scope label is honest"),
    check("not-cost", !dollars, dollars ? "token counts presented as money" : "tokens are not a dollar cost"),
  ]);
}

const GRADERS: Record<string, (run: EvalRun, ctx: EvalContext) => OutcomeGrade> = {
  "w1-batch-decision": gradeW1,
  "w2-settled-policy": gradeW2,
  "w3-weak-tests": gradeW3,
  "w4-weakened-oracle": gradeW4,
  "w5-mechanical-edit": gradeW5,
  "w6-wayfinder-decisions": gradeW6,
  "w7-refactor-benefit": gradeW7,
  "w8-single-hypothesis": gradeW8,
  "w9-fix-reassessment": gradeW9,
  "w10-bounded-architecture": gradeW10,
  "w11-refresh-noop": gradeW11,
  "w12-shared-recheck": gradeW12,
  "w13-completion-owner": gradeW13,
  "w14-ticket-proof": gradeW14,
  "w15-native-usage": gradeW15,
};

export function gradeWorkflowFixture(run: EvalRun, ctx: EvalContext): OutcomeGrade | undefined {
  return GRADERS[run.fixture_id]?.(run, ctx);
}
