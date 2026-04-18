import { createApp } from "./photon/app.js";
import { runMessageLoop } from "./photon/handlers.js";

async function main() {
  const app = await createApp();
  console.log("Agent online. Listening for iMessage traffic...");
  console.log("Agent phone: +1 (415) 595-2874");
  console.log("Send /start in a group chat to trigger onboarding.\n");

  await runMessageLoop(app);
}

main().catch((err) => {
  console.error("Agent crashed:", err);
  process.exit(1);
});
