import { sendToGroup, makeIdempotencyKey, type SpectrumApp } from "./send.js";
import {
  getAgentForUser,
  getIsland,
  getUser,
} from "../state/mock-store.js";
import { generateLowMotivationMessage } from "../llm/stub.js";

export const LOW_MOTIVATION_THRESHOLD = 30;

export async function maybeBroadcastLowMotivation(
  app: SpectrumApp,
  userId: string,
  islandId: string,
): Promise<boolean> {
  const agent = getAgentForUser(userId, islandId);
  const user = getUser(userId);
  const island = getIsland(islandId);
  if (!agent || !user || !island) return false;
  if (agent.motivation >= LOW_MOTIVATION_THRESHOLD) return false;

  const body = generateLowMotivationMessage(agent.personality, user.displayName);
  const memberPhones = island.memberUserIds
    .map(getUser)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => u.phone);

  const key = makeIdempotencyKey(["lowmot", userId, islandId, agent.motivation]);
  return sendToGroup(app, memberPhones, body, key);
}
