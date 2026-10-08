import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { discoverProjectArtifacts } from "../src/artifacts.js";
import { inspectModelPolicyPlacement, planProjectModelRefresh } from "../src/model-policy.js";
import {
  MODEL_ROLES,
  bindingStatus,
  diversityReport,
  effectiveTier,
  escalateTier,
  initialTier,
  planModelRefresh,
  proposeDocumentedBinding,
  resolveSelection,
  reviewDue,
  serializeModelPolicy,
  spawnMerelyToChangeModel,
  validateModelPolicy,
  type ModelHostBinding,
  type ModelPolicy,
} from "../skills/refresh-model-routing/scripts/models-policy.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const templatePath = join(root, "templates/project/MODELS.yaml");
const script = join(root, "skills/refresh-model-routing/scripts/models-policy.mjs");

function template(): string {
  return readFileSync(templatePath, "utf8");
}

function policy(): ModelPolicy {
  const validated = validateModelPolicy(template());
  assert.equal(validated.ok, true);
  assert.ok(validated.policy);
  return validated.policy;
}

function withHost(base: ModelPolicy, name: string, host: ModelHostBinding): ModelPolicy {
  return { ...base, hosts: { ...base.hosts, [name]: host } };
}

function hostOf(proposal: ReturnType<typeof proposeDocumentedBinding>): ModelHostBinding {
  return {
    parent: proposal.parent,
    router_mode: proposal.router_mode ?? null,
    tiers: proposal.tiers,
    supported: proposal.supported,
    evidence: proposal.evidence,
  };
}

test("balanced template maps exploration and architecture to different tiers", () => {
  const validated = policy();
  assert.equal(validated.preference, "balanced");
  assert.equal(validated.freshness_days, 30);
  assert.deepEqual(Object.keys(validated.roles), [...MODEL_ROLES]);
  assert.equal(validated.roles["how explorer"]?.tier, "fast");
  assert.equal(validated.roles["architect runners"]?.tier, "deep");
  assert.equal(initialTier("bounded"), "fast");
  assert.equal(initialTier("normal"), "balanced");
  assert.equal(initialTier("architecture"), "deep");
  assert.equal(effectiveTier(validated, "how explorer"), "fast");
  assert.equal(effectiveTier(validated, "hillclimb"), "balanced");
  assert.equal(effectiveTier({ ...validated, preference: "cost" }, "hillclimb"), "fast");
  assert.equal(effectiveTier({ ...validated, preference: "cost" }, "architect runners"), "deep");
  assert.equal(effectiveTier({ ...validated, preference: "quality" }, "hillclimb"), "deep");
  assert.equal(effectiveTier({ ...validated, preference: "quality" }, "how explorer"), "fast");
  assert.equal(spawnMerelyToChangeModel(), false);
  assert.equal(escalateTier("balanced", "ordinary-test-failure").escalated, false);
  assert.equal(escalateTier("fast", "conflicting-evidence").tier, "balanced");
});

test("schema errors, foreign slugs, and secret keys fail closed", () => {
  const missing = template().replace("  perf-issue:\n    tier: balanced\n", "");
  assert.equal(validateModelPolicy(missing).ok, false);
  assert.equal(validateModelPolicy(template().replace("owner: methodrail", "owner: someone")).ok, false);
  assert.match(validateModelPolicy(`api_key: secret\n${template()}`).errors.join("\n"), /api_key/);
  const cursor = serializeModelPolicy(withHost(policy(), "cursor", hostOf(proposeDocumentedBinding("cursor"))));
  assert.equal(validateModelPolicy(cursor.replace('parent: "auto"', 'parent: "opusplan"')).ok, false);
  assert.equal(validateModelPolicy(cursor.replace('selection: "inherit"', 'selection: "haiku"')).ok, false);
  const claude = serializeModelPolicy(withHost(policy(), "claude", hostOf(proposeDocumentedBinding("claude"))));
  assert.equal(validateModelPolicy(claude.replace('selection: "haiku"', 'selection: "grok-4"')).ok, false);
  assert.equal(validateModelPolicy(cursor.replace('fallback: "omit"', 'fallback: "guessed-slug"')).ok, false);
});

