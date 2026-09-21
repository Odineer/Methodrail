import { parse } from "yaml";

export interface CompletionVerification {
  command: string;
  result: string;
}

export interface CompletionDecision {
  subject: string;
  disposition: string;
  approval: string;
}

export interface CompletionReport {
  claim?: string;
  verification?: CompletionVerification[];
  evidence_labels?: string[];
  decisions?: CompletionDecision[];
  knowledge?: string;
  residual_risk?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function extractCompletionReport(answer: string): CompletionReport | null {
  const fences = [...answer.matchAll(/```yaml\s*\n([\s\S]*?)```/g)];
  for (let i = fences.length - 1; i >= 0; i -= 1) {
    const body = fences[i]?.[1];
    if (!body || !/methodrail_completion\s*:/.test(body)) continue;
    try {
      const parsed: unknown = parse(body);
      if (!isRecord(parsed) || !isRecord(parsed.methodrail_completion)) return null;
      const raw = parsed.methodrail_completion;
      const report: CompletionReport = {};
      if (typeof raw.claim === "string") report.claim = raw.claim;
      if (Array.isArray(raw.verification)) {
        report.verification = raw.verification.flatMap((item) => {
          if (!isRecord(item) || typeof item.command !== "string" || typeof item.result !== "string") return [];
          return [{ command: item.command, result: item.result }];
        });
      }
      if (Array.isArray(raw.evidence_labels) && raw.evidence_labels.every((item) => typeof item === "string")) {
        report.evidence_labels = raw.evidence_labels;
      }
      if (Array.isArray(raw.decisions)) {
        report.decisions = raw.decisions.flatMap((item) => {
          if (
            !isRecord(item) ||
            typeof item.subject !== "string" ||
            typeof item.disposition !== "string" ||
            typeof item.approval !== "string"
          ) {
            return [];
          }
          return [{ subject: item.subject, disposition: item.disposition, approval: item.approval }];
        });
      }
      if (typeof raw.knowledge === "string") report.knowledge = raw.knowledge;
      if (typeof raw.residual_risk === "string") report.residual_risk = raw.residual_risk;
      return report;
    } catch {
      return null;
    }
  }
  return null;
}
