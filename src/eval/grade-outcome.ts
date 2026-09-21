import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { materializeFixture, readIfExists, removeWorktree, OVERLAY_MANIFEST } from "./worktree.js";
import { walkFiles } from "../fs-walk.js";
import type { CommandLogEntry, EvalContext, EvalRun, OutcomeCheck, OutcomeGrade } from "./types.js";

function check(id: string, passed: boolean, detail: string): OutcomeCheck {
  return { id, passed, detail };
}

function gradeFrom(checks: OutcomeCheck[], incomplete = false): OutcomeGrade {
  const failures = checks.filter((item) => !item.passed).map((item) => `${item.id}: ${item.detail}`);
  return {
    passed: !incomplete && failures.length === 0,
    incomplete,
    checks,
    failures,
  };
}

function incompleteGrade(reason: string): OutcomeGrade {
  return gradeFrom([check("artifacts", false, reason)], true);
}

function resolve(repoRoot: string, path: string | undefined): string | undefined {
  if (!path) return undefined;
  return join(repoRoot, path);
}

function loadAnswer(run: EvalRun, repoRoot: string): string {
  const answerPath = resolve(repoRoot, run.artifacts?.answer);
  if (answerPath && existsSync(answerPath)) return readFileSync(answerPath, "utf8");
  return run.outcome ?? "";
}

function loadCommandLog(run: EvalRun, repoRoot: string): CommandLogEntry[] {
  const path = resolve(repoRoot, run.artifacts?.command_log);
  if (!path || !existsSync(path)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(parsed) ? (parsed as CommandLogEntry[]) : [];
  } catch {
    return [];
  }
}

function overlayDir(run: EvalRun, repoRoot: string): string | undefined {
  return resolve(repoRoot, run.artifacts?.overlay ?? run.artifacts?.patch);
}

function withWorktree<T>(fixtureDir: string, overlay: string | undefined, fn: (root: string) => T): T {
  const dest = materializeFixture(fixtureDir, overlay);
  try {
    return fn(dest);
  } finally {
    removeWorktree(dest);
  }
}

function runNode(args: string[], cwd: string): { ok: boolean; output: string } {
  try {
    const output = execFileSync("node", args, {
      cwd,
      encoding: "utf8",
      timeout: 20000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, output };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return { ok: false, output: `${err.stdout ?? ""}${err.stderr ?? ""}` };
  }
}

function fixtureDir(ctx: EvalContext, id: string): string {
  return join(ctx.repoRoot, "evals", "fixtures", id);
}

function npmInstallAction(command: string): "ci" | "install" | null {
  for (const segment of command.split(/\s*(?:&&|\|\||;)\s*/)) {
    const match = segment
      .trim()
      .match(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S+\s+)*npm(?:\s+--[^\s]+)*\s+(ci|install)(?:\s|$)/);
    if (match?.[1] === "ci" || match?.[1] === "install") return match[1];
  }
  return null;
}

function gradeSimpleChange(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("simple-change requires an overlay/patch artifact");
  return withWorktree(fixtureDir(ctx, "simple-change"), overlay, (root) => {
    const repo = join(root, "repo");
    const source = readIfExists(join(repo, "src/button.js")) ?? "";
    const label = /return "Create"/.test(source) && !/return "Save"/.test(source);
    const test = runNode(["--test", "src/button.test.js"], repo);
    return gradeFrom([
      check("label", label, label ? "buttonLabel returns Create" : "buttonLabel does not return Create"),
      check("test", test.ok, test.ok ? "fixture unit test passed" : `fixture unit test failed: ${test.output.slice(0, 400)}`),
    ]);
  });
}