test("refresh preserves pins and skips timestamp-only rewrites", () => {
  const current = serializeModelPolicy({
    ...withHost(policy(), "cursor", hostOf(proposeDocumentedBinding("cursor"))),
    pins: { "how explorer": "cursor-pin" },
  });
  const stamped = current.replace("observed_at: null", 'observed_at: "2026-10-05"');
  const stampPlan = planModelRefresh(current, stamped);
  assert.equal(stampPlan.write, false);
  assert.equal(stampPlan.next, current);

  const retargeted = current.replace('how explorer: "cursor-pin"', 'how explorer: "other-pin"');
  const pinPlan = planModelRefresh(current, retargeted);
  assert.equal(pinPlan.write, false);
  assert.equal(pinPlan.next, current);
  assert.match(pinPlan.conflicts.join("\n"), /how explorer/);

  const quality = current.replace('preference: "balanced"', 'preference: "quality"');
  assert.equal(planModelRefresh(current, quality).write, false);
  const preferencePlan = planModelRefresh(current, quality, { applyPreference: true });
  assert.equal(preferencePlan.write, true);
  assert.match(preferencePlan.next, /quality/);
  assert.match(preferencePlan.next, /cursor-pin/);
  const second = planModelRefresh(preferencePlan.next, preferencePlan.next);
  assert.equal(second.write, false);
  assert.equal(second.next, preferencePlan.next);
});

test("rejection falls back once and does not claim routing works", () => {
  const validated = withHost(policy(), "cursor", hostOf(proposeDocumentedBinding("cursor", "balanced")));
  const first = resolveSelection(validated, { role: "how explorer", host: "cursor", rejected: true, attempts: 0 });
  assert.equal(first.selection, "omit");
  assert.equal(first.retries, 1);
  assert.equal(first.stop, false);
  const second = resolveSelection(validated, {
    role: "how explorer",
    host: "cursor",
    rejected: true,
    attempts: 1,
  });
  assert.equal(second.stop, true);
  assert.equal(second.retries, 1);
  const billing = resolveSelection(validated, {
    role: "how explorer",
    host: "cursor",
    rejected: true,
    rejectionClass: "billing",
  });
  assert.equal(billing.retries, 0);
  assert.match(billing.reason, /not retried/);
  const status = bindingStatus(
    {
      ...validated,
      hosts: {
        cursor: {
          ...validated.hosts.cursor!,
          evidence: { ...validated.hosts.cursor!.evidence, availability: "observed" },
        },
      },
    },
    "cursor",
  );
  assert.equal(status.live, "not-run");
  assert.equal(status.routingWorks, false);
  assert.equal(status.availability, "observed");
  assert.equal(status.pickerAction, "manual-picker-action-required");
  assert.equal(reviewDue(validated, { ageDays: 1 }).due, false);
  assert.equal(reviewDue(validated, { ageDays: 30 }).due, true);
  assert.equal(reviewDue(validated, { rejected: true }).due, true);
});

test("documented proposals stay host-native and report missing diversity", () => {
  const cursor = proposeDocumentedBinding("cursor");
  const claude = proposeDocumentedBinding("claude");
  assert.equal(cursor.parent, "auto");
  assert.equal(cursor.writes_settings, false);
  assert.equal(cursor.picker_action, "manual-picker-action-required");
  assert.equal(JSON.stringify(cursor).includes("opusplan"), false);
  assert.equal(claude.parent, "opusplan");
  assert.equal(claude.writes_settings, false);
  assert.deepEqual(
    [claude.tiers.fast.selection, claude.tiers.balanced.selection, claude.tiers.deep.selection],
    ["haiku", "sonnet", "opus"],
  );
  assert.equal(JSON.stringify(claude).includes("grok-"), false);
  assert.equal(JSON.stringify(claude).includes("composer-"), false);
  const claudePolicy = withHost(policy(), "claude", hostOf(claude));
  assert.equal(resolveSelection(claudePolicy, { role: "how explorer", host: "claude" }).selection, "haiku");
  assert.equal(resolveSelection(claudePolicy, { role: "architect runners", host: "claude" }).selection, "opus");
  const cursorPolicy = withHost(policy(), "cursor", hostOf(cursor));
  assert.equal(resolveSelection(cursorPolicy, { role: "how explorer", host: "cursor" }).tier, "fast");
  assert.equal(resolveSelection(cursorPolicy, { role: "architect runners", host: "cursor" }).tier, "deep");
  assert.equal(resolveSelection(cursorPolicy, { role: "how explorer", host: "cursor" }).selection, "inherit");
  const limited = diversityReport(claudePolicy, "claude");
  assert.equal(limited.required, true);
  assert.equal(limited.met, false);
  assert.match(limited.limitation ?? "", /independent contexts/);
  const diverse = withHost(policy(), "cursor", {
    ...hostOf(cursor),
    supported: ["claude-opus-5", "gpt-5.6-sol"],
  });
  assert.equal(diversityReport(diverse, "cursor").met, true);
});

