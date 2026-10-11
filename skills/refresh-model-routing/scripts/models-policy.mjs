import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export class ModelPolicyError extends Error {}

export const MODEL_ROLES = [
  "arena runners",
  "arena cross-judge",
  "architect runners",
  "how explorer",
  "how explainer",
  "why investigators",
  "why synthesizer",
  "interrogate reviewers",
  "reflect judgment",
  "reflect divergent",
  "reflect tooling",
  "reflect synthesizer",
  "swarm workers",
  "hillclimb",
  "perf-issue",
];

const TIERS = ["fast", "balanced", "deep"];
const PREFERENCES = ["cost", "balanced", "quality"];
const AVAILABILITY = ["observed", "documented-only", "unknown"];
const TOP_LEVEL = ["schema_version", "owner", "preference", "freshness_days", "roles", "pins", "hosts"];
const ROLE_FIELDS = ["tier", "diversity", "capabilities"];
const SECRET_KEY = /(api[_-]?key|access[_-]?token|password|secret|account[_-]?(id|identifier))/i;
const CLAUDE_ALIAS = /^(haiku|sonnet|opus|opusplan|fable|best)$/i;
const CURSOR_SLUG = /^(grok-|composer-|gpt-)/i;
const PARENT_ONLY = new Set(["auto", "balance", "opusplan", "default"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stripComment(line) {
  let inSingle = false;
  let inDouble = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const prev = index > 0 ? line[index - 1] : "";
    if (char === "'" && !inDouble) inSingle = !inSingle;
    else if (char === '"' && !inSingle && prev !== "\\") inDouble = !inDouble;
    else if (char === "#" && !inSingle && !inDouble) return line.slice(0, index).trimEnd();
  }
  return line;
}

function parseScalar(raw) {
  const text = raw.trim();
  if (text === "" || text === "null" || text === "~") return null;
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "{}") return {};
  if (text === "[]") return [];
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) return JSON.parse(text);
  if (text.length >= 2 && text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replaceAll("''", "'");
  if (/^-?(?:0|[1-9]\d*)$/.test(text)) return Number(text);
  if (/^-?(?:0|[1-9]\d*)\.\d+$/.test(text)) return Number(text);
  return text;
}

function parseSequence(rows, index, indent) {
  const value = [];
  while (index < rows.length) {
    const row = rows[index];
    if (row.indent < indent) break;
    if (row.indent > indent) throw new Error(`Invalid YAML indent at line ${row.line}`);
    if (!row.text.startsWith("- ")) throw new Error(`Expected a sequence item at line ${row.line}`);
    const rest = row.text.slice(2).trim();
    index += 1;
    if (rest === "") {
      if (index < rows.length && rows[index].indent > indent) {
        const nested = parseNode(rows, index, rows[index].indent);
        value.push(nested.value);
        index = nested.index;
      } else value.push(null);
    } else if (rest.startsWith("{") || rest.startsWith("[")) {
      throw new Error(`YAML flow collections are not supported at line ${row.line}`);
    } else value.push(parseScalar(rest));
  }
  return { value, index };
}

function parseMapping(rows, index, indent) {
  const value = {};
  while (index < rows.length) {
    const row = rows[index];
    if (row.indent < indent) break;
    if (row.indent > indent) throw new Error(`Invalid YAML indent at line ${row.line}`);
    if (row.text.startsWith("- ")) throw new Error(`Expected a mapping at line ${row.line}`);
    const match = /^(.+?):\s*(.*)$/.exec(row.text);
    if (!match) throw new Error(`Invalid YAML mapping at line ${row.line}`);
    const key = parseScalar(match[1]);
    if (typeof key !== "string" || key.length === 0) throw new Error(`Invalid YAML key at line ${row.line}`);
    if (Object.hasOwn(value, key)) throw new Error(`Duplicate YAML key '${key}' at line ${row.line}`);
    const rest = match[2];
    index += 1;
    if (rest === "") {
      if (index < rows.length && rows[index].indent > indent) {
        const nested = parseNode(rows, index, rows[index].indent);
        value[key] = nested.value;
        index = nested.index;
      } else value[key] = null;
    } else if (rest === "{}" || rest === "[]") value[key] = parseScalar(rest);
    else if (rest.startsWith("{") || rest.startsWith("[")) {
      throw new Error(`YAML flow collections are not supported at line ${row.line}`);
    } else value[key] = parseScalar(rest);
  }
  return { value, index };
}

