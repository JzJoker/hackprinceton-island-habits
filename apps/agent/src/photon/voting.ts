import { sendToGroup, makeIdempotencyKey, type SpectrumApp } from "./send.js";
import { getIsland, getUser } from "../state/mock-store.js";

export type Vote = "yes" | "no";

type Proposal = {
  proposalId: string;
  islandId: string;
  question: string;
  votes: Map<string, Vote>;
  closed: boolean;
};

const proposals = new Map<string, Proposal>();

export function parseVote(body: string): Vote | null {
  const t = body.trim().toLowerCase();
  if (["y", "yes", "yeah", "yep", "👍"].includes(t)) return "yes";
  if (["n", "no", "nope", "nah", "👎"].includes(t)) return "no";
  return null;
}

export async function proposeVote(
  app: SpectrumApp,
  islandId: string,
  proposalId: string,
  question: string,
): Promise<boolean> {
  const island = getIsland(islandId);
  if (!island) return false;

  proposals.set(proposalId, {
    proposalId,
    islandId,
    question,
    votes: new Map(),
    closed: false,
  });

  const memberPhones = island.memberUserIds
    .map(getUser)
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
    .map((u) => u.phone);

  const body = `Vote: ${question}\nReply "yes" or "no". Majority wins.`;
  const key = makeIdempotencyKey(["vote-prop", proposalId]);
  return sendToGroup(app, memberPhones, body, key);
}

export function recordVote(proposalId: string, userId: string, vote: Vote): boolean {
  const p = proposals.get(proposalId);
  if (!p || p.closed) return false;
  p.votes.set(userId, vote);
  return true;
}

export function tallyVotes(proposalId: string): { yes: number; no: number; result: Vote | "tie" | null } {
  const p = proposals.get(proposalId);
  if (!p) return { yes: 0, no: 0, result: null };

  let yes = 0, no = 0;
  for (const v of p.votes.values()) {
    if (v === "yes") yes += 1;
    else no += 1;
  }
  const result = yes === no ? "tie" : yes > no ? "yes" : "no";
  return { yes, no, result };
}

export function closeProposal(proposalId: string): void {
  const p = proposals.get(proposalId);
  if (p) p.closed = true;
}
