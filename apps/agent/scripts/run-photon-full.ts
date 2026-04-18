/**
 * run-photon-full.ts
 *
 * New standalone entrypoint that runs the Photon iMessage agent with a
 * router for multiple commands — does NOT edit any existing photon files.
 *
 * Run this INSTEAD of `npm run dev` (which starts the old `src/index.ts`
 * listener). Do not run both at once: Photon exposes a single message
 * stream per project, and two consumers will race.
 *
 *   cd apps/agent
 *   npx tsx scripts/run-photon-full.ts
 *
 * Supported commands (case-insensitive, leading slash optional for most):
 *   /start                     — create an island for the group chat
 *   /help                      — list commands
 *   /goals                     — list your active goals (numbered)
 *   /add <text>                — add a goal
 *   /drop <n>                  — archive the Nth goal from your last /goals list
 *   /edit <n> <new text>       — replace the Nth goal's text
 *   /status                    — today's check-ins, island level, agent motivation
 *
 * Required env (apps/agent/.env):
 *   projid, secret             — Photon project credentials
 *   CONVEX_URL                 — https://<deployment>.convex.cloud (no trailing /)
 *   APP_BASE_URL (optional)    — used for the /start join link
 *   BOT_PHONE (optional)       — bot's own number, so we filter it out of member lists
 */