function parseNode(rows, index, indent) {
  if (index >= rows.length) return { value: null, index };
  if (rows[index].text.startsWith("- ")) return parseSequence(rows, index, rows[index].indent);
  return parseMapping(rows, index, indent);
}

export function parseModelPolicyYaml(source) {
  const rows = [];
  for (const [offset, line] of source.split(/\r?\n/).entries()) {
    if (line.includes("\t")) throw new ModelPolicyError("YAML tabs are not allowed");
    const text = stripComment(line);
    if (text.trim() === "") continue;
    const indent = text.match(/^ */)[0].length;
    rows.push({ line: offset + 1, indent, text: text.trim() });
  }
  if (rows.length === 0) throw new ModelPolicyError("MODELS.yaml is empty");
  if (rows[0].indent !== 0) throw new ModelPolicyError("MODELS.yaml must start at the document root");
  try {
    const parsed = parseNode(rows, 0, 0);
    if (parsed.index !== rows.length) throw new Error("Unexpected YAML content");
    if (!isRecord(parsed.value)) throw new Error("MODELS.yaml must be a mapping");
    return parsed.value;
  } catch (error) {
    if (error instanceof ModelPolicyError) throw error;
    throw new ModelPolicyError(error instanceof Error ? error.message : String(error));
  }
}

function pushSecret(errors, key, where) {
  if (SECRET_KEY.test(key)) errors.push(`${where} must not store ${key}`);
}

function walkSecrets(value, where, errors) {
  if (!isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    pushSecret(errors, key, where);
    walkSecrets(child, `${where}.${key}`, errors);
  }
}

function yamlString(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(String(value));
}

function selectionControl(value) {
  return value === "inherit" || value === "omit";
}

