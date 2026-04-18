import { sendDM, makeIdempotencyKey, type SpectrumApp } from "./send.js";
import {
  getAgentForUser,
  getAgentsForIsland,
  getGoalsForUser,
  getUser,
} from "../state/mock-store.js";
import { generateMorningReminder } from "../llm/stub.js";

export function pickReminderVariant(variants: string[]): string {
  if (variants.length === 0) return "Time to check in.";
  return variants[Math.floor(Math.random() * variants.length)]!;
}

export async function sendMorningReminder(
  app: SpectrumApp,
  userId: string,
  islandId: string,
): Promise<boolean> {
  const user = getUser(userId);
  const agent = getAgentForUser(userId, islandId);
  const goals = getGoalsForUser(userId, islandId);
  if (!user || !agent || goals.length === 0) return false;

  const goalText = goals[0]!.text;
  const useFresh = agent.motivation < 30;
  const body = useFresh
    ? generateMorningReminder(agent.personality, goalText)
    : pickReminderVariant(agent.reminderVariants);

  const key = makeIdempotencyKey(["reminder", userId, islandId]);
  return sendDM(app, user.phone, body, key);
}

export async function sendAllMorningReminders(app: SpectrumApp, islandId: string): Promise<number> {
  const agents = getAgentsForIsland(islandId);
  let sent = 0;
  for (const agent of agents) {
    const ok = await sendMorningReminder(app, agent.userId, islandId);
    if (ok) sent += 1;
  }
  return sent;
}
