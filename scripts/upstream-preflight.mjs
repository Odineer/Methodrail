import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function parseCliArgs(argv) {
  let format = "text";
  let upstream = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--format") {
      format = argv[i + 1] ?? "";
      i += 1;
    } else if (arg.startsWith("--format=")) {
      format = arg.slice("--format=".length);
    } else if (arg === "--upstream") {
      upstream = argv[i + 1] ?? "";
      i += 1;
    } else if (arg.startsWith("--upstream=")) {
      upstream = arg.slice("--upstream=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (format !== "text" && format !== "json") {
    throw new Error('format must be "text" or "json"');
  }
  if (format === "json" && !upstream) {
    throw new Error("--format json requires --upstream");
  }
  return { format, upstream: upstream || null };
}

export function parseOrigin(line) {
  const match = /^Origin:\s*(.+?)\s+\/\s+(.+?)\s*$/.exec(line.trim());
  if (!match) return null;
  return { source: match[1], originPath: match[2] };
}

export function parseSkillOrigin(name, source) {
  const originLine = /^Origin:\s*.+$/m.exec(source)?.[0];
  const origin = originLine ? parseOrigin(originLine) : null;
  if (!origin) return null;
  const sha = /Upstream revision:\s*([0-9a-f]{7,40})/i.exec(source)?.[1] ?? "";
  return { name, originSource: origin.source, originPath: origin.originPath, sha };
}

export function githubSlug(repository) {
  const match = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/i.exec(repository.trim());
  return match ? match[1] : "";
}

export function recordAliases(record) {
  const aliases = new Set();
  if (record.stem) aliases.add(record.stem);
  if (record.name) aliases.add(record.name);
  const slug = githubSlug(record.repository ?? "");
  if (slug) aliases.add(slug);
  return [...aliases];
}

export function originBelongsToRecord(originSource, record) {
  const source = originSource.trim().toLowerCase();
  return recordAliases(record).some((alias) => alias.toLowerCase() === source);
}

export function parseMatrix(markdown) {
  const rows = [];
  let skillIndex = 0;
  let decisionIndex = -1;
  let capabilityIndex = -1;

  for (const line of markdown.split(/\r?\n/)) {
    const cells = tableCells(line);
    if (!cells) continue;
    const lowered = cells.map((cell) => cell.toLowerCase());
    const skill = lowered.indexOf("skill");
    const decision = lowered.indexOf("decision");
    if (skill !== -1 && decision !== -1 && lowered[skill] === "skill") {
      skillIndex = skill;
      decisionIndex = decision;
      capabilityIndex = lowered.indexOf("canonical methodrail capability");
      continue;
    }
    if (decisionIndex < 0) continue;
    const skillCell = cells[skillIndex] ?? "";
    const decisionCell = (cells[decisionIndex] ?? "").trim();
    if (!skillCell || !decisionCell) continue;
    rows.push({
      names: splitSkillNames(skillCell),
      decision: decisionCell.toUpperCase(),
      capability: capabilityIndex >= 0 ? (cells[capabilityIndex] ?? "") : "",
    });
  }
  return rows;
}

export function loadSkillOrigins(root) {
  const skillsRoot = join(root, "skills");
  if (!existsSync(skillsRoot)) return [];
  const origins = [];
  for (const name of readdirSync(skillsRoot)) {
    const path = join(skillsRoot, name, "UPSTREAM.md");
    if (!existsSync(path)) continue;
    const parsed = parseSkillOrigin(name, readFileSync(path, "utf8"));
    if (parsed) origins.push(parsed);
  }
  return origins;
}

export function loadMatrixRows(root) {
  const path = join(root, "references", "upstream-skill-matrix.md");
  if (!existsSync(path)) return [];
  return parseMatrix(readFileSync(path, "utf8"));
}

