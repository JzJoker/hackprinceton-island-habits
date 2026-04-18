import { cloud, Spectrum, text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { terminal } from "spectrum-ts/providers/terminal";
import "dotenv/config";

const PROJECT_ID = process.env.projid!;
const PROJECT_SECRET = process.env.secret!;

async function testCloudAPIs() {
  console.log("=== Testing Spectrum Cloud APIs ===\n");
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Secret: ${PROJECT_SECRET.slice(0, 8)}...`);
  console.log("");

  console.log("--- Step 1: Enable iMessage Platform ---");
  try {
    const result = await cloud.togglePlatform(PROJECT_ID, PROJECT_SECRET, "imessage", true);
    console.log("Toggle result:", JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("Toggle error:", err.message);
  }

  console.log("\n--- Step 2: Issue iMessage Tokens ---");
  try {
    const tokens = await cloud.issueImessageTokens(PROJECT_ID, PROJECT_SECRET);
    console.log("Token type:", tokens.type);
    console.log("Expires in:", tokens.expiresIn, "seconds");
    if (tokens.type === "shared") {
      console.log("Token preview:", tokens.token.slice(0, 20) + "...");
    } else if (tokens.type === "dedicated") {
      console.log("Dedicated auth keys:", Object.keys(tokens.auth));
    }
    console.log("Cloud token issuance SUCCESSFUL!");
  } catch (err: any) {
    console.error("Token error:", err.message);
  }
}

async function testSpectrumInit() {
  console.log("\n=== Testing Spectrum Initialization (Cloud iMessage + Terminal) ===\n");

  try {
    const app = await Spectrum({
      projectId: PROJECT_ID,
      projectSecret: PROJECT_SECRET,
      providers: [
        imessage.config(),
        terminal.config(),
      ],
    });

    console.log("Spectrum app initialized SUCCESSFULLY!");
    console.log("Providers: imessage (cloud mode), terminal");
    console.log("\nListening for messages... Type something below, or Ctrl+C to exit.\n");

    const timeout = setTimeout(async () => {
      console.log("\n--- Auto-shutdown after 15s (test complete) ---");
      await app.stop();
      process.exit(0);
    }, 15000);

    for await (const [space, message] of app.messages) {
      const content = message.content[0];
      if (content && content.type === "plain_text") {
        console.log(`[${message.platform}] ${message.sender.id}: ${content.text}`);
        await space.send(text(`Echo: ${content.text}`));
      }
    }

    clearTimeout(timeout);
  } catch (err: any) {
    console.error("Spectrum init error:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

async function main() {
  const mode = process.argv[2] || "cloud";

  if (mode === "cloud") {
    await testCloudAPIs();
  } else if (mode === "init") {
    await testSpectrumInit();
  } else if (mode === "all") {
    await testCloudAPIs();
    await testSpectrumInit();
  } else {
    console.log("Usage: npx tsx scripts/test-photon.ts [cloud|init|all]");
  }
}

main().catch(console.error);
