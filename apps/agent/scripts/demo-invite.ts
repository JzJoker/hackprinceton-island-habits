import { createApp } from "../src/photon/app.js";
import { sendInvite, createIslandGroup } from "../src/photon/invites.js";

async function main() {
  const [phone, ...rest] = process.argv.slice(2);
  if (!phone) {
    console.log("Usage:");
    console.log("  npx tsx scripts/demo-invite.ts +15551234567               # DM invite");
    console.log("  npx tsx scripts/demo-invite.ts +15551234567 +15559876543  # group create + invite");
    process.exit(1);
  }

  const app = await createApp();

  await sendInvite(app, phone, "Alex", "First Light", "isl_demo", "tok_abc123");
  console.log(`Invite DM sent to ${phone}.`);

  if (rest.length > 0) {
    const { spaceId } = await createIslandGroup(app, [phone, ...rest], "First Light");
    console.log(`Group created: ${spaceId}`);
  }

  await app.stop();
}

main().catch((err) => { console.error(err); process.exit(1); });
