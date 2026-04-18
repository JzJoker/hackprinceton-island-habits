import { createApp } from "../src/photon/app.js";
import { notifyGoalChange } from "../src/photon/goals.js";
import { overrideMemberPhones } from "../src/state/mock-store.js";

async function main() {
  const phones = process.argv.slice(2);
  if (phones.length < 2) {
    console.log("Usage: npx tsx scripts/demo-goals.ts +15551110001 +15551110002 [+15551110003]");
    process.exit(1);
  }

  overrideMemberPhones("isl_demo", phones);

  const app = await createApp();

  for (const kind of ["add", "edit", "delete"] as const) {
    const ok = await notifyGoalChange(app, "u_alex", "isl_demo", kind, "Read 30 pages/day", { force: true });
    console.log(`goal ${kind}: ${ok ? "sent" : "skipped"}`);
  }

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