export function classifyChangedPaths({ changedPaths, skills, record, matrixRows }) {
  const consumed = new Set();
  const mapped = [];

  for (const skill of skills) {
    if (!originBelongsToRecord(skill.originSource, record)) continue;
    const hits = changedPaths.filter((changed) =>
      pathMatchesOrigin(changed, skill.originPath, record.path ?? ""),
    );
    if (hits.length === 0) continue;
    hits.forEach((path) => consumed.add(path));
    mapped.push({
      methodrail_skill: skill.name,
      origin_path: skill.originPath,
      decision: decisionForSkill(skill, matrixRows),
      upstream_sha_recorded: skill.sha,
      changed_paths: hits,
      action_hint: "review",
    });
  }

  const discoveries = [];
  const unmapped_changes = [];
  for (const changed of changedPaths) {
    if (consumed.has(changed)) continue;
    const matrix = matrixMatch(changed, matrixRows);
    if (matrix && (matrix.decision === "SKIP" || matrix.decision === "COMPOSE")) {
      discoveries.push(discovery(changed, matrix.decision));
      continue;
    }
    if (looksLikeSkill(changed)) {
      discoveries.push(discovery(changed, matrix?.decision === "ADAPT" || matrix?.decision === "ADOPT" ? matrix.decision : "unlisted"));
      continue;
    }
    unmapped_changes.push(changed);
  }

  return { mapped, discoveries, unmapped_changes };
}

export function buildPreflight({ record, head, changedPaths, skills, matrixRows, diffError }) {
  const normalizedHead = head || null;
  const status = !normalizedHead ? "unreachable" : normalizedHead === record.imported ? "current" : "changed";
  const payload = {
    upstream: record.stem,
    repository: record.repository,
    imported: record.imported,
    head: normalizedHead,
    status,
    mapped: [],
    discoveries: [],
    unmapped_changes: [],
  };
  if (status !== "changed") return payload;
  if (diffError) {
    payload.diff_error = diffError;
    return payload;
  }
  const classified = classifyChangedPaths({
    changedPaths: changedPaths ?? [],
    skills,
    record,
    matrixRows,
  });
  payload.mapped = classified.mapped;
  payload.discoveries = classified.discoveries;
  payload.unmapped_changes = classified.unmapped_changes;
  return payload;
}

export function resolveRecord(records, name) {
  const needle = name.trim().toLowerCase();
  return records.find((record) => recordAliases(record).some((alias) => alias.toLowerCase() === needle));
}

function tableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|")) return null;
  const cells = trimmed
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (cells.length === 0 || cells.every((cell) => /^:?-+:?$/.test(cell))) return null;
  return cells;
}

function splitSkillNames(cell) {
  return cell
    .split(/\s+\/\s+/)
    .map((name) => name.replace(/`/g, "").trim())
    .filter(Boolean);
}

function posixJoin(left, right) {
  return `${left.replace(/\/+$/, "")}/${right.replace(/^\/+/, "")}`;
}

function pathMatchesOrigin(changed, originPath, repoPath) {
  const prefixes = [originPath, posixJoin("skills", originPath)];
  if (repoPath) {
    prefixes.push(posixJoin(repoPath, originPath));
    prefixes.push(posixJoin(posixJoin(repoPath, "skills"), originPath));
  }
  return prefixes.some((prefix) => changed === prefix || changed.startsWith(`${prefix}/`));
}

function normalizeSkillName(name) {
  return name.replace(/\s+playbook$/i, "").trim().toLowerCase();
}

function pathContainsSkillName(changed, name) {
  const needle = normalizeSkillName(name);
  if (!needle) return false;
  const parts = changed.split("/").map((part) => part.replace(/\.md$/i, "").toLowerCase());
  return parts.includes(needle);
}

function matrixMatch(changed, matrixRows) {
  let best = null;
  let bestLength = -1;
  for (const row of matrixRows) {
    for (const name of row.names) {
      if (!pathContainsSkillName(changed, name)) continue;
      const length = normalizeSkillName(name).length;
      if (length > bestLength) {
        best = row;
        bestLength = length;
      }
    }
  }
  return best;
}

function decisionForSkill(skill, matrixRows) {
  const originName = skill.originPath.split("/").pop()?.replace(/\.md$/i, "") ?? skill.name;
  for (const row of matrixRows) {
    const names = row.names.map(normalizeSkillName);
    if (names.includes(skill.name.toLowerCase()) || names.includes(originName.toLowerCase())) {
      return row.decision;
    }
    if (row.capability.includes(`\`${skill.name}\``)) return row.decision;
  }
  return "ADAPT";
}

function looksLikeSkill(changed) {
  return /(?:^|\/)SKILL\.md$/i.test(changed) || /(?:^|\/)skills\/[^/]+/.test(changed);
}

function discovery(upstream_path, matrix_decision) {
  return { upstream_path, matrix_decision, note: "report only" };
}
