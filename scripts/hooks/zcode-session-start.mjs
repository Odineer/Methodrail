import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const chunks = [];
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) chunks.push(chunk);

let event = "SessionStart";
try {
  const input = JSON.parse(chunks.join(""));
  if (typeof input.hook_event_name === "string" && input.hook_event_name !== "") {
    event = input.hook_event_name;
  }
} catch {
  // Fail open: still inject the invariant.
}

let additionalContext = "";
try {
  additionalContext = readFileSync(join(root, "adapters/zcode/AGENTS.md"), "utf8").trim();
} catch {
  additionalContext = "";
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext,
    },
  }),
);
