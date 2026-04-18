import { createApp } from "../src/photon/app.js";
import { unlockMonument } from "../src/photon/monuments.js";
import { overrideMemberPhones } from "../src/state/mock-store.js";

async function main() {
  const phones = process.argv.slice(2);
  if (phones.length < 2) {
    console.log("Usage: npx tsx scripts/demo-monument.ts +15551110001 +15551110002 [+15551110003]");
    process.exit(1);
  }

  overrideMemberPhones("isl_demo", phones);

  const app = await createApp();

  for (const level of [4, 5, 10]) {
    const ok = await unlockMonument(app, "isl_demo", level);
    console.log(`level ${level}: ${ok ? "monument sent" : "skipped (not a monument level)"}`);
  }

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
