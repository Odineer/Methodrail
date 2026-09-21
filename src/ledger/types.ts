export interface LedgerBase {
  v: 1;
  ts: string;
  conversation_id: string;
  generation_id?: string;
  model?: string;
  workspace_root: string;
}

export type LedgerEvent =
  | (LedgerBase & {
      event: "session_start";
      session_id: string;
      composer_mode?: string;
      cursor_version?: string;
      plugin_root?: string;
      repo_head?: string;
    })
  | (LedgerBase & {
      event: "tool";
      tool_name: string;
      path?: string;
      command?: string;
      exit_code?: number | null;
      duration_ms?: number;
      output_tail?: string;
    })
  | (LedgerBase & {
      event: "tool_failure";
      tool_name: string;
      path?: string;
      command?: string;
      failure_type: string;
      error_message?: string;
    })
  | (LedgerBase & {
      event: "subagent_stop";
      subagent_type: string;
      status: string;
      duration_ms?: number;
      tool_call_count?: number;
    })
  | (LedgerBase & { event: "response"; text_path: string; sha256: string; chars: number })
  | (LedgerBase & { event: "stop"; status: string; loop_count?: number });

export const LEDGER_EVENTS = new Set([
  "session_start",
  "tool",
  "tool_failure",
  "subagent_stop",
  "response",
  "stop",
]);

export type ReadClass =
  | { kind: "skill"; name: string; origin: "plugin" | "project" }
  | { kind: "reference"; rel: string }
  | { kind: "harness"; rel: string }
  | { kind: "other" };