test("placement blocks a missing or broken harness and keeps linked policy untracked", () => {
  const empty = mkdtempSync(join(tmpdir(), "methodrail-model-empty-"));
  const broken = mkdtempSync(join(tmpdir(), "methodrail-model-broken-"));
  const linkedBase = mkdtempSync(join(tmpdir(), "methodrail-model-linked-"));
  try {
    const missing = inspectModelPolicyPlacement(empty);
    assert.equal(missing.status, "uninitialized");
    assert.equal(missing.writeAllowed, false);
    assert.equal(planProjectModelRefresh(empty, template(), template()).blocked, true);

    symlinkSync(join(broken, "missing-target"), join(broken, ".methodrail"));
    const unavailable = inspectModelPolicyPlacement(broken);
    assert.equal(unavailable.status, "unavailable");
    assert.equal(unavailable.writeAllowed, false);

    const repository = join(linkedBase, "app");
    const storage = join(linkedBase, "storage");
    mkdirSync(repository);
    execFileSync("git", ["init"], { cwd: repository });
    execFileSync("node", [join(root, "skills/methodrail-init/scripts/linked-harness.mjs"), "create", "--repo", repository, "--storage", storage], {
      stdio: "pipe",
    });
    writeFileSync(join(repository, ".methodrail", "MODELS.yaml"), template());
    const linked = inspectModelPolicyPlacement(repository);
    assert.equal(linked.status, "ready");
    assert.equal(linked.placement, "linked-external");
    const status = execFileSync("git", ["status", "--short"], { cwd: repository, encoding: "utf8" });
    assert.equal(status, "");
    assert.equal(existsSync(join(repository, ".cursor", "agents", "reviewer.md")), false);
  } finally {
    rmSync(empty, { recursive: true, force: true });
    rmSync(broken, { recursive: true, force: true });
    rmSync(linkedBase, { recursive: true, force: true });
  }
});

test("MODELS.yaml is model policy rather than typed knowledge or a plan", () => {
  const dir = mkdtempSync(join(tmpdir(), "methodrail-model-artifact-"));
  try {
    mkdirSync(join(dir, ".methodrail", "knowledge"), { recursive: true });
    mkdirSync(join(dir, "docs/plans"), { recursive: true });
    writeFileSync(join(dir, ".methodrail", "PROJECT.md"), "# Project\n\n[Readme](../README.md)\n");
    writeFileSync(join(dir, ".methodrail", "MODELS.yaml"), template());
    writeFileSync(join(dir, "docs/plans/roadmap.yaml"), "goal: ship\n");
    writeFileSync(join(dir, ".methodrail/knowledge/app.md"), "# App\n\nA note.\n");
    const report = discoverProjectArtifacts(dir);
    const roles = new Map(report.artifacts.map((item) => [item.path, item.role]));
    assert.equal(roles.get(".methodrail/MODELS.yaml"), "model-policy");
    assert.equal(roles.get("docs/plans/roadmap.yaml"), "plan");
    assert.equal(roles.get(".methodrail/knowledge/app.md"), "typed-knowledge");
    const preview = report.preview.find((item) => item.path === ".methodrail/MODELS.yaml");
    assert.equal(preview?.op, "adopt");
    assert.equal(preview?.methodrailOwned, true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("init composes refresh in discovery and the checker does not write", () => {
  const init = readFileSync(join(root, "skills/methodrail-init/SKILL.md"), "utf8");
  const refresh = readFileSync(join(root, "skills/refresh-model-routing/SKILL.md"), "utf8");
  const checker = readFileSync(script, "utf8");
  assert.match(init, /refresh-model-routing` in discovery mode/);
  assert.match(init, /does not write it/);
  assert.match(init, /do not create tracked native agent files or change global user model settings/);
  assert.match(refresh, /inspect-only request stops here/);
  assert.doesNotMatch(checker, /writeFileSync|appendFileSync/);
  const cli = execFileSync("node", [script, "validate", "--file", templatePath], { encoding: "utf8" });
  assert.match(cli, /"ok":true/);
});
