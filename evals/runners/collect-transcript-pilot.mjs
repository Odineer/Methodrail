#!/usr/bin/env node
// v0.7–v0.9 transcript collectors. v0.10 ledger capture stays in collect-v0.10-pilot.mjs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const NOTES = {
  "v0.7": (dest) =>
    `Live v0.7 pilot 2026-08-25. Worktree ${dest}. Cursor runs used isolated Task subagents on /tmp copies. Codex used codex exec --ignore-user-config --skip-git-repo-check --sandbox workspace-write -m gpt-5.5. Extra copy; canonical example JSON was not replaced.`,
  "v0.8": (dest, freeze) =>
    `Live v0.8 knowledge-governance pilot 2026-08-31. Freeze ${freeze}. Worktree ${dest}. Cursor runs used isolated Task subagents on /tmp copies. Codex used codex exec --ignore-user-config --skip-git-repo-check --sandbox workspace-write -m gpt-5.5. Extra copy; canonical example JSON was not replaced.`,
  "v0.9": (dest, freeze) =>
    `Live v0.9 project-artifact-interoperability pilot 2026-09-01. Freeze HEAD ${freeze} (uncommitted v0.9 graders). Worktree ${dest}. Cursor runs used isolated Task subagents on /tmp copies. Codex used codex exec --ignore-user-config --skip-git-repo-check --sandbox workspace-write --ignore-rules -m gpt-5.5. Extra copy; canonical example JSON was not replaced.`,
};

export const TRANSCRIPT_BATTERIES = {
  "v0.7": {
    pilotDir: "/tmp/methodrail-pilot-20260825-v07",
    honorPilotEnv: false,
    fixtures: ["knowledge-reuse", "knowledge-refresh"],
    commands: "json",
    answerNames: ["ANSWER.md", "answer.md"],
    missingOverlay: false,
  },
  "v0.8": {
    pilotDir: "/tmp/methodrail-pilot-20260831-v08",
    honorPilotEnv: true,
    fixtures: ["knowledge-applicability", "knowledge-dispute", "knowledge-retired"],
    commands: "json-or-transcript",
    answerNames: ["ANSWER.md", "answer.md", "CODEX_LAST_MESSAGE.md"],
    missingOverlay: true,
  },
  "v0.9": {
    pilotDir: "/tmp/methodrail-pilot-20260901-v09",
    honorPilotEnv: true,
    fixtures: ["decision-ladder", "knowledge-reconciliation-v0.9", "architecture-deepening"],
    commands: "json-or-transcript",
    answerNames: ["ANSWER.md", "answer.md", "CODEX_LAST_MESSAGE.md"],
    missingOverlay: true,
  },
};

export function resolvePilotDir(battery, env = process.env) {
  const spec = TRANSCRIPT_BATTERIES[battery];
  if (!spec) throw new Error(`Unknown transcript battery: ${battery}`);
  if (spec.honorPilotEnv && env.METHODRAIL_PILOT_DIR != null) return env.METHODRAIL_PILOT_DIR;
  return spec.pilotDir;
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function mapCommands(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { command: item, exit_status: null };
      if (item && typeof item === "object" && typeof item.command === "string") {
        return {
          command: item.command,
          exit_status: typeof item.exit_status === "number" ? item.exit_status : null,
          phase: typeof item.phase === "string" ? item.phase : undefined,
        };
      }
      return null;
    })
    .filter(Boolean);
}

function commandsFromTranscript(dest) {
  const path = join(dest, "TRANSCRIPT.jsonl");
  if (!existsSync(path)) return [];
  const out = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      const item = event.item;
      if (item?.type === "command_execution" && event.type === "item.completed") {
        out.push({
          command: typeof item.command === "string" ? item.command : String(item.command ?? ""),
          exit_status: typeof item.exit_code === "number" ? item.exit_code : null,
        });
      }
    } catch {
      // keep going; a truncated line must not drop the rest of a launched run
    }
  }
  return out;
}

function commandsFrom(dest, mode) {
  if (mode === "json") return mapCommands(readJson(join(dest, "COMMANDS.json"), []));
  const raw = readJson(join(dest, "COMMANDS.json"), null);
  if (Array.isArray(raw) && raw.length > 0) return mapCommands(raw);
  return commandsFromTranscript(dest);
}

function answerFrom(dest, names) {
  for (const name of names) {
    const path = join(dest, name);
    if (existsSync(path)) return readFileSync(path, "utf8");
  }
  return "";
}

function runsFor(fixtures) {
  const runs = [];
  for (const fixture of fixtures) {
    for (const host of ["cursor", "codex"]) {
      const repeats = host === "cursor" ? [1, 2] : [1];
      for (const repeat of repeats) {
        for (const condition of ["baseline", "methodrail"]) {
          runs.push({ fixture, host, repeat, condition });
        }
      }
    }
  }
  return runs;
}

