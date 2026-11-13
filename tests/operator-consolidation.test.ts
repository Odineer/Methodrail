import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { collectTranscriptPilot, resolvePilotDir } from "../evals/runners/collect-transcript-pilot.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function pilotDir(label: string): string {
  return mkdtempSync(join(tmpdir(), `methodrail-pilot-${label}-`));
}

function runSetup(battery: string, dir: string) {
  const result = spawnSync("bash", [join(root, "evals/runners/setup-pilot-battery.sh"), battery], {
    cwd: root,
    env: { ...process.env, METHODRAIL_PILOT_DIR: dir },
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}

test("transcript batteries keep their command, answer, and overlay differences", () => {
  assert.equal(
    resolvePilotDir("v0.7", { METHODRAIL_PILOT_DIR: "/tmp/methodrail-pilot-other" }),
    "/tmp/methodrail-pilot-20260825-v07",
  );
  assert.equal(
    resolvePilotDir("v0.8", { METHODRAIL_PILOT_DIR: "/tmp/methodrail-pilot-other" }),
    "/tmp/methodrail-pilot-other",
  );

  const transcript =
    '{"type":"item.completed","item":{"type":"command_execution","command":"npm test","exit_code":0}}\nnot-json\n';
  const v07 = pilotDir("v07");
  const reuse = join(v07, "knowledge-reuse/codex-r1-baseline");
  mkdirSync(reuse, { recursive: true });
  writeFileSync(join(reuse, "COMMANDS.json"), "[]");
  writeFileSync(join(reuse, "answer.md"), "no newline");
  writeFileSync(join(reuse, "CODEX_LAST_MESSAGE.md"), "from codex\n");
  writeFileSync(join(reuse, "TRANSCRIPT.jsonl"), transcript);
  const v07Out = mkdtempSync(join(tmpdir(), "methodrail-collect-v07-"));
  collectTranscriptPilot({ battery: "v0.7", pilotDir: v07, outputRoot: v07Out });
  assert.equal(
    readFileSync(join(v07Out, "evals/runners/artifacts/knowledge-reuse/codex-r1-baseline/answer.md"), "utf8"),
    "no newline\n",
  );
  assert.equal(
    readFileSync(join(v07Out, "evals/runners/artifacts/knowledge-reuse/codex-r1-baseline/command.log.json"), "utf8"),
    "[]\n",
  );
  assert.equal(
    existsSync(join(v07Out, "evals/runners/artifacts/knowledge-reuse/codex-r1-baseline/overlay/.methodrail-overlay.json")),
    false,
  );
  const v07Example = JSON.parse(
    readFileSync(join(v07Out, "evals/runners/examples/knowledge-reuse.codex-r1-baseline.json"), "utf8"),
  ) as { capture: string; notes: string };
  assert.equal(v07Example.capture, "runner_captured");
  assert.match(v07Example.notes, /Live v0\.7 pilot/);
  assert.doesNotMatch(v07Example.notes, /Freeze/);

  const v08 = pilotDir("v08");
  writeFileSync(join(v08, "METHODRAIL_HEAD"), "abc123\n");
  const slot = join(v08, "knowledge-applicability/cursor-r2-baseline");
  mkdirSync(slot, { recursive: true });
  writeFileSync(join(slot, "COMMANDS.json"), "[]");
  writeFileSync(join(slot, "CODEX_LAST_MESSAGE.md"), "from codex\n");
  writeFileSync(join(slot, "TRANSCRIPT.jsonl"), transcript);
  const v08Out = mkdtempSync(join(tmpdir(), "methodrail-collect-v08-"));
  collectTranscriptPilot({ battery: "v0.8", pilotDir: v08, outputRoot: v08Out });
  assert.equal(
    readFileSync(join(v08Out, "evals/runners/artifacts/knowledge-applicability/cursor-r2-baseline/answer.md"), "utf8"),
    "from codex\n",
  );
  assert.match(
    readFileSync(join(v08Out, "evals/runners/artifacts/knowledge-applicability/cursor-r2-baseline/command.log.json"), "utf8"),
    /npm test/,
  );
  assert.equal(
    existsSync(
      join(v08Out, "evals/runners/artifacts/knowledge-applicability/cursor-r1-baseline/overlay/.methodrail-overlay.json"),
    ),
    true,
  );
  const v09 = pilotDir("v09");
  writeFileSync(join(v09, "METHODRAIL_HEAD"), "abc123\n");
  const v09Out = mkdtempSync(join(tmpdir(), "methodrail-collect-v09-"));
  collectTranscriptPilot({ battery: "v0.9", pilotDir: v09, outputRoot: v09Out });
  const v09Example = JSON.parse(
    readFileSync(join(v09Out, "evals/runners/examples/decision-ladder.codex-r1-baseline.json"), "utf8"),
  ) as { notes: string };
  assert.match(v09Example.notes, /Freeze HEAD abc123/);
  assert.match(v09Example.notes, /--ignore-rules/);

  rmSync(v07, { recursive: true, force: true });
  rmSync(v08, { recursive: true, force: true });
  rmSync(v09, { recursive: true, force: true });
  rmSync(v07Out, { recursive: true, force: true });
  rmSync(v08Out, { recursive: true, force: true });
  rmSync(v09Out, { recursive: true, force: true });
});

test("pilot setup batteries keep their worktree contracts", () => {
  const refused = mkdtempSync(join(tmpdir(), "methodrail-not-pilot-"));
  writeFileSync(join(refused, "keep"), "stay");
  const refusal = spawnSync("bash", [join(root, "evals/runners/setup-pilot-battery.sh"), "v0.8"], {
    cwd: root,
    env: { ...process.env, METHODRAIL_PILOT_DIR: refused },
    encoding: "utf8",
  });
  assert.equal(refusal.status, 2);
  assert.equal(readFileSync(join(refused, "keep"), "utf8"), "stay");
  rmSync(refused, { recursive: true, force: true });

  const v07 = pilotDir("setup07");
  runSetup("v0.7", v07);
  assert.equal(existsSync(join(v07, "knowledge-reuse/cursor-r1-baseline/.methodrail/knowledge/notifications.md")), false);
  assert.equal(existsSync(join(v07, "knowledge-reuse/cursor-r1-methodrail/references/knowledge/reuse.md")), true);
  assert.equal(existsSync(join(v07, "knowledge-reuse/cursor-r1-methodrail/OPERATOR.md")), false);
  assert.equal(existsSync(join(v07, "knowledge-refresh/cursor-r1-baseline/.methodrail/knowledge/mail.md")), false);
  const mail = readFileSync(join(v07, "knowledge-refresh/cursor-r1-methodrail/.methodrail/knowledge/mail.md"), "utf8");
  assert.doesNotMatch(mail, /unversioned:prepare-fixture/);
  assert.match(mail, /[0-9a-f]{40}/);
  assert.equal(existsSync(join(v07, "PILOT_ROOT")), false);
  assert.equal(existsSync(join(v07, "knowledge-reuse/cursor-r1-baseline.clean/RUN.json")), true);

  const v08 = pilotDir("setup08");
  runSetup("v0.8", v08);
  assert.match(readFileSync(join(v08, "knowledge-dispute/cursor-r1-methodrail/OPERATOR.md"), "utf8"), /references\/knowledge\//);
  assert.match(readFileSync(join(v08, "knowledge-dispute/cursor-r1-baseline/OPERATOR.md"), "utf8"), /baseline coding agent/);
  assert.equal(existsSync(join(v08, "knowledge-dispute/cursor-r1-methodrail/rules/methodrail.mdc")), true);
  assert.equal(existsSync(join(v08, "knowledge-dispute/cursor-r1-baseline/rules/methodrail.mdc")), false);
  assert.equal(readFileSync(join(v08, "PILOT_ROOT"), "utf8").trim(), v08);
  assert.equal(existsSync(join(v08, "FREEZE.sha256")), false);

  const v09 = pilotDir("setup09");
  runSetup("v0.9", v09);
  const ladder = readFileSync(join(v09, "decision-ladder/codex-r1-methodrail/OPERATOR.md"), "utf8");
  assert.match(ladder, /qualifying hard-to-reverse store choice/);
  assert.equal(existsSync(join(v09, "decision-ladder/codex-r1-methodrail/skills/show-me-your-work/SKILL.md")), true);
  assert.match(
    readFileSync(join(v09, "knowledge-reconciliation-v0.9/cursor-r1-methodrail/OPERATOR.md"), "utf8"),
    /does not grant approval to rewrite typed knowledge notes/,
  );
  assert.equal(
    existsSync(join(v09, "architecture-deepening/cursor-r1-methodrail/skills/improve-codebase-architecture/SKILL.md")),
    true,
  );
  assert.doesNotMatch(
    readFileSync(join(v09, "architecture-deepening/cursor-r1-methodrail/OPERATOR.md"), "utf8"),
    /Unattended-operator note/,
  );
  assert.equal(existsSync(join(v09, "decision-ladder/codex-r1-baseline/skills/show-me-your-work/SKILL.md")), false);
  assert.equal(readFileSync(join(v09, "METHODRAIL_FREEZE_NOTE"), "utf8").trim(), "uncommitted-v0.9-working-tree");
  assert.match(readFileSync(join(v09, "FREEZE.sha256"), "utf8"), /grade-outcome\.ts/);

  const v10 = pilotDir("setup10");
  runSetup("v0.10", v10);
  assert.equal(existsSync(join(v10, "simple-change/cursor-r1-methodrail/LEDGER.env")), true);
  assert.match(readFileSync(join(v10, "simple-change/cursor-r1-baseline/LEDGER.env"), "utf8"), /METHODRAIL_LEDGER=1/);
  assert.equal(existsSync(join(v10, "simple-change/cursor-r1-methodrail/.ledger")), true);
  assert.equal(existsSync(join(v10, "simple-change/codex-r1-baseline")), false);
  assert.equal(existsSync(join(v10, "simple-change/cursor-r1-methodrail/rules/methodrail.mdc")), true);
  assert.match(readFileSync(join(v10, "simple-change/cursor-r1-methodrail/OPERATOR.md"), "utf8"), /LEDGER\.env/);

  for (const dir of [v07, v08, v09, v10]) rmSync(dir, { recursive: true, force: true });
});
