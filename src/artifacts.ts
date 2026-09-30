import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { walkFiles } from "./fs-walk.js";
import { inspectHarnessBinding, type HarnessBindingResult } from "./harness.js";
import { projectMdPointerPaths } from "./project-md.js";

export const ARTIFACT_ROLES = [
  "glossary",
  "adr",
  "spec",
  "plan",
  "ticket",
  "scratch",
  "decision-log",
  "verification-map",
  "verification-skill",
  "typed-knowledge",
  "control",
  "host-instruction",
  "methodrail-project",
] as const;

export type ArtifactRole = (typeof ARTIFACT_ROLES)[number];

export const PREVIEW_OPS = ["create", "update", "adopt", "unchanged", "conflict", "unavailable"] as const;
export type PreviewOp = (typeof PREVIEW_OPS)[number];

export interface DiscoveredArtifact {
  path: string;
  role: ArtifactRole;
  evidence: string;
}

export interface ArtifactConflict {
  role: ArtifactRole;
  paths: string[];
  reason: string;
}

export interface PreviewItem {
  path: string;
  op: PreviewOp;
  role?: ArtifactRole;
  why: string;
  methodrailOwned: boolean;
  gitVisible: boolean;
}

export interface DiscoveryReport {
  artifacts: DiscoveredArtifact[];
  conflicts: ArtifactConflict[];
  preview: PreviewItem[];
}

const SKIP_NAMES = new Set([".git", "dist", "node_modules"]);

export const TSV_HEADER = "ts\tphase\tdecision\twhy\tevidence\tresult";

function repoPath(root: string, absolute: string): string {
  return relative(root, absolute).split(sep).join("/");
}

function readHead(path: string, limit = 8000): string {
  try {
    return readFileSync(path, "utf8").slice(0, limit);
  } catch {
    return "";
  }
}

function hasHeading(source: string, heading: RegExp): boolean {
  return heading.test(source);
}

