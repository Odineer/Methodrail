export function resolvePilotDir(
  battery: string,
  env?: { METHODRAIL_PILOT_DIR?: string | undefined },
): string;

export function collectTranscriptPilot(options: {
  battery: string;
  pilotDir?: string;
  outputRoot?: string;
  extract?: string;
}): string[];
