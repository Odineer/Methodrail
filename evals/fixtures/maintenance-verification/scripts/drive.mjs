const args = process.argv.slice(2);
let flow = "";
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--flow") flow = args[index];
}
if (flow === "checkout") {
  console.log("checkout ok");
  process.exit(0);
}
if (flow === "refund") {
  console.log("refund ok");
  process.exit(0);
}
console.error("usage: node scripts/drive.mjs --flow checkout|refund");
process.exit(1);