function classifyFile(rel: string, absolute: string): DiscoveredArtifact | null {
  const source = readHead(absolute);

  if (rel === ".methodrail/PROJECT.md") {
    return { path: rel, role: "methodrail-project", evidence: "canonical Methodrail index" };
  }

  if (
    /^\.(?:agents|cursor|claude)\/skills\/verify-[^/]+\/SKILL\.md$/i.test(rel) &&
    /##\s+Launch/i.test(source)
  ) {
    return { path: rel, role: "verification-skill", evidence: "project-local verify skill with Launch" };
  }
  if (
    /^\.(?:agents|cursor|claude)\/skills\/verify-[^/]+\/features\/.+\.md$/i.test(rel) &&
    hasHeading(source, /^##\s+Sub-features\s*$/m)
  ) {
    return { path: rel, role: "verification-map", evidence: "feature map with Sub-features heading" };
  }

  if (
    rel === "AGENTS.md" ||
    rel === "CLAUDE.md" ||
    /^\.github\/copilot-instructions\.md$/i.test(rel) ||
    /^\.cursor\/(rules|skills)\//.test(rel) ||
    /^\.claude\//.test(rel) ||
    /^\.codex\//.test(rel) ||
    (/^\.agents\/skills\//.test(rel) && !/\/verify-[^/]+\//.test(rel))
  ) {
    return { path: rel, role: "host-instruction", evidence: "existing host instruction or unmanaged skill" };
  }

  if (/^docs\/adr\/.+\.md$/i.test(rel) || /^\.methodrail\/knowledge\/decisions\/.+\.md$/i.test(rel)) {
    return { path: rel, role: "adr", evidence: "ADR location with a markdown decision file" };
  }

  if (rel === "decisions.tsv" || /^\.audit\/.+\.tsv$/i.test(rel)) {
    const first = source.split(/\r?\n/, 1)[0]?.trim() ?? "";
    if (first === TSV_HEADER) {
      return { path: rel, role: "decision-log", evidence: "six-column pstack-compatible TSV header" };
    }
  }

  const glossaryName =
    rel === "CONTEXT.md" ||
    /^context-map\.md$/i.test(rel) ||
    /^glossary\.md$/i.test(rel) ||
    /^glossary-map\.md$/i.test(rel) ||
    /^docs\/glossary\.md$/i.test(rel);
  const glossaryContent =
    hasHeading(source, /^#+\s+(glossary|ubiquitous language|domain vocabulary|context)\b/im) ||
    /\b(ubiquitous language|bounded context)\b/i.test(source);
  if (glossaryName && glossaryContent) {
    return { path: rel, role: "glossary", evidence: "glossary or domain vocabulary content" };
  }

  if (/^docs\/superpowers\/specs\//i.test(rel) || /^docs\/specs\//i.test(rel) || /^specs\//i.test(rel)) {
    if (source.trim().length > 0) {
      return { path: rel, role: "spec", evidence: "project spec directory with content" };
    }
  }
  if (/^docs\/superpowers\/plans\//i.test(rel) || /^docs\/plans\//i.test(rel) || /^plans\//i.test(rel)) {
    if (source.trim().length > 0) {
      return { path: rel, role: "plan", evidence: "project plan directory with content" };
    }
  }
  if (/^(?:\.scratch|scratch)\//i.test(rel)) {
    return { path: rel, role: "scratch", evidence: "scratch convention" };
  }
  if (/^(?:docs\/)?(?:tickets|issues)\//i.test(rel)) {
    return { path: rel, role: "ticket", evidence: "tracker convention" };
  }

  if (/^\.methodrail\/knowledge\/(?!decisions\/).+\.md$/i.test(rel)) {
    return { path: rel, role: "typed-knowledge", evidence: "Methodrail knowledge note" };
  }
  if (/^\.methodrail\/control\//i.test(rel)) {
    return { path: rel, role: "control", evidence: "Methodrail control procedure" };
  }

  return null;
}

function adrHome(path: string): string {
  if (path.startsWith("docs/adr/")) return "docs/adr";
  if (path.startsWith(".methodrail/knowledge/decisions/")) return ".methodrail/knowledge/decisions";
  return dirname(path);
}

function glossaryHome(path: string): string {
  const dir = dirname(path);
  return dir === "." ? path : dir;
}

function projectMdPointsAt(pointers: Set<string>, artifactPath: string): boolean {
  return pointers.has(artifactPath);
}

function writeWouldBeGitVisible(harness: HarnessBindingResult, op: PreviewOp): boolean {
  if (op !== "create" && op !== "update" && op !== "adopt") return false;
  return harness.binding?.placement !== "linked-external";
}

function discoverableFiles(projectRoot: string, harness: HarnessBindingResult): { absolute: string; rel: string }[] {
  const out: { absolute: string; rel: string }[] = [];
  const seen = new Set<string>();

  const addWalk = (walkRoot: string, toRel: (absolute: string) => string | undefined): void => {
    for (const file of walkFiles(walkRoot, () => true, { skipNames: SKIP_NAMES })) {
      let st;
      try {
        st = statSync(file);
      } catch {
        continue;
      }
      if (!st.isFile()) continue;
      const rel = toRel(file);
      if (!rel || seen.has(rel)) continue;
      seen.add(rel);
      out.push({ absolute: file, rel });
    }
  };

  addWalk(projectRoot, (file) => repoPath(projectRoot, file));

  if (harness.binding?.placement === "linked-external") {
    const storage = harness.binding.storageHarnessRoot;
    addWalk(storage, (file) => {
      const inner = relative(storage, file).split(sep).join("/");
      if (!inner || inner.startsWith("../")) return undefined;
      return `.methodrail/${inner}`;
    });
  }

  return out;
}

/**
 * Discover recognizable project artifacts by layout plus content.
 * Ambiguous canonical roots become `conflict` and must not be guessed.
 * Maintainer helper only; native agents follow the skill procedure.
 */
export function discoverProjectArtifacts(projectRoot: string): DiscoveryReport {
  const harness = inspectHarnessBinding(projectRoot);
  const artifacts: DiscoveredArtifact[] = [];
  for (const file of discoverableFiles(projectRoot, harness)) {
    const found = classifyFile(file.rel, file.absolute);
    if (found) artifacts.push(found);
  }

  const byRole = new Map<ArtifactRole, DiscoveredArtifact[]>();
  for (const item of artifacts) {
    const list = byRole.get(item.role) ?? [];
    list.push(item);
    byRole.set(item.role, list);
  }

  const conflicts: ArtifactConflict[] = [];
  const glossaryHomes = new Set((byRole.get("glossary") ?? []).map((item) => glossaryHome(item.path)));
  if (glossaryHomes.size > 1) {
    conflicts.push({
      role: "glossary",
      paths: (byRole.get("glossary") ?? []).map((item) => item.path),
      reason: "two glossary or domain-doc roots both look canonical",
    });
  }
  const adrHomes = new Set((byRole.get("adr") ?? []).map((item) => adrHome(item.path)));
  if (adrHomes.size > 1) {
    conflicts.push({
      role: "adr",
      paths: [...adrHomes],
      reason: "two ADR locations both look canonical",
    });
  }

  const projectMdPath = join(projectRoot, ".methodrail", "PROJECT.md");
  const projectMd = existsSync(projectMdPath) ? readFileSync(projectMdPath, "utf8") : null;
  const pointers = projectMd ? projectMdPointerPaths(projectMd, projectMdPath, projectRoot) : new Set<string>();
  const harnessExists = projectMd !== null;
  const preview: PreviewItem[] = [];
  const conflictPaths = new Set(conflicts.flatMap((item) => item.paths));
  const bindErrors = harness.diagnostics.filter((item) => item.level === "error");
  const bindFailed = !harness.binding && bindErrors.length > 0;

  if (bindFailed) {
    preview.push({
      path: ".methodrail",
      op: "unavailable",
      why: bindErrors[0]?.message ?? "harness binding failed",
      methodrailOwned: true,
      gitVisible: false,
    });
  } else if (!harnessExists) {
    preview.push({
      path: ".methodrail/PROJECT.md",
      op: "create",
      role: "methodrail-project",
      why: "no Methodrail index exists yet",
      methodrailOwned: true,
      gitVisible: writeWouldBeGitVisible(harness, "create"),
    });
  }

  if (!bindFailed) {
    for (const artifact of artifacts) {
      if (artifact.role === "methodrail-project") {
        preview.push({
          path: artifact.path,
          op: "unchanged",
          role: artifact.role,
          why: "existing Methodrail index; refresh may still adopt missing pointers",
          methodrailOwned: true,
          gitVisible: false,
        });
        continue;
      }
      const inConflict =
        conflictPaths.has(artifact.path) || conflicts.some((item) => item.paths.includes(adrHome(artifact.path)));
      if (inConflict) {
        preview.push({
          path: artifact.path,
          op: "conflict",
          role: artifact.role,
          why: conflicts.find((item) => item.role === artifact.role)?.reason ?? "ambiguous canonical owner",
          methodrailOwned: false,
          gitVisible: false,
        });
        continue;
      }
      if (artifact.role === "host-instruction" || artifact.role === "typed-knowledge" || artifact.role === "control") {
        const pointed = projectMdPointsAt(pointers, artifact.path);
        const op: PreviewOp =
          pointed || artifact.role === "host-instruction" ? "unchanged" : harnessExists ? "adopt" : "unchanged";
        preview.push({
          path: artifact.path,
          op,
          role: artifact.role,
          why:
            artifact.role === "host-instruction"
              ? "preserve curated host instructions"
              : pointed
                ? "already indexed from PROJECT.md"
                : "index existing Methodrail knowledge or control by pointer",
          methodrailOwned: artifact.role !== "host-instruction",
          gitVisible: writeWouldBeGitVisible(harness, op),
        });
        continue;
      }
      const pointed = projectMdPointsAt(pointers, artifact.path);
      const op: PreviewOp = pointed ? "unchanged" : "adopt";
      preview.push({
        path: artifact.path,
        op,
        role: artifact.role,
        why: pointed ? "already indexed from PROJECT.md" : "index the existing canonical artifact by pointer",
        methodrailOwned: false,
        gitVisible: writeWouldBeGitVisible(harness, op),
      });
    }
  }

  const hasVerify = (byRole.get("verification-skill") ?? []).length > 0;
  const hasControl = (byRole.get("control") ?? []).length > 0;
  if (!hasVerify && !hasControl) {
    preview.push({
      path: "project-local verification",
      op: "unavailable",
      why: "no project-local verify skill or control procedure is present in this checkout",
      methodrailOwned: false,
      gitVisible: false,
    });
  }

  return { artifacts, conflicts, preview };
}

export function previewWrites(report: DiscoveryReport): PreviewItem[] {
  return report.preview.filter((item) => item.op === "create" || item.op === "update" || item.op === "adopt");
}
