import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
for (const file of pkg.files) {
  const text = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (text.includes("PACK_FAIL")) {
    console.error(file);
    process.exit(1);
  }
}