function checkSelection(errors, hostName, value, where) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${where} requires a selection`);
    return;
  }
  if (PARENT_ONLY.has(value)) errors.push(`${where} cannot use parent strategy '${value}'`);
  if (hostName === "claude" && CURSOR_SLUG.test(value)) errors.push(`${where} uses a Cursor slug on Claude`);
  if (hostName === "cursor" && CLAUDE_ALIAS.test(value)) errors.push(`${where} uses a Claude alias on Cursor`);
}

function fallbackAllowed(host, fallback) {
  if (fallback === "inherit" || fallback === "omit") return true;
  return TIERS.some((tier) => host.tiers[tier]?.selection === fallback);
}

function normalizeHost(name, raw, errors) {
  if (!isRecord(raw)) {
    errors.push(`hosts.${name} must be a mapping`);
    return null;
  }
  for (const key of Object.keys(raw)) {
    if (!["parent", "router_mode", "tiers", "supported", "evidence", "writes_settings"].includes(key)) {
      errors.push(`hosts.${name}.${key} is not a model-policy field`);
    }
  }
  if (raw.writes_settings === true) errors.push(`hosts.${name} must not record a settings write`);
  const parent = raw.parent;
  if (name === "cursor" && parent !== "auto") errors.push("Cursor parent strategy must be auto");
  if (name === "claude" && !["opusplan", "haiku", "sonnet", "opus", "fable", "default"].includes(parent)) {
    errors.push(`Claude parent strategy '${String(parent)}' is not a Claude control`);
  }
  if (name !== "cursor" && name !== "claude" && parent !== "default") {
    errors.push(`${name} parent strategy must be default when no host control is documented`);
  }
  if (raw.router_mode !== undefined && raw.router_mode !== null) {
    if (name !== "cursor") errors.push("router_mode is a Cursor Auto picker mode");
    if (!["cost", "balance", "intelligence"].includes(raw.router_mode)) {
      errors.push(`hosts.${name}.router_mode must be cost, balance, or intelligence`);
    }
  }
  if (!isRecord(raw.tiers)) errors.push(`hosts.${name}.tiers must be a mapping`);
  const tiers = {};
  for (const tier of TIERS) {
    const spec = isRecord(raw.tiers) ? raw.tiers[tier] : undefined;
    if (!isRecord(spec)) {
      errors.push(`hosts.${name}.tiers.${tier} must be a mapping`);
      continue;
    }
    checkSelection(errors, name, spec.selection, `hosts.${name}.tiers.${tier}.selection`);
    checkSelection(errors, name, spec.fallback, `hosts.${name}.tiers.${tier}.fallback`);
    if (spec.effort !== null && spec.effort !== undefined && typeof spec.effort !== "string") {
      errors.push(`hosts.${name}.tiers.${tier}.effort must be a string or null`);
    }
    tiers[tier] = {
      selection: spec.selection,
      fallback: spec.fallback,
      effort: spec.effort ?? null,
    };
  }
  const hostSoFar = { tiers };
  for (const tier of TIERS) {
    const fallback = tiers[tier]?.fallback;
    if (typeof fallback === "string" && !selectionControl(fallback) && !fallbackAllowed(hostSoFar, fallback)) {
      errors.push(`hosts.${name}.tiers.${tier}.fallback is not a prevalidated selection`);
    }
  }
  const supported = [];
  if (raw.supported !== undefined) {
    if (!Array.isArray(raw.supported) || raw.supported.some((item) => typeof item !== "string" || item.trim() === "")) {
      errors.push(`hosts.${name}.supported must be a list of model ids`);
    } else {
      for (const item of raw.supported) {
        checkSelection(errors, name, item, `hosts.${name}.supported`);
        supported.push(item);
      }
    }
  }
  if (!isRecord(raw.evidence)) {
    errors.push(`hosts.${name}.evidence must be a mapping`);
    return null;
  }
  const evidence = raw.evidence;
  for (const key of Object.keys(evidence)) {
    if (!["host_version", "provider", "source", "observed_at", "availability", "rationale"].includes(key)) {
      errors.push(`hosts.${name}.evidence.${key} is not an evidence field`);
    }
  }
  if (typeof evidence.source !== "string" || evidence.source.trim() === "") {
    errors.push(`hosts.${name}.evidence.source is required`);
  }
  if (typeof evidence.rationale !== "string" || evidence.rationale.trim() === "") {
    errors.push(`hosts.${name}.evidence.rationale is required`);
  }
  if (!AVAILABILITY.includes(evidence.availability)) {
    errors.push(`hosts.${name}.evidence.availability must be observed, documented-only, or unknown`);
  }
  return {
    parent,
    router_mode: raw.router_mode ?? null,
    tiers,
    supported,
    evidence: {
      host_version: evidence.host_version ?? null,
      provider: evidence.provider ?? null,
      source: evidence.source,
      observed_at: evidence.observed_at ?? null,
      availability: evidence.availability,
      rationale: evidence.rationale,
    },
  };
}

export function validateModelPolicy(source) {
  let raw;
  try {
    raw = parseModelPolicyYaml(source);
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : String(error)], policy: null };
  }
  const errors = [];
  walkSecrets(raw, "MODELS.yaml", errors);
  for (const key of Object.keys(raw)) {
    if (!TOP_LEVEL.includes(key)) errors.push(`${key} is not a model-policy field`);
  }
  if (raw.schema_version !== 1) errors.push("schema_version must be 1");
  if (raw.owner !== "methodrail") errors.push("owner must be methodrail");
  if (!PREFERENCES.includes(raw.preference)) errors.push("preference must be cost, balanced, or quality");
  if (typeof raw.freshness_days !== "number" || !Number.isInteger(raw.freshness_days) || raw.freshness_days < 1) {
    errors.push("freshness_days must be a positive integer");
  }
  if (!isRecord(raw.roles)) errors.push("roles must be a mapping");
  const roles = {};
  if (isRecord(raw.roles)) {
    for (const key of Object.keys(raw.roles)) {
      if (!MODEL_ROLES.includes(key)) errors.push(`unknown role '${key}'`);
    }
    for (const role of MODEL_ROLES) {
      const spec = raw.roles[role];
      if (!isRecord(spec)) {
        errors.push(`role '${role}' is missing`);
        continue;
      }
      for (const key of Object.keys(spec)) {
        if (!ROLE_FIELDS.includes(key)) errors.push(`role '${role}' field '${key}' is not allowed`);
      }
      if (!TIERS.includes(spec.tier)) errors.push(`role '${role}' tier must be fast, balanced, or deep`);
      if (spec.diversity !== undefined && spec.diversity !== "families") {
        errors.push(`role '${role}' diversity must be families when set`);
      }
      if (spec.capabilities !== undefined && (!Array.isArray(spec.capabilities) || spec.capabilities.some((item) => typeof item !== "string"))) {
        errors.push(`role '${role}' capabilities must be a list of strings`);
      }
      const next = { tier: spec.tier };
      if (spec.diversity) next.diversity = spec.diversity;
      if (Array.isArray(spec.capabilities) && spec.capabilities.length > 0) next.capabilities = [...spec.capabilities];
      roles[role] = next;
    }
  }
  const pins = {};
  if (raw.pins === undefined || raw.pins === null) {
    // Absent pins mean none.
  } else if (!isRecord(raw.pins)) errors.push("pins must be a mapping");
  else {
    for (const [role, pin] of Object.entries(raw.pins)) {
      if (!MODEL_ROLES.includes(role)) errors.push(`pin names unknown role '${role}'`);
      if (typeof pin !== "string" || pin.trim() === "") errors.push(`pin for '${role}' must be a model id`);
      else pins[role] = pin;
    }
  }
  const hosts = {};
  if (raw.hosts === undefined || raw.hosts === null) {
    // Absent hosts mean no bindings yet.
  } else if (!isRecord(raw.hosts)) errors.push("hosts must be a mapping");
  else {
    for (const [name, spec] of Object.entries(raw.hosts)) {
      const host = normalizeHost(name, spec, errors);
      if (host) hosts[name] = host;
    }
  }
  if (errors.length > 0) return { ok: false, errors, policy: null };
  return {
    ok: true,
    errors: [],
    policy: {
      schema_version: 1,
      owner: "methodrail",
      preference: raw.preference,
      freshness_days: raw.freshness_days,
      roles,
      pins,
      hosts,
    },
  };
}

function canonical(policy) {
  return {
    schema_version: policy.schema_version,
    owner: policy.owner,
    preference: policy.preference,
    freshness_days: policy.freshness_days,
    roles: policy.roles,
    pins: policy.pins,
    hosts: Object.fromEntries(
      Object.keys(policy.hosts)
        .sort()
        .map((name) => {
          const host = policy.hosts[name];
          return [
            name,
            {
              parent: host.parent,
              router_mode: host.router_mode ?? null,
              tiers: host.tiers,
              supported: [...host.supported].sort(),
              evidence: {
                host_version: host.evidence.host_version ?? null,
                provider: host.evidence.provider ?? null,
                source: host.evidence.source,
                availability: host.evidence.availability,
                rationale: host.evidence.rationale,
              },
            },
          ];
        }),
    ),
  };
}

export function serializeModelPolicy(policy) {
  const lines = [
    `schema_version: ${policy.schema_version}`,
    `owner: ${yamlString(policy.owner)}`,
    `preference: ${yamlString(policy.preference)}`,
    `freshness_days: ${policy.freshness_days}`,
    "roles:",
  ];
  for (const role of MODEL_ROLES) {
    const spec = policy.roles[role];
    lines.push(`  ${role}:`);
    lines.push(`    tier: ${yamlString(spec.tier)}`);
    if (spec.diversity) lines.push(`    diversity: ${yamlString(spec.diversity)}`);
    if (spec.capabilities?.length) {
      lines.push("    capabilities:");
      for (const item of spec.capabilities) lines.push(`      - ${yamlString(item)}`);
    }
  }
  const pinRoles = MODEL_ROLES.filter((role) => policy.pins[role]);
  if (pinRoles.length === 0) lines.push("pins: {}");
  else {
    lines.push("pins:");
    for (const role of pinRoles) lines.push(`  ${role}: ${yamlString(policy.pins[role])}`);
  }
  const hostNames = Object.keys(policy.hosts).sort();
  if (hostNames.length === 0) lines.push("hosts: {}");
  else {
    lines.push("hosts:");
    for (const name of hostNames) {
      const host = policy.hosts[name];
      lines.push(`  ${name}:`);
      lines.push(`    parent: ${yamlString(host.parent)}`);
      if (host.router_mode) lines.push(`    router_mode: ${yamlString(host.router_mode)}`);
      lines.push("    tiers:");
      for (const tier of TIERS) {
        const spec = host.tiers[tier];
        lines.push(`      ${tier}:`);
        lines.push(`        selection: ${yamlString(spec.selection)}`);
        lines.push(`        fallback: ${yamlString(spec.fallback)}`);
        lines.push(`        effort: ${yamlString(spec.effort)}`);
      }
      if (host.supported.length > 0) {
        lines.push("    supported:");
        for (const item of [...host.supported].sort()) lines.push(`      - ${yamlString(item)}`);
      }
      lines.push("    evidence:");
      lines.push(`      host_version: ${yamlString(host.evidence.host_version)}`);
      lines.push(`      provider: ${yamlString(host.evidence.provider)}`);
      lines.push(`      source: ${yamlString(host.evidence.source)}`);
      lines.push(`      observed_at: ${yamlString(host.evidence.observed_at)}`);
      lines.push(`      availability: ${yamlString(host.evidence.availability)}`);
      lines.push(`      rationale: ${yamlString(host.evidence.rationale)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export function planModelRefresh(currentSource, proposedSource, options = {}) {
  const current = validateModelPolicy(currentSource);
  if (!current.ok) {
    return { write: false, next: currentSource, conflicts: current.errors, preservedPins: [], blocked: true };
  }
  const proposed = validateModelPolicy(proposedSource);
  if (!proposed.ok) {
    return {
      write: false,
      next: currentSource,
      conflicts: proposed.errors,
      preservedPins: Object.keys(current.policy.pins),
      blocked: true,
    };
  }
  const conflicts = [];
  for (const [role, pin] of Object.entries(current.policy.pins)) {
    if (proposed.policy.pins[role] !== pin) conflicts.push(`preserved pin for ${role}`);
  }
  const merged = {
    ...proposed.policy,
    preference: options.applyPreference === true ? proposed.policy.preference : current.policy.preference,
    pins: { ...current.policy.pins },
  };
  if (JSON.stringify(canonical(current.policy)) === JSON.stringify(canonical(merged))) {
    return { write: false, next: currentSource, conflicts, preservedPins: Object.keys(current.policy.pins), blocked: false };
  }
  const next = serializeModelPolicy(merged);
  return { write: true, next, conflicts, preservedPins: Object.keys(current.policy.pins), blocked: false };
}

export function effectiveTier(policy, role) {
  const base = policy.roles[role]?.tier;
  if (!base) throw new ModelPolicyError(`unknown role '${role}'`);
  if (policy.preference === "cost" && base === "balanced") return "fast";
  if (policy.preference === "quality" && base === "balanced") return "deep";
  return base;
}

export function initialTier(work) {
  if (work === "bounded") return "fast";
  if (work === "normal") return "balanced";
  if (work === "architecture" || work === "critique") return "deep";
  throw new ModelPolicyError(`unknown work class '${work}'`);
}

export function escalateTier(tier, signal) {
  if (signal === "ordinary-test-failure") {
    return { tier, escalated: false, reason: "an ordinary test failure stays on the current tier" };
  }
  if (signal === "conflicting-evidence" && tier === "fast") {
    return { tier: "balanced", escalated: true, reason: "conflicting evidence" };
  }
  if (["unknown-root-cause", "wider-scope", "unclear-invariants"].includes(signal) && tier === "balanced") {
    return { tier: "deep", escalated: true, reason: signal };
  }
  if (signal === "unmet-capability") {
    return { tier, escalated: false, reason: "report the capability gap instead of guessing another model" };
  }
  return { tier, escalated: false, reason: "no escalation" };
}

export function spawnMerelyToChangeModel() {
  return false;
}

export function modelFamily(selection) {
  if (selectionControl(selection) || PARENT_ONLY.has(selection)) return null;
  if (CLAUDE_ALIAS.test(selection) || /^claude-/i.test(selection)) return "anthropic";
  if (/^gpt-/i.test(selection)) return "openai";
  if (/^grok-/i.test(selection)) return "xai";
  if (/^composer-/i.test(selection)) return "cursor";
  return "other";
}

export function resolveSelection(policy, input) {
  const role = input.role;
  const tier = effectiveTier(policy, role);
  const pin = policy.pins[role];
  const binding = policy.hosts[input.host];
  const tierBinding = binding?.tiers?.[tier];
  const configured = pin || tierBinding?.selection || "omit";
  const rejection = input.rejectionClass;
  if (rejection === "billing" || rejection === "auth") {
    return {
      tier,
      selection: "omit",
      retries: 0,
      substituted: true,
      stop: true,
      reason: "billing or authentication errors are not retried",
    };
  }
  if (!input.rejected) {
    return { tier, selection: configured, retries: 0, substituted: false, stop: false, reason: pin ? "pinned id" : "tier binding" };
  }
  const attempts = input.attempts ?? 0;
  if (attempts >= 1) {
    return { tier, selection: "omit", retries: 1, substituted: true, stop: true, reason: "retry at most once" };
  }
  const fallback = tierBinding?.fallback || "omit";
  return {
    tier,
    selection: fallback,
    retries: 1,
    substituted: true,
    stop: false,
    reason: "prevalidated fallback",
  };
}

export function diversityReport(policy, host) {
  const binding = policy.hosts[host];
  const families = [...new Set((binding?.supported ?? []).map((item) => modelFamily(item)).filter(Boolean))];
  const required = MODEL_ROLES.some((role) => policy.roles[role].diversity === "families");
  if (!required) return { required: false, met: true, families, limitation: null };
  if (families.length >= 2) return { required: true, met: true, families, limitation: null };
  return {
    required: true,
    met: false,
    families,
    limitation: "This host does not show two model families. Use independent contexts and state that diversity is unavailable.",
  };
}

export function bindingStatus(policy, host) {
  const binding = policy.hosts[host];
  const availability = binding?.evidence?.availability ?? "unknown";
  let pickerAction = null;
  if (host === "cursor") pickerAction = "manual-picker-action-required";
  else if (host === "claude") pickerAction = "manual-session-action-required";
  return {
    configured: Boolean(binding),
    live: "not-run",
    availability,
    routingWorks: false,
    pickerAction,
  };
}

export function reviewDue(policy, input = {}) {
  if (input.hostChanged || input.rejected) return { due: true, reason: "host change or rejected selection" };
  const age = input.ageDays ?? 0;
  if (age >= policy.freshness_days) return { due: true, reason: "review threshold reached" };
  return { due: false, reason: "within the review threshold" };
}

function tierBinding(selection, fallback) {
  return { selection, fallback, effort: null };
}

export function proposeDocumentedBinding(host, preference = "balanced") {
  if (host === "cursor") {
    const routerMode = preference === "cost" ? "cost" : preference === "quality" ? "intelligence" : "balance";
    return {
      parent: "auto",
      router_mode: routerMode,
      writes_settings: false,
      picker_action: "manual-picker-action-required",
      tiers: {
        fast: tierBinding("inherit", "omit"),
        balanced: tierBinding("inherit", "omit"),
        deep: tierBinding("inherit", "omit"),
      },
      supported: [],
      evidence: {
        host_version: null,
        provider: null,
        source: "https://cursor.com/docs/cursor-router",
        observed_at: null,
        availability: "documented-only",
        rationale: `Native parent strategy is Auto. Router mode ${routerMode} is a model-picker choice on Teams or Enterprise and is not set by a project rule. Subagent tiers inherit until account access is observed.`,
      },
    };
  }
  if (host === "claude") {
    const parent = preference === "cost" ? "sonnet" : preference === "quality" ? "opus" : "opusplan";
    return {
      parent,
      writes_settings: false,
      picker_action: "manual-session-action-required",
      tiers: {
        fast: tierBinding("haiku", "inherit"),
        balanced: tierBinding("sonnet", "inherit"),
        deep: tierBinding("opus", "inherit"),
      },
      supported: ["haiku", "sonnet", "opus"],
      evidence: {
        host_version: null,
        provider: null,
        source: "https://code.claude.com/docs/en/model-config",
        observed_at: null,
        availability: "documented-only",
        rationale:
          "Claude aliases are provisional guidance. opusplan is a plan/execute split, not per-task routing. Existing explicit choices and managed settings win. Access is unverified.",
      },
    };
  }
  return {
    parent: "default",
    writes_settings: false,
    picker_action: null,
    tiers: {
      fast: tierBinding("omit", "omit"),
      balanced: tierBinding("omit", "omit"),
      deep: tierBinding("omit", "omit"),
    },
    supported: [],
    evidence: {
      host_version: null,
      provider: null,
      source: "host-default",
      observed_at: null,
      availability: "unknown",
      rationale: "No documented per-task model control for this host. Keep the native default.",
    },
  };
}

function readFlag(flag) {
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith("--")) throw new ModelPolicyError(`${flag} requires a value`);
  return value;
}