export function collectTranscriptPilot({ battery, pilotDir, outputRoot = repoRoot, extract }) {
  const spec = TRANSCRIPT_BATTERIES[battery];
  if (!spec) throw new Error(`Unknown transcript battery: ${battery}`);
  const pilot = pilotDir ?? resolvePilotDir(battery);
  const freeze = existsSync(join(pilot, "METHODRAIL_HEAD"))
    ? readFileSync(join(pilot, "METHODRAIL_HEAD"), "utf8").trim()
    : "unknown";
  const extractScript = extract ?? join(repoRoot, "evals/runners/extract-overlay.mjs");
  const recorded = [];
  for (const specRun of runsFor(spec.fixtures)) {
    const dest = join(pilot, specRun.fixture, `${specRun.host}-r${specRun.repeat}-${specRun.condition}`);
    const clean = `${dest}.clean`;
    const artRel = `${specRun.fixture}/${specRun.host}-r${specRun.repeat}-${specRun.condition}`;
    const art = join(outputRoot, "evals/runners/artifacts", artRel);
    mkdirSync(art, { recursive: true });
    const overlay = join(art, "overlay");
    if (existsSync(clean) && existsSync(dest)) {
      spawnSync("node", [extractScript, clean, dest, overlay], { stdio: "inherit" });
    } else if (spec.missingOverlay) {
      mkdirSync(overlay, { recursive: true });
      writeFileSync(
        join(overlay, ".methodrail-overlay.json"),
        `${JSON.stringify({ deletions: [], missing_worktree: true }, null, 2)}\n`,
      );
    }
    const answer = answerFrom(dest, spec.answerNames);
    writeFileSync(join(art, "answer.md"), answer.endsWith("\n") ? answer : `${answer}\n`);
    const commandLog = commandsFrom(dest, spec.commands);
    writeFileSync(join(art, "command.log.json"), `${JSON.stringify(commandLog, null, 2)}\n`);
    const transcriptSrc = existsSync(join(dest, "TRANSCRIPT.jsonl"))
      ? join(dest, "TRANSCRIPT.jsonl")
      : existsSync(join(dest, "TRANSCRIPT.txt"))
        ? join(dest, "TRANSCRIPT.txt")
        : null;
    if (transcriptSrc) writeFileSync(join(art, "TRANSCRIPT.txt"), readFileSync(transcriptSrc));
    const capture = specRun.host === "codex" && transcriptSrc ? "runner_captured" : "operator_summary";
    const example = {
      fixture_id: specRun.fixture,
      condition: specRun.condition,
      host: specRun.host,
      model: specRun.host === "codex" ? "gpt-5.5" : "grok-4.6",
      repeat: specRun.repeat,
      skills_invoked: [],
      references_loaded: [],
      tools_used: ["edit", "shell"],
      subagents_used: 0,
      verification_steps: commandLog,
      evidence: answer.split("\n").filter(Boolean).slice(0, 12),
      outcome: answer.replace(/\s+/g, " ").trim().slice(0, 500),
      failure_modes: [],
      notes: NOTES[battery](dest, freeze),
      provenance: "live",
      capture,
      artifacts: {
        overlay: `evals/runners/artifacts/${artRel}/overlay`,
        command_log: `evals/runners/artifacts/${artRel}/command.log.json`,
        answer: `evals/runners/artifacts/${artRel}/answer.md`,
      },
    };
    if (capture === "runner_captured") {
      example.artifacts.transcript = `evals/runners/artifacts/${artRel}/TRANSCRIPT.txt`;
    }
    const examplePath = join(
      outputRoot,
      "evals/runners/examples",
      `${specRun.fixture}.${specRun.host}-r${specRun.repeat}-${specRun.condition}.json`,
    );
    mkdirSync(dirname(examplePath), { recursive: true });
    writeFileSync(examplePath, `${JSON.stringify(example, null, 2)}\n`);
    recorded.push(examplePath);
  }
  return recorded;
}

function main() {
  const battery = process.argv[2];
  if (!TRANSCRIPT_BATTERIES[battery]) {
    console.error("usage: collect-transcript-pilot.mjs v0.7|v0.8|v0.9");
    process.exit(2);
  }
  const outputRoot = process.env.METHODRAIL_COLLECT_ROOT ?? repoRoot;
  for (const examplePath of collectTranscriptPilot({
    battery,
    pilotDir: resolvePilotDir(battery),
    outputRoot,
  })) {
    console.log("recorded", examplePath);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