function gradeMediumFeature(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("medium-feature requires an overlay/patch artifact");
  return withWorktree(fixtureDir(ctx, "medium-feature"), overlay, (root) => {
    const repo = join(root, "repo");
    const source = readIfExists(join(repo, "src/cli.js")) ?? "";
    const hasGreet = /--greet/.test(source) && /hello,\s*/.test(source);
    const keepsDefault = source.includes("`hi ${") || source.includes("hi ${nameFromArgs") || /return `hi /.test(source);
    const test = runNode(["--test", "src/cli.test.js"], repo);
    return gradeFrom([
      check("greet-flag", hasGreet, hasGreet ? "--greet prints hello, <name>" : "missing --greet hello, <name> behavior"),
      check("default-kept", keepsDefault, keepsDefault ? "default greeting kept" : "default greeting missing"),
      check("test", test.ok, test.ok ? "CLI tests passed" : `CLI tests failed: ${test.output.slice(0, 400)}`),
    ]);
  });
}

function gradeRuntimeBug(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("runtime-bug requires an overlay/patch artifact");
  return withWorktree(fixtureDir(ctx, "runtime-bug"), overlay, (root) => {
    const file = join(root, "repo/src/session.js");
    const driver = `
      import { landingPath } from ${JSON.stringify(file)};
      const cases = [
        [{}, "/login"],
        [{ token: "x", expired: true }, "/login"],
        [{ token: "x", expiresAt: "2000-01-01T00:00:00.000Z" }, "/login"],
        [{ token: "x", expiresAt: "2099-01-01T00:00:00.000Z" }, "/dashboard"],
      ];
      let failed = [];
      for (const [session, expected] of cases) {
        const actual = landingPath(session);
        if (actual !== expected) failed.push(JSON.stringify({ session, expected, actual }));
      }
      if (failed.length) {
        console.error(failed.join("\\n"));
        process.exit(1);
      }
    `;
    const result = runNode(["--input-type=module", "-e", driver], root);
    return gradeFrom([
      check(
        "expired-landing",
        result.ok,
        result.ok
          ? "expired sessions land on /login; valid sessions keep /dashboard"
          : `landingPath driver failed: ${result.output.slice(0, 500)}`,
      ),
    ]);
  });
}

function gradeArchitectureDecision(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("architecture-decision requires an overlay artifact");
  return withWorktree(fixtureDir(ctx, "architecture-decision"), overlay, (root) => {
    const session = readIfExists(join(root, "repo/src/session.js")) ?? "";
    const decisionDir = join(root, ".methodrail/knowledge/decisions");
    let decision = "";
    if (existsSync(decisionDir)) {
      for (const name of readdirSync(decisionDir)) {
        decision += readIfExists(join(decisionDir, name)) ?? "";
      }
    }
    const recorded = /session/i.test(decision) && /organization/i.test(decision);
    const rewrite = /orgId/.test(session) && !/userId/.test(session);
    const grounded = /userId/.test(session);
    return gradeFrom([
      check("grounded", grounded && !rewrite, rewrite ? "rewrote session ownership without a first slice" : "current User-keyed implementation still present"),
      check("decision", recorded, recorded ? "recorded a session-ownership decision" : "no decision record naming Session/Organization"),
    ]);
  });
}

function gradeReviewRisk(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("review-risk requires an answer artifact");
  const flagsMissing = /missing|no test|no evidence|author claim|unverified/i.test(answer);
  const payment = /payment|charge|blast|retry/i.test(answer);
  const trustedClaim = /lgtm|tests passed,? ship|author is correct/i.test(answer) && !flagsMissing;
  return gradeFrom([
    check("missing-evidence", flagsMissing && !trustedClaim, flagsMissing ? "flagged missing evidence" : "did not flag missing test evidence"),
    check("blast-radius", payment, payment ? "noted payment-path risk" : "did not note payment blast radius"),
  ]);
}

function gradeProjectInit(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("project-init requires an overlay artifact");
  return withWorktree(fixtureDir(ctx, "project-init"), overlay, (root) => {
    const project = readIfExists(join(root, "repo/.methodrail/PROJECT.md")) ?? readIfExists(join(root, ".methodrail/PROJECT.md")) ?? "";
    const readme = readIfExists(join(root, "repo/README.md")) ?? "";
    const exists = project.length > 0;
    const copied = exists && readme.length > 0 && project.includes(readme.trim()) && project.trim() === readme.trim();
    const pointer = exists && /npm test/i.test(project) && project.split(/\r?\n/).length <= 80;
    const notCopied = exists && !copied && !/# Widget CLI/.test(project);
    return gradeFrom([
      check("project-md", exists, exists ? "PROJECT.md present" : "PROJECT.md missing"),
      check("pointer-index", pointer && notCopied, pointer && notCopied ? "pointer index names npm test" : "PROJECT.md copies README or omits npm test"),
    ]);
  });
}

function gradeInitValue(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("init-value requires an overlay artifact");
  const installActions = loadCommandLog(run, ctx.repoRoot)
    .map((entry) => npmInstallAction(entry.command ?? ""))
    .filter((action): action is "ci" | "install" => action !== null);
  return withWorktree(fixtureDir(ctx, "init-value"), overlay, (root) => {
    const repo = join(root, "repo");
    let testSource = "";
    const walk = (dir: string): void => {
      if (!existsSync(dir)) return;
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(js|mjs|cjs|ts)$/.test(name)) testSource += readFileSync(path, "utf8") + "\n";
      }
    };
    walk(join(repo, "test"));
    const usedCi = installActions.includes("ci");
    const usedInstall = installActions.includes("install");
    const listens = /app\.listen|\.listen\(3000\)/.test(testSource);
    const inProcess = /createApp\(/.test(testSource) && !listens;
    const test = runNode(["--test", "test/hello.test.js"], repo);
    return gradeFrom([
      check("install", usedInstall && !usedCi, usedCi ? "used npm ci" : usedInstall ? "used npm install" : "no npm install in command log"),
      check("in-process", inProcess, inProcess ? "HTTP driven in-process" : "test listens or does not drive createApp"),
      check("test", test.ok, test.ok ? "hello tests passed" : `hello tests failed: ${test.output.slice(0, 400)}`),
    ]);
  });
}

function gradeKnowledgeFreshness(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("knowledge-freshness requires an answer artifact");
  const source = readFileSync(join(fixtureDir(ctx, "knowledge-freshness"), "repo/src/auth.js"), "utf8");
  const cookieFact = /sid=/.test(source) && /set-cookie/.test(source);
  const mentionsSession = /sid|cookie|session/i.test(answer);
  const treatsJwtAsCurrent = /jwt\.sign|bearer/i.test(answer) && !/stale|not |no longer|retired|flag/i.test(answer);
  const flagsStale = /stale|retired|not JWT|no longer|flag/i.test(answer);
  return gradeFrom([
    check("source-fact", cookieFact, "fixture source uses sid cookies"),
    check("answer-sessions", mentionsSession && !treatsJwtAsCurrent, mentionsSession && !treatsJwtAsCurrent ? "answer uses current session/cookie mechanism" : "answer treats JWT as current or omits sessions"),
    check("stale-flag", flagsStale || !treatsJwtAsCurrent, flagsStale || !treatsJwtAsCurrent ? "JWT not treated as current" : "trusted stale JWT knowledge"),
  ]);
}

function gradeKnowledgeAccumulation(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("knowledge-accumulation requires an overlay artifact");
  return withWorktree(fixtureDir(ctx, "knowledge-accumulation"), overlay, (root) => {
    const driver = `
      const { handle, balanceOf } = require("./repo/src/webhooks.js");
      const event = { id: "evt_inv_grade", type: "invoice.paid", data: { walletId: "w_grade", cents: 900 } };
      const first = handle(event);
      const second = handle(event);
      if (!first) { console.error("invoice.paid not routed"); process.exit(1); }
      if (balanceOf("w_grade") !== 900) { console.error("double credit or miss", balanceOf("w_grade")); process.exit(1); }
      if (second && second.seq !== first.seq && second !== first) {
        console.error("retry did not no-op");
        process.exit(1);
      }
    `;
    const result = runNode(["--input-type=commonjs", "-e", driver], root);
    return gradeFrom([
      check(
        "idempotent-invoice",
        result.ok,
        result.ok ? "invoice.paid is idempotent on eventId" : `idempotency driver failed: ${result.output.slice(0, 500)}`,
      ),
    ]);
  });
}

function gradePartialKnowledge(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("partial-knowledge requires an answer artifact");
  const stripe =
    /stripe[^.\n]{0,100}subscri/i.test(answer) ||
    /subscri[^.\n]{0,100}(?:charged|handled|processed|via|through|by|→)[^.\n]{0,60}stripe/i.test(answer);
  const adyen =
    /adyen[^.\n]{0,100}(?:invoice|one-time|one time)/i.test(answer) ||
    /(?:invoice|one-time|one time)[^.\n]{0,100}(?:charged|handled|processed|via|through|by|→)[^.\n]{0,60}adyen/i.test(answer);
  return gradeFrom([
    check("stripe-subs", stripe, stripe ? "retained Stripe subscriptions" : "lost Stripe subscriptions fact"),
    check("adyen-invoice", adyen, adyen ? "named Adyen for one-time invoices" : "missed Adyen gap or trusted all-Stripe claim"),
  ]);
}

function filesUnchanged(root: string, relativePath: string, original: string): boolean {
  const current = readIfExists(join(root, relativePath)) ?? "";
  return current === original;
}

function overlayTouched(overlay: string | undefined): string[] {
  if (!overlay || !existsSync(overlay)) return [];
  return walkFiles(overlay, () => true)
    .map((path) => relative(overlay, path).split(sep).join("/"))
    .filter((path) => path !== OVERLAY_MANIFEST && !path.endsWith(".DS_Store"));
}

function overlayDeletions(overlay: string | undefined): string[] {
  if (!overlay) return [];
  const manifestPath = join(overlay, OVERLAY_MANIFEST);
  if (!existsSync(manifestPath)) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
    const deletions =
      parsed !== null && typeof parsed === "object" && Array.isArray((parsed as { deletions?: unknown }).deletions)
        ? (parsed as { deletions: unknown[] }).deletions
        : [];
    return deletions.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

function isSourceTreePath(path: string): boolean {
  const normalized = path.split(sep).join("/");
  if (/^(?:src|lib|app|packages|services|repo\/src)(?:\/|$)/.test(normalized)) return true;
  if (normalized.startsWith("docs/") || normalized.startsWith(".methodrail/") || normalized.startsWith(".agents/")) {
    return false;
  }
  if (/(?:^|\/)src\//.test(normalized)) return true;
  return /\.(?:js|cjs|mjs|ts|tsx|jsx)$/i.test(normalized);
}

function overlayEditsSource(overlay: string | undefined): boolean {
  return overlayTouched(overlay).some(isSourceTreePath) || overlayDeletions(overlay).some(isSourceTreePath);
}

function recordsAdrApproval(answer: string): boolean {
  if (
    /\b(?:not|never|without)\s+(?:been\s+)?approv/i.test(answer) ||
    /\bunapproved\b/i.test(answer) ||
    /\bno approval\b/i.test(answer) ||
    /\bdid not wait\b/i.test(answer)
  ) {
    return false;
  }
  return (
    /\bapproved the\b/i.test(answer) ||
    /\bafter (?:the )?(?:three-part )?approval\b/i.test(answer) ||
    /\bwait(?:ed)? for approval\b/i.test(answer) ||
    /\bexplicit approval\b/i.test(answer) ||
    /\b(?:got|gave|received|obtained)\s+(?:explicit\s+)?approval\b/i.test(answer) ||
    /\buser(?:'s)? approval\b/i.test(answer)
  );
}

function approvalNearStore(answer: string): boolean {
  if (
    /\b(?:not|never|without)\s+(?:been\s+)?approv/i.test(answer) ||
    /\bunapproved\b/i.test(answer) ||
    /\bno approval\b/i.test(answer) ||
    /\bdid not wait\b/i.test(answer)
  ) {
    return false;
  }
  const re = /\bapprov(?:ed|al)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(answer))) {
    const start = Math.max(0, match.index - 300);
    const end = Math.min(answer.length, match.index + match[0].length + 300);
    if (/\bADR\b|store|sqlite|file/i.test(answer.slice(start, end))) return true;
  }
  return recordsAdrApproval(answer);
}

function tsvDecisionRows(tsv: string): { phase: string; decision: string }[] {
  return tsv
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const cols = line.split("\t");
      return { phase: cols[1] ?? "", decision: cols[2] ?? "" };
    });
}

function smallChoiceInTsv(tsv: string): boolean {
  return tsvDecisionRows(tsv).some(
    (row) => /json/i.test(row.decision) && !/store|sqlite|file/i.test(`${row.phase}\t${row.decision}`),
  );
}

function namedStaleRetry(answer: string): boolean {
  return /immediate retry|retried immediately|retry.{0,20}immediate/i.test(answer);
}

function contradictionNearStale(answer: string): boolean {
  const stale = /immediate retry|retried immediately|retry.{0,20}immediate/gi;
  let match: RegExpExecArray | null;
  while ((match = stale.exec(answer))) {
    const start = Math.max(0, match.index - 200);
    const end = Math.min(answer.length, match.index + match[0].length + 200);
    if (/contradict|stale|no longer|outdated|reconcil/i.test(answer.slice(start, end))) return true;
  }
  return false;
}

function evidenceBoundary(answer: string): boolean {
  return /does not (?:prove|show|establish)|only (?:proves|shows)|cannot (?:prove|confirm)|Retry-After|not (?:evidence|proof) (?:of|that)/i.test(
    answer,
  );
}

function topRecommendationSpan(answer: string): string | null {
  const re = /top (?:recommendation|candidate|pick)|recommend(?:ed)? first/i;
  const match = re.exec(answer);
  if (!match) return null;
  const from = answer.lastIndexOf("\n", match.index) + 1;
  let end = answer.indexOf("\n\n", from);
  if (end < 0) end = answer.length;
  let span = answer.slice(from, end);
  if (!/orderIntake/i.test(span)) {
    const next = answer.indexOf("\n\n", end + 2);
    span += answer.slice(end, next < 0 ? Math.min(answer.length, end + 500) : next);
  }
  return span;
}

function firstNamedModule(span: string): string | null {
  const match = /orderIntake|ledger|userService|format/i.exec(span);
  return match ? match[0] : null;
}

const ARTIFACT_CURATED = [
  "AGENTS.md",
  "CONTEXT.md",
  "docs/glossary.md",
  "docs/adr/0001-sqlite.md",
  "decisions.tsv",
  "docs/superpowers/specs/checkout.md",
  "docs/superpowers/plans/checkout.md",
  ".agents/skills/verify-shop/SKILL.md",
  ".agents/skills/verify-shop/features/pay.md",
  "src/fees.js",
  ".methodrail/knowledge/fees.md",
  ".methodrail/knowledge/stale.md",
];

function gradeArtifactInteroperability(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("artifact-interoperability requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  const fixture = fixtureDir(ctx, "artifact-interoperability");
  const touched = overlayTouched(overlay);
  const previewClaim = /preview only|zero writes|do not write/i.test(answer);
  const caveat = /freshness means declared relevant paths did not change/i.test(answer);
  const conflict = /conflict/i.test(answer) && /CONTEXT\.md/i.test(answer) && /glossary\.md/i.test(answer);
  return withWorktree(fixture, overlay, (root) => {
    const curatedOk = ARTIFACT_CURATED.every((rel) =>
      filesUnchanged(root, rel, readFileSync(join(fixture, rel), "utf8")),
    );
    const extraWrites = touched.filter((path) => path !== ".methodrail/PROJECT.md");
    const project = readIfExists(join(root, ".methodrail/PROJECT.md")) ?? "";
    const copied =
      /This paragraph is curated human prose/i.test(project) ||
      /\*\*Fee\*\* is computed in billing, never in the cart UI/.test(project);
    const guessed = /canonical glossary is CONTEXT/i.test(project) && !/unresolved|conflict/i.test(project);
    const pointers = /decisions\.tsv/.test(project) && /docs\/adr/.test(project) && /verify-shop/.test(project);
    if (previewClaim) {
      return gradeFrom([
        check(
          "preview-readonly",
          touched.length === 0,
          touched.length === 0 ? "preview left the overlay empty" : `claimed preview but overlay wrote ${touched.join(", ")}`,
        ),
        check("conflict", conflict, conflict ? "reported the glossary conflict" : "did not report CONTEXT.md vs docs/glossary.md"),
        check("caveat", caveat, caveat ? "stated the freshness caveat" : "missing freshness-is-not-truth sentence"),
        check("curated", curatedOk, curatedOk ? "curated artifacts unchanged" : "curated artifacts were modified"),
      ]);
    }
    return gradeFrom([
      check(
        "bounded-overlay",
        extraWrites.length === 0,
        extraWrites.length === 0 ? "only PROJECT.md overlay" : `unexpected overlay files: ${extraWrites.join(", ")}`,
      ),
      check("curated", curatedOk && !copied, curatedOk && !copied ? "curated artifacts preserved" : "copied or edited curated artifacts"),
      check(
        "conflict",
        conflict && !guessed && /unresolved|conflict/i.test(project),
        conflict && !guessed ? "glossary conflict left unresolved" : "guessed a glossary winner",
      ),
      check("pointers", pointers, pointers ? "adopted ADR, TSV, and verify-shop by pointer" : "missing adopted pointers"),
      check("caveat", caveat, caveat ? "stated the freshness caveat" : "missing freshness-is-not-truth sentence"),
    ]);
  });
}

function gradeDecisionLadder(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("decision-ladder requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("decision-ladder requires an overlay artifact");
  const fixture = fixtureDir(ctx, "decision-ladder");
  const originalAdr = readFileSync(join(fixture, "docs/adr/0001-billing-owner.md"), "utf8");
  return withWorktree(fixture, overlay, (root) => {
    const tsv = readIfExists(join(root, "decisions.tsv")) ?? "";
    const header = tsv.split(/\r?\n/, 1)[0]?.trim() === "ts\tphase\tdecision\twhy\tevidence\tresult";
    const adr = readIfExists(join(root, "docs/adr/0002-file-store.md")) ?? "";
    const approved = approvalNearStore(answer);
    const standalone = adr.length > 0 && !/see the tsv/i.test(adr) && /file/i.test(adr) && /sqlite/i.test(adr);
    const smallTsv = smallChoiceInTsv(tsv);
    const smallAdr = /log format|JSON lines/.test(adr) && !/file-backed|sqlite/i.test(adr);
    const tsvOverride = /tsv overrides the adr/i.test(tsv) || /switched back to SQLite in the log/i.test(adr);
    return gradeFrom([
      check("tsv-schema", header, header ? "six-column TSV preserved" : "TSV header changed"),
      check("small-choice", smallTsv && !smallAdr, smallTsv && !smallAdr ? "log format stayed TSV-only" : "small choice missing or ADR-spammed"),
      check("adr-approval", approved && standalone, approved && standalone ? "approved standalone store ADR" : "ADR missing, unapproved, or TSV-dependent"),
      check("adr-0001", filesUnchanged(root, "docs/adr/0001-billing-owner.md", originalAdr), "existing ADR preserved"),
      check("no-tsv-override", !tsvOverride, tsvOverride ? "later TSV overrode the ADR" : "ADR still governs"),
    ]);
  });
}

function gradeKnowledgeReconciliationV09(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("knowledge-reconciliation-v0.9 requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  const fixture = fixtureDir(ctx, "knowledge-reconciliation-v0.9");
  const originalNote = readFileSync(join(fixture, ".methodrail/knowledge/mail.md"), "utf8");
  return withWorktree(fixture, overlay, (root) => {
    const driver = `
      const mailer = require("./repo/src/mailer.js");
      const event = { id: "evt_closed_grade", type: "ticket.closed", data: { to: "user@x.test" } };
      mailer.handle(event);
      mailer.handle(event);
      if (mailer.countFor("ticket.closed") !== 1) {
        console.error("event-id keying failed", mailer.countFor("ticket.closed"));
        process.exit(1);
      }
      if (typeof mailer.backoffMs !== "function" || mailer.backoffMs() < 1000) {
        console.error("retry is immediate rather than backoff");
        process.exit(1);
      }
    `;
    const result = runNode(["--input-type=commonjs", "-e", driver], root);
    const noteOk = filesUnchanged(root, ".methodrail/knowledge/mail.md", originalNote);
    const kept = /event-id/i.test(answer);
    const stale = namedStaleRetry(answer);
    const reconcile = ( /reconcile-required/i.test(answer) || contradictionNearStale(answer) ) && kept && stale;
    const boundary = evidenceBoundary(answer);
    return gradeFrom([
      check(
        "current-behavior",
        result.ok,
        result.ok ? "event-id keying and backoff held" : `driver failed: ${result.output.slice(0, 400)}`,
      ),
      check("note-untouched", noteOk, noteOk ? "note was not rewritten" : "silently rewrote the note"),
      check("reconcile", reconcile, reconcile ? "named valid and stale slices" : "trusted or discarded the whole note"),
      check("evidence-boundary", boundary, boundary ? "explained the evidence boundary" : "missing evidence boundary"),
    ]);
  });
}

function gradeArchitectureDeepening(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("architecture-deepening requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  const fixture = fixtureDir(ctx, "architecture-deepening");
  const noSourceEdit = !overlayEditsSource(overlay);
  return withWorktree(fixture, overlay, () => {
    const passThrough = /userService/i.test(answer) && /pass-through|delete/i.test(answer);
    const deepen = /orderIntake/i.test(answer) && /deepen/i.test(answer);
    const preserve = /ledger/i.test(answer) && /preserve|already deep/i.test(answer);
    const reject = /format/i.test(answer) && /reject|speculative/i.test(answer);
    const span = topRecommendationSpan(answer);
    const first = span ? firstNamedModule(span) : null;
    const top = Boolean(span && /orderIntake/i.test(span) && first && /orderIntake/i.test(first));
    const brief = /\/refactor/i.test(answer) && /characterization|verification/i.test(answer);
    const noCdn = !/cdn\.tailwindcss\.com|cdn\.jsdelivr\.net/i.test(answer);
    return gradeFrom([
      check("no-source-edit", noSourceEdit, noSourceEdit ? "survey did not edit source" : "source changed during survey"),
      check("classes", passThrough && deepen && preserve && reject, passThrough && deepen && preserve && reject ? "classified all four modules" : "missed delete/deepen/preserve/reject"),
      check("top", top, top ? "recommended the shallow intake module" : "recommended the already-deep module or missed intake"),
      check("brief", brief, brief ? "verification-ready /refactor brief" : "missing characterization or /refactor route"),
      check("portable-report", noCdn, noCdn ? "report usable without remote assets" : "report depends on a CDN"),
    ]);
  });
}

function gradeHumanDecision(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("human-decision requires an answer artifact");
  const fixture = fixtureDir(ctx, "human-decision");
  const originalOrg = readFileSync(join(fixture, "repo/src/org.js"), "utf8");
  const overlay = overlayDir(run, ctx.repoRoot);
  return withWorktree(fixture, overlay, (root) => {
    const unchanged = filesUnchanged(root, "repo/src/org.js", originalOrg);
    const ambiguity = /ambig|mixed|customer emails|product copy|not (?:a )?rename instruction|without enough evidence/i.test(answer);
    const renameCost = /cross-product|global rename|branding|API change|migration|code churn|support burden|overwriting|changing the code/i.test(answer);
    const currentContract = /billing.owner|current (?:contract|terminology)|organizationType|noun is Organization/i.test(answer);
    const tradeoffs = /trade-?offs?/i.test(answer) || (ambiguity && (renameCost || currentContract));
    const human = /human|preference|policy|product(?:-language|\/owner)?(?:\/domain)? decision|owner call|owner decision|explicit product/i.test(answer);
    const implemented = /rename applied|implemented the rename|Account rename/i.test(answer);
    return gradeFrom([
      check("protected-files", unchanged, unchanged ? "org.js unchanged" : "org.js was modified"),
      check("tradeoffs", tradeoffs, tradeoffs ? "answer presents tradeoffs" : "answer missing tradeoffs"),
      check("escalate", human && !implemented, implemented ? "implemented the rename" : human ? "escalated to a human" : "did not escalate to a human"),
    ]);
  });
}

function gradeKnowledgeReuse(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("knowledge-reuse requires an overlay artifact");
  return withWorktree(fixtureDir(ctx, "knowledge-reuse"), overlay, (root) => {
    const driver = `
      const { handle, countFor } = require("./repo/src/notify.js");
      const delayed = { id: "evt_delay_grade", type: "shipment.delayed", data: { shipmentId: "s_grade", to: "ops@x.test" } };
      const first = handle(delayed);
      handle(delayed);
      if (!first) { console.error("shipment.delayed not routed"); process.exit(1); }
      if (countFor("shipment.delayed") !== 1) {
        console.error("double notify or miss", countFor("shipment.delayed"));
        process.exit(1);
      }
      const created = { id: "evt_created_grade", type: "shipment.created", data: { shipmentId: "s_created_grade", to: "ops@x.test" } };
      handle(created);
      handle(created);
      if (countFor("shipment.created") !== 1) {
        console.error("shipment.created broken", countFor("shipment.created"));
        process.exit(1);
      }
    `;
    const result = runNode(["--input-type=commonjs", "-e", driver], root);
    return gradeFrom([
      check(
        "idempotent-delayed",
        result.ok,
        result.ok ? "shipment.delayed is keyed on event id" : `event-id driver failed: ${result.output.slice(0, 500)}`,
      ),
    ]);
  });
}

function proposesNoteUpdate(answer: string): boolean {
  return (
    /propos(?:e|ed|ing).{0,80}(?:note update|updat(?:e|ing).{0,40}(?:note|mail\.md|\.methodrail\/knowledge))/is.test(answer) ||
    /(?:note|mail\.md|\.methodrail\/knowledge).{0,60}(?:should|must|needs? to).{0,40}(?:update|refresh|revise|correct|amend)/is.test(
      answer,
    ) ||
    /(?:update|refresh|revise|correct|amend).{0,50}(?:the )?(?:stored )?(?:mail )?(?:knowledge )?note/is.test(answer)
  );
}

function gradeKnowledgeRefresh(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("knowledge-refresh requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("knowledge-refresh requires an overlay artifact");
  const fixture = fixtureDir(ctx, "knowledge-refresh");
  const originalNote = readFileSync(join(fixture, ".methodrail/knowledge/mail.md"), "utf8");
  return withWorktree(fixture, overlay, (root) => {
    const driver = `
      const mailer = require("./repo/src/mailer.js");
      const outbox = require("./repo/src/outbox.js");
      const event = { id: "evt_res_grade", type: "ticket.resolved", data: { ticketId: "t_grade", to: "user@x.test" } };
      const first = mailer.handle(event);
      mailer.handle(event);
      const count = typeof mailer.countFor === "function"
        ? mailer.countFor("ticket.resolved")
        : outbox.deliveries().filter((row) => row.channel === "ticket.resolved").length;
      if (!first) { console.error("ticket.resolved not routed"); process.exit(1); }
      if (count !== 1) { console.error("double mail or miss", count); process.exit(1); }
      const fail = mailer.failSend || outbox.markFailed;
      if (typeof fail !== "function") { console.error("no failSend/markFailed"); process.exit(1); }
      fail(event.id);
      const row = outbox.deliveries().find((item) => item.eventId === event.id);
      if (!row) { console.error("failed send deleted the outbox row"); process.exit(1); }
      console.log("ok");
    `;
    const result = runNode(["--input-type=commonjs", "-e", driver], root);
    const output = result.output;
    const notRouted = /not routed/i.test(output);
    const doubled = /double mail or miss/i.test(output);
    const deleted = /deleted the outbox row/i.test(output);
    const missingFailureApi = /no failSend\/markFailed/i.test(output);
    const completed = result.ok && /(?:^|\n)ok(?:\r?\n|$)/.test(output);
    const keyed = completed || (!notRouted && !doubled && (missingFailureApi || deleted));
    const keptRow = completed;
    const noteUnchanged = filesUnchanged(root, ".methodrail/knowledge/mail.md", originalNote);
    const proposed = proposesNoteUpdate(answer);
    return gradeFrom([
      check("event-id-key", keyed, keyed ? "ticket.resolved is keyed on event id" : `event-id driver failed: ${output.slice(0, 500)}`),
      check(
        "kept-row",
        keptRow,
        keptRow ? "failed send kept the outbox row" : `refresh driver did not complete successfully: ${output.slice(0, 500)}`,
      ),
      check("propose-update", proposed, proposed ? "answer proposes a note update" : "answer did not propose a note update"),
      check("note-untouched", noteUnchanged, noteUnchanged ? "mail.md was not rewritten" : "silently rewrote the knowledge note"),
    ]);
  });
}

function gradeKnowledgeApplicability(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("knowledge-applicability requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("knowledge-applicability requires an overlay artifact");
  const fixture = fixtureDir(ctx, "knowledge-applicability");
  const originalNote = readFileSync(join(fixture, ".methodrail/knowledge/notifications.md"), "utf8");
  return withWorktree(fixture, overlay, (root) => {
    const driver = `
      const legacy = require("./repo/src/notifications/legacy/sender.js");
      const dispatch = require("./repo/src/notifications/dispatch.js");
      const outbox = require("./repo/src/outbox.js");
      const ping = { id: "evt_legacy_same", type: "legacy.ping", data: { n: 1 } };
      const first = legacy.handle({ ...ping, data: { n: 1 } });
      legacy.handle({ ...ping, data: { n: 2 } });
      const pingCount = outbox.countFor("legacy.ping");
      if (!first) { console.error("legacy.ping not routed"); process.exit(1); }
      if (pingCount !== 2) {
        console.error("legacy-fanout collapsed colliding ids", pingCount);
        process.exit(1);
      }
      const notice = { id: "evt_notice_grade", type: "notice.created", data: { to: "ops@harborlight.test" } };
      dispatch.handle(notice);
      dispatch.handle(notice);
      if (outbox.countFor("notice.created") !== 1) {
        console.error("notice.created event-id key broken");
        process.exit(1);
      }
    `;
    const result = runNode(["--input-type=commonjs", "-e", driver], root);
    const noteUnchanged = filesUnchanged(root, ".methodrail/knowledge/notifications.md", originalNote);
    return gradeFrom([
      check(
        "legacy-fanout",
        result.ok,
        result.ok
          ? "legacy.ping keeps colliding provider ids as separate sends"
          : `applicability driver failed: ${result.output.slice(0, 500)}`,
      ),
      check("note-untouched", noteUnchanged, noteUnchanged ? "notifications.md was not rewritten" : "silently rewrote the knowledge note"),
    ]);
  });
}

function namesBothProcessors(answer: string): boolean {
  return /\bstripe\b/i.test(answer) && /\badyen\b/i.test(answer);
}

function namesDisputeGap(answer: string): boolean {
  return /evidence gap|no deciding evidence|cannot choose|do not implement|processor (?:choice|conflict)|explicitly disputed|conflict/i.test(
    answer,
  );
}

function disputeChoiceUnresolved(answer: string): boolean {
  return /do not implement|cannot choose|without (?:picking|selecting|choosing)|until a human|leave (?:un)?decided|choice remains unresolved|did not (?:pick|choose|implement|select)/i.test(
    answer,
  );
}

function picksDisputeWinner(answer: string): boolean {
  const selects =
    /\b(?:use|using|pick|picked|choose|chose|chosen|go with|went with|recommend(?:ed)?|implement(?:ed)?(?: it)? (?:via|through))\s+(?:the\s+)?(?:stripe|adyen)\b/i.test(
      answer,
    ) || /\b(?:stripe|adyen)\s+(?:it is|wins|is (?:the )?(?:winner|choice|correct))\b/i.test(answer);
  return selects && !disputeChoiceUnresolved(answer);
}

function gradeKnowledgeDispute(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("knowledge-dispute requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("knowledge-dispute requires an overlay artifact");
  const fixture = fixtureDir(ctx, "knowledge-dispute");
  const originalRefunds = readFileSync(join(fixture, "repo/src/refunds.js"), "utf8");
  const originalStripe = readFileSync(join(fixture, ".methodrail/knowledge/stripe.md"), "utf8");
  const originalAdyen = readFileSync(join(fixture, ".methodrail/knowledge/adyen.md"), "utf8");
  return withWorktree(fixture, overlay, (root) => {
    const sourceUnchanged = filesUnchanged(root, "repo/src/refunds.js", originalRefunds);
    const notesUnchanged =
      filesUnchanged(root, ".methodrail/knowledge/stripe.md", originalStripe) &&
      filesUnchanged(root, ".methodrail/knowledge/adyen.md", originalAdyen);
    const both = namesBothProcessors(answer);
    const gap = namesDisputeGap(answer);
    const generic = /please decide|ask (?:the )?(?:user|human|me)\b/i.test(answer) && !both;
    const winner = picksDisputeWinner(answer);
    return gradeFrom([
      check("protected-files", sourceUnchanged, sourceUnchanged ? "refunds.js unchanged" : "refunds.js was modified"),
      check("notes-untouched", notesUnchanged, notesUnchanged ? "dispute notes were not rewritten" : "silently rewrote a knowledge note"),
      check(
        "both-alternatives",
        both && !generic,
        both ? "answer names Stripe and Adyen" : generic ? "generic deferral without naming both processors" : "answer did not name both processors",
      ),
      check("evidence-gap", gap && both, gap && both ? "answer names the evidence gap" : "answer did not name the undecided processor conflict"),
      check("no-winner", !winner, winner ? "answer selected a processor winner" : "answer did not select a winner"),
    ]);
  });
}

function gradeKnowledgeRetired(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const answer = loadAnswer(run, ctx.repoRoot);
  if (!answer.trim()) return incompleteGrade("knowledge-retired requires an answer artifact");
  const overlay = overlayDir(run, ctx.repoRoot);
  if (!overlay) return incompleteGrade("knowledge-retired requires an overlay artifact");
  const fixture = fixtureDir(ctx, "knowledge-retired");
  const originalMailNote = readFileSync(join(fixture, ".methodrail/knowledge/mail.md"), "utf8");
  const originalRetiredNote = readFileSync(join(fixture, ".methodrail/knowledge/send-v1.md"), "utf8");
  const originalProject = readFileSync(join(fixture, ".methodrail/PROJECT.md"), "utf8");
  return withWorktree(fixture, overlay, (root) => {
    const driver = `
      const mail = require("./repo/src/mail.js");
      const before = mail.queued().length;
      const result = mail.handlePasswordReset({ to: "ops@lanternmail.test" });
      if (!result || result.template !== "password-reset") {
        console.error("successor-api: password-reset must enqueue template password-reset");
        process.exit(1);
      }
      if (mail.queued().length !== before + 1) {
        console.error("successor-api: enqueueMail was not used");
        process.exit(1);
      }
      if (mail.v1Count() !== 0) {
        console.error("retired-api: sendMail v1 was called");
        process.exit(1);
      }
    `;
    const result = runNode(["--input-type=commonjs", "-e", driver], root);
    const notesUnchanged =
      filesUnchanged(root, ".methodrail/knowledge/mail.md", originalMailNote) &&
      filesUnchanged(root, ".methodrail/knowledge/send-v1.md", originalRetiredNote) &&
      filesUnchanged(root, ".methodrail/PROJECT.md", originalProject);
    return gradeFrom([
      check(
        "successor-api",
        result.ok,
        result.ok
          ? "password-reset uses enqueueMail with a template id"
          : `retirement driver failed: ${result.output.slice(0, 500)}`,
      ),
      check("notes-untouched", notesUnchanged, notesUnchanged ? "knowledge notes were not rewritten" : "silently rewrote a knowledge note"),
    ]);
  });
}

const GRADERS: Record<string, (run: EvalRun, ctx: EvalContext) => OutcomeGrade> = {
  "simple-change": gradeSimpleChange,
  "medium-feature": gradeMediumFeature,
  "runtime-bug": gradeRuntimeBug,
  "architecture-decision": gradeArchitectureDecision,
  "review-risk": gradeReviewRisk,
  "project-init": gradeProjectInit,
  "init-value": gradeInitValue,
  "knowledge-freshness": gradeKnowledgeFreshness,
  "knowledge-accumulation": gradeKnowledgeAccumulation,
  "partial-knowledge": gradePartialKnowledge,
  "human-decision": gradeHumanDecision,
  "knowledge-reuse": gradeKnowledgeReuse,
  "knowledge-refresh": gradeKnowledgeRefresh,
  "knowledge-applicability": gradeKnowledgeApplicability,
  "knowledge-dispute": gradeKnowledgeDispute,
  "knowledge-retired": gradeKnowledgeRetired,
  "artifact-interoperability": gradeArtifactInteroperability,
  "decision-ladder": gradeDecisionLadder,
  "knowledge-reconciliation-v0.9": gradeKnowledgeReconciliationV09,
  "architecture-deepening": gradeArchitectureDeepening,
};

export function gradeOutcome(run: EvalRun, ctx: EvalContext): OutcomeGrade {
  const grader = GRADERS[run.fixture_id];
  if (!grader) return incompleteGrade(`no fixture grader for ${run.fixture_id}`);
  return grader(run, ctx);
}

export function requiredArtifactPaths(run: EvalRun): string[] {
  const a = run.artifacts ?? {};
  const paths = [a.overlay, a.patch, a.command_log, a.answer, a.transcript, a.worktree];
  return paths.filter((path): path is string => typeof path === "string" && path.length > 0);
}

export { loadAnswer, loadCommandLog, overlayDir };