function main() {
  const command = process.argv[2];
  if (command === "validate") {
    const result = validateModelPolicy(readFileSync(readFlag("--file"), "utf8"));
    process.stdout.write(`${JSON.stringify({ ok: result.ok, errors: result.errors })}\n`);
    process.exitCode = result.ok ? 0 : 1;
    return;
  }
  if (command === "propose") {
    process.stdout.write(`${JSON.stringify(proposeDocumentedBinding(readFlag("--host"), process.argv.includes("--preference") ? readFlag("--preference") : "balanced"))}\n`);
    return;
  }
  if (command === "resolve") {
    const validated = validateModelPolicy(readFileSync(readFlag("--file"), "utf8"));
    if (!validated.ok || !validated.policy) {
      process.stdout.write(`${JSON.stringify(validated)}\n`);
      process.exitCode = 1;
      return;
    }
    const resolved = resolveSelection(validated.policy, {
      role: readFlag("--role"),
      host: readFlag("--host"),
      rejected: process.argv.includes("--rejected"),
      attempts: process.argv.includes("--attempts") ? Number(readFlag("--attempts")) : 0,
      rejectionClass: process.argv.includes("--rejection") ? readFlag("--rejection") : undefined,
    });
    process.stdout.write(`${JSON.stringify({ ...resolved, status: bindingStatus(validated.policy, readFlag("--host")) })}\n`);
    return;
  }
  if (command === "plan") {
    const plan = planModelRefresh(readFileSync(readFlag("--current"), "utf8"), readFileSync(readFlag("--proposed"), "utf8"), {
      applyPreference: process.argv.includes("--apply-preference"),
    });
    process.stdout.write(`${JSON.stringify({ write: plan.write, conflicts: plan.conflicts, preservedPins: plan.preservedPins, blocked: plan.blocked })}\n`);
    process.exitCode = plan.blocked ? 1 : 0;
    return;
  }
  throw new ModelPolicyError("usage: models-policy.mjs validate|propose|resolve|plan");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
