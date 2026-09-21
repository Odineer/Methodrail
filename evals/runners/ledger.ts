#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { parseLedger } from "../../src/ledger/parse.js";
import { formatSummary, summarizeLedgers } from "../../src/ledger/summarize.js";
import { ledgerToRun, type LedgerRunOptions } from "../../src/ledger/to-run.js";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function defaultLedgerRoot(): string {
  if (process.env.METHODRAIL_LEDGER_DIR) return resolve(process.env.METHODRAIL_LEDGER_DIR);
  const state = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(state, "methodrail", "sessions");
}

function listJsonl(root: string, current = root, out: string[] = []): string[] {
  if (!existsSync(current)) return out;
  for (const name of readdirSync(current)) {
    const path = join(current, name);
    if (statSync(path).isDirectory()) listJsonl(root, path, out);
    else if (name.endsWith(".jsonl")) out.push(path);
  }
  return out;
}

function toRun(argv: string[]): void {
  const { values, positionals } = parseArgs({
    args: argv,
    options: {
      fixture: { type: "string" },
      condition: { type: "string" },
      host: { type: "string" },
      repeat: { type: "string" },
      "plugin-root": { type: "string" },
      "workspace-root": { type: "string" },
      "out-json": { type: "string" },
      artifacts: { type: "string" },
      overlay: { type: "string" },
    },
    allowPositionals: true,
  });
  const ledgerPath = positionals[0];
  if (!ledgerPath) fail("Usage: npm run ledger -- to-run <ledger.jsonl> --fixture <id> --condition <baseline|methodrail> --host <host>");
  if (values.condition !== "baseline" && values.condition !== "methodrail") {
    fail("--condition must be baseline or methodrail");
  }
  if (!values.fixture || !values.host) fail("--fixture and --host are required");
  const fixtureId = values.fixture;
  const host = values.host;
  const condition = values.condition;
  const text = readFileSync(ledgerPath, "utf8");
  const { events } = parseLedger(text);
  const first = events[0];
  const workspaceRoot = values["workspace-root"] ?? first?.workspace_root;
  if (!workspaceRoot) fail("--workspace-root is required when the ledger has no events");
  const options: LedgerRunOptions = {
    fixtureId,
    condition,
    host,
    pluginRoot: values["plugin-root"] ?? null,
    workspaceRoot,
  };
  if (values.repeat) options.repeat = Number(values.repeat);
  const { run, commandLog, answer } = ledgerToRun(events, dirname(resolve(ledgerPath)), options);
  const artifactsRel = values.artifacts;
  const artifactsDir = artifactsRel ? resolve(artifactsRel) : undefined;
  if (artifactsDir && artifactsRel) {
    mkdirSync(artifactsDir, { recursive: true });
    writeFileSync(join(artifactsDir, "answer.md"), answer ?? "");
    writeFileSync(join(artifactsDir, "command.log.json"), `${JSON.stringify(commandLog, null, 2)}\n`);
    cpSync(resolve(ledgerPath), join(artifactsDir, "session.jsonl"));
    run.artifacts = {
      answer: join(artifactsRel, "answer.md"),
      command_log: join(artifactsRel, "command.log.json"),
      ledger: join(artifactsRel, "session.jsonl"),
    };
    if (values.overlay) run.artifacts.overlay = values.overlay;
  } else if (values.overlay) {
    run.artifacts = { overlay: values.overlay };
  }
  if (values["out-json"]) {
    mkdirSync(dirname(resolve(values["out-json"])), { recursive: true });
    writeFileSync(resolve(values["out-json"]), `${JSON.stringify(run, null, 2)}\n`);
    console.log(values["out-json"]);
  } else {
    console.log(JSON.stringify(run, null, 2));
  }
}

function summarize(argv: string[]): void {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { "plugin-root": { type: "string" } },
    allowPositionals: true,
  });
  const dir = resolve(positionals[0] ?? defaultLedgerRoot());
  const files = listJsonl(dir).map((path) => ({ path, text: readFileSync(path, "utf8") }));
  const summary = summarizeLedgers(files, values["plugin-root"] ?? process.cwd());
  console.log(formatSummary(summary));
}

function main(): void {
  const argv = process.argv.slice(2);
  const command = argv[0] === "to-run" || argv[0] === "summarize" ? argv[0] : "to-run";
  const rest = argv[0] === command ? argv.slice(1) : argv;
  if (command === "summarize") summarize(rest);
  else toRun(rest);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (error) {
    fail((error as Error).message);
  }
}
