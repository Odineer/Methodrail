const args = process.argv.slice(2);
let flow = "";
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--flow") flow = args[index + 1] ?? "";
}
if (flow === "checkout") {
  console.log("checkout ok");
  process.exit(0);
}
console.error("usage: node scripts/drive.mjs --flow checkout");
process.exit(1);
