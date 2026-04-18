import { sendToGroup, makeIdempotencyKey, type SpectrumApp } from "./send.js";
import { getIsland, getUser } from "../state/mock-store.js";
import { generateMonumentDescription } from "../llm/stub.js";

export const MONUMENT_INTERVAL = 5;

export function isMonumentLevel(level: number): boolean {
  return level > 0 && level % MONUMENT_INTERVAL === 0;
}

export async function unlockMonument(
  app: SpectrumApp,
  islandId: string,
  level: number,
): Promise<boolean> {
  if (!isMonumentLevel(level)) return false;

  const island = getIsland(islandId);
  if (!island) return false;

  const body = generateMonumentDescription(island.name, level);
  const memberPhones = island.memberUserIds
    .map(getUser)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => u.phone);

  const key = makeIdempotencyKey(["monument", islandId, level]);
  return sendToGroup(app, memberPhones, body, key);
}
