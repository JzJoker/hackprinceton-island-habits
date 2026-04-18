import { sendToGroup, makeIdempotencyKey, type SpectrumApp } from "./send.js";
import {
  fakeWeekStats,
  getIsland,
  getUser,
} from "../state/mock-store.js";
import { generateWeeklySummary } from "../llm/stub.js";

function isoWeek(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function sendWeeklySummary(app: SpectrumApp, islandId: string): Promise<boolean> {
  const island = getIsland(islandId);
  if (!island) return false;

  const stats = fakeWeekStats(islandId);
  const body = generateWeeklySummary(island.name, stats);

  const memberPhones = island.memberUserIds
    .map(getUser)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => u.phone);

  const key = makeIdempotencyKey(["summary", islandId, isoWeek()]);
  return sendToGroup(app, memberPhones, body, key);
}
