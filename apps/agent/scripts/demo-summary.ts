import { createApp } from "../src/photon/app.js";
import { sendWeeklySummary } from "../src/photon/summary.js";
import { overrideMemberPhones } from "../src/state/mock-store.js";

async function main() {
  const phones = process.argv.slice(2);
  if (phones.length < 2) {
    console.log("Usage: npx tsx scripts/demo-summary.ts +15551110001 +15551110002 [+15551110003]");
    process.exit(1);
  }

  overrideMemberPhones("isl_demo", phones);

  const app = await createApp();
  const ok = await sendWeeklySummary(app, "isl_demo");
  console.log(`Weekly summary: ${ok ? "sent" : "skipped"}`);

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
