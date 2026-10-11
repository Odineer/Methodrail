export function loadPlugin() {
  return import(process.env.PLUGIN);
}
