import { sendToGroup, makeIdempotencyKey, type SpectrumApp } from "./send.js";
import { getIsland, getUser } from "../state/mock-store.js";
import { generateAscensionNarrative } from "../llm/stub.js";
import { proposeVote, tallyVotes } from "./voting.js";

export const ASCENSION_LEVEL = 10;

export async function proposeAscension(
  app: SpectrumApp,
  islandId: string,
  proposalId: string,
): Promise<boolean> {
  const island = getIsland(islandId);
  if (!island) return false;
  if (island.level < ASCENSION_LEVEL) return false;

  return proposeVote(
    app,
    islandId,
    proposalId,
    `Ascend "${island.name}" to a new tier? The current island will become a permanent monument.`,
  );
}

export async function executeAscension(
  app: SpectrumApp,
  islandId: string,
  proposalId: string,
  daysLived: number,
  totalGoals: number,
): Promise<boolean> {
  const tally = tallyVotes(proposalId);
  if (tally.result !== "yes") return false;

  const island = getIsland(islandId);
  if (!island) return false;

  const body = generateAscensionNarrative(island.name, daysLived, totalGoals);
  const memberPhones = island.memberUserIds
    .map(getUser)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => u.phone);

  const key = makeIdempotencyKey(["ascension", islandId, proposalId]);
  return sendToGroup(app, memberPhones, body, key);
}
