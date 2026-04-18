import { createApp } from "../src/photon/app.js";
import { maybeBroadcastLowMotivation } from "../src/photon/motivation.js";
import { overrideMemberPhones, setMotivation } from "../src/state/mock-store.js";

async function main() {
  const phones = process.argv.slice(2);
  if (phones.length < 2) {
    console.log("Usage: npx tsx scripts/demo-motivation.ts +15551110001 +15551110002 [+15551110003]");
    console.log("       Need at least 2 phones for a group chat.");
    process.exit(1);
  }

  overrideMemberPhones("isl_demo", phones);
  setMotivation("a_sam", 18);

  const app = await createApp();
  const ok = await maybeBroadcastLowMotivation(app, "u_sam", "isl_demo");
  console.log(`Low-motivation broadcast: ${ok ? "sent" : "skipped"}`);

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
