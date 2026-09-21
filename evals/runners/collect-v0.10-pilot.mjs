#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const extract = join(root, "evals/runners/extract-overlay.mjs");
const ledgerCli = join(root, "evals/runners/ledger.ts");
const pilot = process.env.METHODRAIL_PILOT_DIR ?? "/tmp/methodrail-pilot-v010";
const freeze = existsSync(join(pilot, "METHODRAIL_HEAD"))
  ? readFileSync(join(pilot, "METHODRAIL_HEAD"), "utf8").trim()
  : "unknown";

const fixtures = (process.env.METHODRAIL_PILOT_FIXTURES ?? "simple-change").split(",").filter(Boolean);
const runs = [];
for (const fixture of fixtures) {
  for (const host of ["cursor", "codex"]) {
    const repeats = host === "cursor" ? [1] : [1];
    for (const repeat of repeats) {
      for (const condition of ["baseline", "methodrail"]) {
        runs.push({ fixture, host, repeat, condition });
      }
    }
  }
}

function findJsonl(dir, found = []) {
  if (!existsSync(dir)) return found;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) findJsonl(path, found);
    else if (name.endsWith(".jsonl")) found.push(path);
  }
  return found;
}

for (const spec of runs) {
  const dest = join(pilot, spec.fixture, `${spec.host}-r${spec.repeat}-${spec.condition}`);
  if (!existsSync(dest)) {
    console.log("skip missing", dest);
    continue;
  }
  const clean = `${dest}.clean`;
  const art = join(
    root,
    "evals/runners/artifacts",
    spec.fixture,
    `${spec.host}-r${spec.repeat}-${spec.condition}`,
  );
  mkdirSync(art, { recursive: true });
  const overlay = join(art, "overlay");
  if (existsSync(clean) && existsSync(dest)) {
    spawnSync("node", [extract, clean, dest, overlay], { stdio: "inherit" });
  } else {
    mkdirSync(overlay, { recursive: true });
    writeFileSync(
      join(overlay, ".methodrail-overlay.json"),
      `${JSON.stringify({ deletions: [], missing_worktree: true }, null, 2)}\n`,
    );
  }

  const examplePath = join(
    root,
    "evals/runners/examples",
    `${spec.fixture}.${spec.host}-r${spec.repeat}-${spec.condition}.json`,
  );
  const overlayRel = `evals/runners/artifacts/${spec.fixture}/${spec.host}-r${spec.repeat}-${spec.condition}/overlay`;
  const artRel = `evals/runners/artifacts/${spec.fixture}/${spec.host}-r${spec.repeat}-${spec.condition}`;

  if (spec.host === "cursor") {
    const ledgers = findJsonl(join(dest, ".ledger"));
    const ledgerPath = ledgers[0];
    if (!ledgerPath) {
      console.log("no ledger", dest);
      continue;
    }
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        ledgerCli,
        "to-run",
        ledgerPath,
        "--fixture",
        spec.fixture,
        "--condition",
        spec.condition,
        "--host",
        spec.host,
        "--repeat",
        String(spec.repeat),
        "--plugin-root",
        root,
        "--workspace-root",
        dest,
        "--out-json",
        examplePath,
        "--artifacts",
        artRel,
        "--overlay",
        overlayRel,
      ],
      { cwd: root, encoding: "utf8" },
    );
    if (result.status !== 0) {
      console.error(result.stderr || result.stdout);
      process.exitCode = 1;
      continue;
    }
    const example = JSON.parse(readFileSync(examplePath, "utf8"));
    example.notes = `Live v0.10 hook-captured Cursor run. Freeze HEAD ${freeze}. Worktree ${dest}. Extra copy; canonical example JSON was not replaced.`;
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`);
    console.log("recorded", examplePath, "capture", example.capture);
    continue;
  }

  const transcriptSrc = existsSync(join(dest, "TRANSCRIPT.jsonl"))
    ? join(dest, "TRANSCRIPT.jsonl")
    : existsSync(join(dest, "TRANSCRIPT.txt"))
      ? join(dest, "TRANSCRIPT.txt")
      : null;
  const answerPath = ["ANSWER.md", "answer.md", "CODEX_LAST_MESSAGE.md"]
    .map((name) => join(dest, name))
    .find((path) => existsSync(path));
  const answer = answerPath ? readFileSync(answerPath, "utf8") : "";
  writeFileSync(join(art, "answer.md"), answer.endsWith("\n") ? answer : `${answer}\n`);
  if (transcriptSrc) writeFileSync(join(art, "TRANSCRIPT.txt"), readFileSync(transcriptSrc));
  const example = {
    fixture_id: spec.fixture,
    condition: spec.condition,
    host: spec.host,
    repeat: spec.repeat,
    skills_invoked: [],
    references_loaded: [],
    tools_used: ["edit", "shell"],
    subagents_used: 0,
    verification_steps: [],
    evidence: [],
    outcome: answer.replace(/\s+/g, " ").trim().slice(0, 500),
    failure_modes: [],
    notes: `Live v0.10 Codex run. Freeze HEAD ${freeze}. Worktree ${dest}.`,
    provenance: "live",
    capture: transcriptSrc ? "runner_captured" : "operator_summary",
    artifacts: {
      overlay: overlayRel,
      command_log: `${artRel}/command.log.json`,
      answer: `${artRel}/answer.md`,
    },
  };
  if (transcriptSrc) example.artifacts.transcript = `${artRel}/TRANSCRIPT.txt`;
  writeFileSync(join(art, "command.log.json"), "[]\n");
  writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`);
  console.log("recorded", examplePath);
}
