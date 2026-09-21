import type {
  CaptureQuality,
  ComparisonKind,
  ComparisonReport,
  EmpiricalResult,
  ScoreResult,
  SpecificationResult,
} from "./types.js";

function comparisonKind(baseline: ScoreResult, methodrail: ScoreResult): ComparisonKind {
  if (baseline.provenance === "synthetic" || methodrail.provenance === "synthetic") return "guardrail";
  if (baseline.provenance === "constructed" || methodrail.provenance === "constructed") return "specification";
  return "empirical";
}

function captureQuality(baseline: ScoreResult, methodrail: ScoreResult): CaptureQuality {
  if (baseline.capture === "operator_summary" || methodrail.capture === "operator_summary") {
    return "operator_summary";
  }
  if (baseline.capture === "hook_captured" || methodrail.capture === "hook_captured") {
    return "hook_captured";
  }
  return "runner_captured";
}

function empiricalResult(baseline: ScoreResult, methodrail: ScoreResult): EmpiricalResult {
  if (baseline.outcome.incomplete || methodrail.outcome.incomplete) return "incomplete";
  if (methodrail.outcome.passed && !baseline.outcome.passed) return "helped";
  if (methodrail.outcome.passed && baseline.outcome.passed) return "neutral";
  if (!methodrail.outcome.passed && baseline.outcome.passed) return "harmed";
  return "incomplete";
}

function specificationResult(baseline: ScoreResult, methodrail: ScoreResult): SpecificationResult {
  if (methodrail.outcome.passed && !baseline.outcome.passed) return "passed";
  return "failed";
}

export function compareScores(baseline: ScoreResult, methodrail: ScoreResult): ComparisonReport {
  const where: string[] = [];
  const cost: string[] = [];
  const extra: string[] = [];
  const kind = comparisonKind(baseline, methodrail);

  if (methodrail.outcome.passed && !baseline.outcome.passed) {
    where.push("Methodrail outcome passed a grader check baseline missed");
  }
  if (!methodrail.outcome.passed && baseline.outcome.passed) {
    extra.push("Methodrail failed an outcome check baseline passed");
  }
  if (methodrail.metrics.subagents_used > baseline.metrics.subagents_used) {
    extra.push("Methodrail used more subagents");
  }
  if (methodrail.metrics.expensive_skill_count > baseline.metrics.expensive_skill_count) {
    extra.push("Methodrail used more expensive operators");
  }

  cost.push(
    `skills ${baseline.metrics.skill_count}→${methodrail.metrics.skill_count}`,
    `references ${baseline.metrics.reference_count}→${methodrail.metrics.reference_count}`,
    `subagents ${baseline.metrics.subagents_used}→${methodrail.metrics.subagents_used}`,
    `verification steps ${baseline.metrics.verification_steps}→${methodrail.metrics.verification_steps}`,
    `routing ${baseline.routing.assessment}→${methodrail.routing.assessment}`,
    `operational quality ${baseline.operational_quality}→${methodrail.operational_quality}`,
  );
  if (baseline.metrics.latency_ms != null || methodrail.metrics.latency_ms != null) {
    cost.push(`latency_ms ${baseline.metrics.latency_ms ?? "n/a"}→${methodrail.metrics.latency_ms ?? "n/a"}`);
  }

  const report: ComparisonReport = {
    fixture_id: methodrail.fixture_id,
    kind,
    baseline,
    methodrail,
    methodrail_helped: null,
    where,
    cost,
    extra_complexity: extra,
    capture: captureQuality(baseline, methodrail),
  };

  if (kind === "empirical") {
    const empirical = empiricalResult(baseline, methodrail);
    report.empirical = empirical;
    report.methodrail_helped = empirical === "helped" ? true : empirical === "harmed" ? false : null;
  } else if (kind === "specification") {
    report.specification = specificationResult(baseline, methodrail);
  } else {
    report.guardrail = methodrail.routing.assessment === "violation" ? "caught" : "missed";
  }

  return report;
}

export function formatComparison(report: ComparisonReport): string {
  const kindLine =
    report.kind === "empirical"
      ? `Empirical result: ${report.empirical}`
      : report.kind === "specification"
        ? `Specification result: ${report.specification}`
        : `Guardrail result: ${report.guardrail}`;
  const helpLine =
    report.kind === "empirical"
      ? report.empirical === "neutral"
        ? "Did Methodrail help? no scored gain"
        : report.empirical === "helped"
          ? "Did Methodrail help? yes"
          : report.empirical === "harmed"
            ? "Did Methodrail help? no"
            : "Did Methodrail help? incomplete"
      : report.kind === "specification"
        ? "Did Methodrail help? not an empirical claim (specification)"
        : "Did Methodrail help? not an empirical claim (guardrail)";

  return [
    `# Composition report: ${report.fixture_id}`,
    "",
    `Kind: ${report.kind}`,
    kindLine,
    `Capture: ${report.capture}`,
    helpLine,
    "",
    "## Outcome",
    `- Baseline: ${report.baseline.outcome.incomplete ? "incomplete" : report.baseline.outcome.passed ? "pass" : "fail"}`,
    `- Methodrail: ${report.methodrail.outcome.incomplete ? "incomplete" : report.methodrail.outcome.passed ? "pass" : "fail"}`,
    ...(report.where.length > 0 ? report.where.map((line) => `- ${line}`) : ["- No outcome gain"]),
    "",
    "## Routing",
    `- Baseline: ${report.baseline.routing.assessment}`,
    `- Methodrail: ${report.methodrail.routing.assessment}`,
    `- Operational quality: ${report.baseline.operational_quality} → ${report.methodrail.operational_quality}`,
    "",
    "## Cost",
    ...report.cost.map((line) => `- ${line}`),
    "",
    "## Additional complexity",
    ...(report.extra_complexity.length > 0
      ? report.extra_complexity.map((line) => `- ${line}`)
      : ["- None scored"]),
    "",
    "## Baseline outcome failures",
    ...(report.baseline.outcome.failures.length > 0
      ? report.baseline.outcome.failures.map((line) => `- ${line}`)
      : ["- none"]),
    "",
    "## Methodrail outcome failures",
    ...(report.methodrail.outcome.failures.length > 0
      ? report.methodrail.outcome.failures.map((line) => `- ${line}`)
      : ["- none"]),
    "",
  ].join("\n");
}

export function integrityFailure(report: ComparisonReport): string | null {
  if (report.baseline.outcome.incomplete || report.methodrail.outcome.incomplete) {
    return `${report.fixture_id}: missing artifacts or incomplete grade`;
  }
  if (report.kind === "specification" && report.specification === "failed") {
    return `${report.fixture_id}: specification failed`;
  }
  if (report.kind === "guardrail" && report.guardrail === "missed") {
    return `${report.fixture_id}: guardrail missed`;
  }
  return null;
}
