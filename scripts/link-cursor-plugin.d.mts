export const PLUGIN_SURFACES: readonly string[];

export function defaultPluginDir(env?: NodeJS.ProcessEnv): string;

export function linkCursorPlugin(
  repoRoot: string,
  pluginDir: string,
): { repoRoot: string; pluginDir: string; surfaces: string[] };
