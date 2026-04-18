import { createApp } from "./photon/app.js";
import { runMessageLoop } from "./photon/handlers.js";
import { startHttpServer } from "./server.js";

async function main() {
  const app = await createApp();
  console.log("\n🤖 Island Habits Agent Started");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Listening for iMessage commands...");
  console.log("Agent Phone: +1 (415) 595-2874");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nAvailable Commands:");
  console.log("  /start   - Create a new island game for your group");
  console.log("\n");

  startHttpServer(app);
  await runMessageLoop(app);

}

main().catch((err) => {
  console.error("❌ Agent crashed:", err);
  process.exit(1);
});
