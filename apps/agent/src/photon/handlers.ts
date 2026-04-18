import { PhotonMessage, PhotonApp } from "./app.js";
import { ConvexHttpClient } from "convex/browser";

export async function runMessageLoop(app: PhotonApp): Promise<void> {
  app.on("message", async (msg: PhotonMessage) => {
    console.log(`[MESSAGE] From ${msg.from} in group ${msg.groupId}: ${msg.text}`);

    if (msg.text.trim() === "/start") {
      await handleStartCommand(app, msg);
    }
  });

  // Keep the process alive
  await new Promise(() => {});
}

async function handleStartCommand(
  app: PhotonApp,
  msg: PhotonMessage
): Promise<void> {
  console.log(`[/start] Starting new island game`);

  if (!msg.groupId) {
    console.log("[/start] No group ID found");
    return;
  }

  try {
    const convexUrl = process.env.CONVEX_URL;
    if (!convexUrl) {
      throw new Error("Missing CONVEX_URL in environment");
    }

    // Extract group member phone numbers; fallback to sender for one-person testing.
    const rawPhones = msg.groupMembers?.length ? msg.groupMembers : [msg.from];
    const phoneNumbers = Array.from(new Set(rawPhones)).filter(Boolean);
    console.log(`[/start] Group has ${phoneNumbers.length} members: ${phoneNumbers.join(", ")}`);

    // Create island in Convex
    const convex = new ConvexHttpClient(convexUrl);
    const { code, islandId } = await (convex as any).mutation("islands:createIsland", {
      phoneNumbers,
    });
    console.log(`[/start] Created island ${islandId} with code ${code}`);

    // Send game code and onboarding link to group chat
    const gameLink = `https://islandhabits.com/onboarding?code=${code}`;
    const message = `🏝️ Island Habits Game Started!\n\nGame Code: ${code}\n\nJoin here: ${gameLink}\n\nSelect your phone number and enter your weekly goals!`;

    await app.sendMessage(msg.groupId, message);
    console.log(`[/start] Sent onboarding message to group`);
  } catch (err) {
    console.error(`[/start] Error:`, err);
    if (msg.groupId) {
      await app.sendMessage(
        msg.groupId,
        "❌ Failed to start the game. Please try again."
      );
    }
  }
}

export type { PhotonApp };