import { Spectrum, text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { ConvexHttpClient } from "convex/browser";
import { hasOnboarded, markOnboarded } from "../src/state/seen-spaces.js";
import "dotenv/config";

// ── Config ─────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.projid;
const PROJECT_SECRET = process.env.secret;
const CONVEX_URL = (process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL ?? "").replace(/\/+$/, "");
const APP_BASE_URL = (process.env.APP_BASE_URL ?? "http://localhost:5173").replace(/\/+$/, "");
const BOT_PHONE = (process.env.BOT_PHONE ?? "+14155952874").replace(/\D/g, "");

if (!PROJECT_ID || !PROJECT_SECRET) {
  console.error("❌ Missing projid/secret in apps/agent/.env");
  process.exit(1);
}
if (!CONVEX_URL) {
  console.error("❌ Missing CONVEX_URL in apps/agent/.env");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

// ── Address normalization ─────────────────────────────────────────────

function toE164Like(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const digits = value.trim().replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

function toEmailLike(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  if (/^[^\s@]+@(icloud\.com|me\.com|apple\.com|mail\.com|gmail\.com)$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function senderAddress(message: any): string | null {
  const s = message?.sender ?? {};
  const candidates = [s.phoneNumber, s.address, s.email, s.id];
  for (const c of candidates) {
    const phone = toE164Like(c);
    if (phone && phone.replace(/\D/g, "") !== BOT_PHONE) return phone;
    const email = toEmailLike(c);
    if (email) return email;
  }
  return null;
}

function collectParticipants(space: any, message: any): string[] {
  const raw: unknown[] = [];
  for (const arr of [space?.participants, space?.members, space?.users]) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) raw.push(item?.phoneNumber, item?.address, item?.email, item?.id, item);
  }
  raw.push(message?.sender?.phoneNumber, message?.sender?.address, message?.sender?.email, message?.sender?.id);
  const out = new Set<string>();
  for (const v of raw) {
    const phone = toE164Like(v);
    if (phone && phone.replace(/\D/g, "") !== BOT_PHONE) out.add(phone);
    const email = toEmailLike(v);
    if (email) out.add(email);
  }
  return [...out];
}

// ── Convex helpers ────────────────────────────────────────────────────

type Island = { _id: string; code: string; name: string; status: string; islandLevel: number; xp: number };
type Goal = { _id: string; text: string; islandId: string; phoneNumber: string; status: string; createdAt: number };
type Agent = { _id: string; phoneNumber: string; motivation: number; personalityProfile: string };

async function resolveSenderIsland(sender: string): Promise<Island | null> {
  const islands: Island[] = await convex.query("islands:getIslandsByPhone" as any, { phoneNumber: sender });
  if (!islands.length) return null;
  const active = islands.filter((i) => i.status === "active");
  const pool = active.length ? active : islands;
  // Most recent first — relies on createdAt not being returned here, so just pick first.
  return pool[0];
}

async function fetchGoals(islandId: string, sender: string): Promise<Goal[]> {
  return await convex.query("goals:getGoals" as any, { islandId, phoneNumber: sender });
}

// ── Per-sender state for numbered references ─────────────────────────
// /goals returns a numbered list; /drop 2 and /edit 2 refer back to that list.
// TTL 15 min so stale numbers don't delete the wrong goal.

const listingTtlMs = 15 * 60 * 1000;
type Listing = { goalIds: string[]; expiresAt: number };
const lastListing = new Map<string, Listing>();

function rememberListing(sender: string, goals: Goal[]): void {
  lastListing.set(sender, {
    goalIds: goals.map((g) => g._id),
    expiresAt: Date.now() + listingTtlMs,
  });
}

function recallGoalId(sender: string, index1: number): string | null {
  const entry = lastListing.get(sender);
  if (!entry || Date.now() > entry.expiresAt) return null;
  const idx = index1 - 1;
  if (idx < 0 || idx >= entry.goalIds.length) return null;
  return entry.goalIds[idx];
}

// ── Command parsing ───────────────────────────────────────────────────

type Command =
  | { kind: "start" }
  | { kind: "help" }
  | { kind: "goals" }
  | { kind: "add"; text: string }
  | { kind: "drop"; index: number }
  | { kind: "edit"; index: number; text: string }
  | { kind: "status" }
  | { kind: "none" };

function parseCommand(raw: string): Command {
  const body = raw.trim();
  const lower = body.toLowerCase();

  if (lower === "/start") return { kind: "start" };
  if (lower === "/help" || lower === "help") return { kind: "help" };
  if (lower === "/goals" || lower === "goals" || lower === "my goals") return { kind: "goals" };
  if (lower === "/status" || lower === "status") return { kind: "status" };

  let m = body.match(/^\/?add\s+(?:goal[:\s]+)?(.+)$/i);
  if (m) return { kind: "add", text: m[1].trim() };

  m = body.match(/^\/?drop\s+(\d+)\s*$/i);
  if (m) return { kind: "drop", index: parseInt(m[1], 10) };

  m = body.match(/^\/?edit\s+(\d+)\s+(.+)$/i);
  if (m) return { kind: "edit", index: parseInt(m[1], 10), text: m[2].trim() };

  return { kind: "none" };
}

const HELP_TEXT =
  "✨ Island Habits — here's what I can do ✨\n" +
  "🏝️  /start — spin up a fresh island for your group\n" +
  "📋  /goals — list your active goals (numbered)\n" +
  "🌱  /add <goal> — plant a new goal on your island\n" +
  "🍂  /drop <n> — let the Nth goal go\n" +
  "✏️  /edit <n> <new text> — reshape the Nth goal\n" +
  "📊  /status — today's progress & motivation\n" +
  "❓  /help — show this list\n\n" +
  "Tip: you can drop the leading slash (e.g. `add meditate 10 min`).";

// ── Handlers ──────────────────────────────────────────────────────────

async function handleStart(space: any, message: any): Promise<void> {
  if (hasOnboarded(space.id)) {
    await space.send(text("The start process has already been initiated."));
    return;
  }
  const participants = collectParticipants(space, message);
  if (!participants.length) {
    await space.send(text("Couldn't detect group members. Start this in a group iMessage with phone numbers or iCloud emails."));
    return;
  }
  try {
    const result: any = await convex.mutation("islands:createIsland" as any, { phoneNumbers: participants });
    const code = result.code as string;
    markOnboarded(space.id);
    await space.send(text(`Island Habits started.\n\nRoom Code: ${code}\nJoin: ${APP_BASE_URL}/?code=${code}`));
    console.log(`[/start] code=${code} participants=${participants.join(",")}`);
  } catch (err: any) {
    console.error("[/start] failed:", err?.message ?? err);
    await space.send(text("Failed to create room code. Try /start again."));
  }
}

async function handleGoals(space: any, sender: string): Promise<void> {
  const island = await resolveSenderIsland(sender);
  if (!island) {
    await space.send(text("I couldn't find an island for you yet. Ask someone to run /start in your group."));
    return;
  }
  const goals = await fetchGoals(island._id, sender);
  if (!goals.length) {
    await space.send(text(`No active goals on ${island.name}. Add one with "/add <goal>".`));
    return;
  }
  rememberListing(sender, goals);
  const lines = goals.map((g, i) => `${i + 1}. ${g.text}`);
  await space.send(text(`Your goals on ${island.name}:\n${lines.join("\n")}`));
}

async function handleAdd(space: any, sender: string, goalText: string): Promise<void> {
  if (!goalText) {
    await space.send(text('Usage: /add <goal text>'));
    return;
  }
  const island = await resolveSenderIsland(sender);
  if (!island) {
    await space.send(text("I couldn't find an island for you. Run /start first."));
    return;
  }
  await convex.mutation("goals:addGoals" as any, {
    islandId: island._id,
    phoneNumber: sender,
    goals: [goalText],
  });
  // Refresh the numbered listing so /drop <n> right after /add works predictably.
  const goals = await fetchGoals(island._id, sender);
  rememberListing(sender, goals);

  const count = goals.length;
  const plural = count === 1 ? "" : "s";
  // Pick a warm flavor message so adds don't all sound the same.
  const flavors = [
    `🌱 Planted "${goalText}" on ${island.name}. You're tending ${count} goal${plural} now — the island hums a little louder. ✨`,
    `🌿 "${goalText}" is taking root. ${count} goal${plural} in your grove. Keep going — I'm rooting for you. 💫`,
    `☀️ New goal locked in: "${goalText}". That's ${count} for the week. Small steps, real island. 🏝️`,
    `✨ "${goalText}" added to your list. ${count} goal${plural} alive and glowing. Let's do this. 💪`,
  ];
  const msg = flavors[Math.floor(Math.random() * flavors.length)];
  await space.send(text(msg));
}

async function handleDrop(space: any, sender: string, index: number): Promise<void> {
  const goalId = recallGoalId(sender, index);
  if (!goalId) {
    await space.send(text("I don't have a numbered goal list for you. Run /goals first, then /drop <n>."));
    return;
  }
  try {
    await convex.mutation("goals:archiveGoal" as any, { goalId });
    await space.send(text(`Dropped goal ${index}.`));
  } catch (err: any) {
    console.error("[/drop] failed:", err?.message ?? err);
    await space.send(text("Couldn't drop that goal. It may already be archived."));
  }
}

async function handleEdit(space: any, sender: string, index: number, newText: string): Promise<void> {
  const goalId = recallGoalId(sender, index);
  if (!goalId) {
    await space.send(text("I don't have a numbered goal list for you. Run /goals first, then /edit <n> <new text>."));
    return;
  }
  try {
    await convex.mutation("goals:editGoal" as any, { goalId, newText });
    await space.send(text(`Goal ${index} is now: "${newText}".`));
  } catch (err: any) {
    console.error("[/edit] failed:", err?.message ?? err);
    await space.send(text("Couldn't edit that goal."));
  }
}

async function handleStatus(space: any, sender: string): Promise<void> {
  const island = await resolveSenderIsland(sender);
  if (!island) {
    await space.send(text("No island for you yet. Run /start in a group chat."));
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const [goals, checkIns, details] = await Promise.all([
    fetchGoals(island._id, sender),
    convex.query("goals:getTodayCheckIns" as any, { islandId: island._id, phoneNumber: sender, date: today }),
    convex.query("islands:getIslandDetails" as any, { islandId: island._id }),
  ]);

  const checkedGoalIds = new Set((checkIns as any[]).filter((c) => c.completed).map((c) => c.goalId));
  const done = goals.filter((g) => checkedGoalIds.has(g._id));
  const pending = goals.filter((g) => !checkedGoalIds.has(g._id));

  const agent: Agent | undefined = (details.agents as Agent[]).find((a) => a.phoneNumber === sender);
  const motivationLine = agent ? `Agent motivation: ${agent.motivation}/100` : "No agent assigned yet.";

  const lines = [
    `${island.name} — level ${island.islandLevel}, ${island.xp} XP`,
    `Today: ${done.length}/${goals.length} goals done`,
  ];
  if (done.length) lines.push(`  ✓ ${done.map((g) => g.text).join(", ")}`);
  if (pending.length) lines.push(`  ○ ${pending.map((g) => g.text).join(", ")}`);
  lines.push(motivationLine);

  await space.send(text(lines.join("\n")));
}

// ── Main loop ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const app = await Spectrum({
    projectId: PROJECT_ID!,
    projectSecret: PROJECT_SECRET!,
    providers: [imessage.config()],
  });

  console.log("\n🌿 Island Habits — full Photon router");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`CONVEX_URL=${CONVEX_URL}`);
  console.log(`Listening for commands: /start /help /goals /add /drop /edit /status\n`);

  for await (const [space, message] of app.messages) {
    const content = message.content[0];
    if (!content || content.type !== "plain_text") continue;
    const body = content.text;
    const time = message.timestamp.toLocaleTimeString();
    const cmd = parseCommand(body);

    // Resolve the user identity up front so every log line tags the response.
    // senderAddress may return null for malformed IDs; fall back to raw sender.
    const resolvedSender = senderAddress(message);
    const senderLabel = resolvedSender ?? `raw:${message.sender.id}`;
    const kind = resolvedSender?.startsWith("+") ? "phone" : resolvedSender ? "email" : "unknown";

    console.log(
      `\n┌─ [${time}] space=${space.id}` +
      `\n│  user: ${senderLabel} (${kind})` +
      `\n│  msg:  ${JSON.stringify(body)}` +
      `\n│  cmd:  ${cmd.kind}`,
    );

    if (cmd.kind === "none") {
      console.log(`└─ (no command matched — ignored)`);
      continue;
    }

    if (cmd.kind === "start") {
      await handleStart(space, message);
      console.log(`└─ handled /start for ${senderLabel}`);
      continue;
    }
    if (cmd.kind === "help") {
      await space.send(text(HELP_TEXT));
      console.log(`└─ sent help to ${senderLabel}`);
      continue;
    }

    // All remaining commands need a resolvable sender address.
    if (!resolvedSender) {
      await space.send(text("I couldn't read your phone/email from this message."));
      console.log(`└─ ⚠️  could not resolve sender address for ${message.sender.id}`);
      continue;
    }

    try {
      switch (cmd.kind) {
        case "goals":  await handleGoals(space, resolvedSender); break;
        case "add":    await handleAdd(space, resolvedSender, cmd.text); break;
        case "drop":   await handleDrop(space, resolvedSender, cmd.index); break;
        case "edit":   await handleEdit(space, resolvedSender, cmd.index, cmd.text); break;
        case "status": await handleStatus(space, resolvedSender); break;
      }
      console.log(`└─ ✅ /${cmd.kind} for ${senderLabel}`);
    } catch (err: any) {
      console.error(`└─ ❌ /${cmd.kind} for ${senderLabel} failed: ${err?.message ?? err}`);
      await space.send(text("Something went wrong. Try again in a moment."));
    }
  }
}

main().catch((err) => {
  console.error("❌ run-photon-full crashed:", err);
  process.exit(1);
});
