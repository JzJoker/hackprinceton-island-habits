import { text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { sendDM, makeIdempotencyKey, type SpectrumApp } from "./send.js";

const APP_BASE = process.env.APP_BASE_URL ?? "https://island-of-habits.example/join";

export function buildInviteLink(islandId: string, inviteToken: string): string {
  return `${APP_BASE}?island=${encodeURIComponent(islandId)}&t=${encodeURIComponent(inviteToken)}`;
}

export async function sendInvite(
  app: SpectrumApp,
  inviteePhone: string,
  inviterName: string,
  islandName: string,
  islandId: string,
  inviteToken: string,
): Promise<void> {
  const link = buildInviteLink(islandId, inviteToken);
  const body = `${inviterName} invited you to "${islandName}" on Island of Habits. Tap to join: ${link}`;
  const key = makeIdempotencyKey(["invite", inviteePhone, islandId]);
  await sendDM(app, inviteePhone, body, key);
}

export async function createIslandGroup(
  app: SpectrumApp,
  memberPhones: string[],
  islandName: string,
): Promise<{ spaceId: string }> {
  if (memberPhones.length < 2) {
    throw new Error("Group requires at least 2 members");
  }

  const im = imessage(app);
  const users = await Promise.all(memberPhones.map((p) => im.user(p)));
  const group = await im.space(...(users as [any, ...any[]]));

  await group.send(text(
    `Welcome to "${islandName}"! I'm Isla. Send /start to begin.`,
  ));

  return { spaceId: group.id };
}
