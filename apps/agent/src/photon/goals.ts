import { sendToGroup, makeIdempotencyKey, type SpectrumApp } from "./send.js";
import {
  getAgentForUser,
  getIsland,
  getUser,
} from "../state/mock-store.js";
import { generateGoalChangeMessage, type GoalChangeKind } from "../llm/stub.js";

const SHOULD_CHATTER_PROBABILITY = 0.6;

export async function notifyGoalChange(
  app: SpectrumApp,
  userId: string,
  islandId: string,
  kind: GoalChangeKind,
  goalText: string,
  options: { force?: boolean } = {},
): Promise<boolean> {
  const agent = getAgentForUser(userId, islandId);
  const user = getUser(userId);
  const island = getIsland(islandId);
  if (!agent || !user || !island) return false;

  if (!options.force && Math.random() > SHOULD_CHATTER_PROBABILITY) return false;

  const body = generateGoalChangeMessage(agent.personality, user.displayName, kind, goalText);
  const memberPhones = island.memberUserIds
    .map(getUser)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => u.phone);

  const key = makeIdempotencyKey(["goalchg", userId, islandId, kind, goalText]);
  return sendToGroup(app, memberPhones, body, key);
}
