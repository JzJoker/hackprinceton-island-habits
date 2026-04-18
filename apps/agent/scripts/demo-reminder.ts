import { createApp } from "../src/photon/app.js";
import { sendMorningReminder, sendAllMorningReminders } from "../src/photon/reminders.js";
import { overrideMemberPhones } from "../src/state/mock-store.js";

async function main() {
  const phones = process.argv.slice(2);
  if (phones.length === 0) {
    console.log("Usage: npx tsx scripts/demo-reminder.ts +15551110001 [+15551110002 ...]");
    console.log("       Provide 1-3 phones to override demo island members.");
    process.exit(1);
  }

  overrideMemberPhones("isl_demo", phones);

  const app = await createApp();

  if (phones.length === 1) {
    const ok = await sendMorningReminder(app, "u_alex", "isl_demo");
    console.log(`Single reminder to ${phones[0]}: ${ok ? "sent" : "skipped"}`);
  } else {
    const count = await sendAllMorningReminders(app, "isl_demo");
    console.log(`Sent ${count} reminders.`);
  }

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
