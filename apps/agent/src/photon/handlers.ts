import { text } from "spectrum-ts";
import { ConvexHttpClient } from "convex/browser";
import { hasOnboarded, markOnboarded } from "../state/seen-spaces.js";
import { isStartCommand } from "./mentions.js";
import type { PhotonApp } from "./app.js";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const BOT_PHONE = (process.env.BOT_PHONE ?? "+14155952874").replace(/\D/g, "");
const CONVEX_URL = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;

function toE164Like(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

function collectPhones(space: any, message: any): string[] {
  const raw: unknown[] = [];
  const participantArrays = [
    space?.participants,
    space?.members,
    space?.users,
    message?.participants,
    message?.members,
  ];
  for (const arr of participantArrays) {
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      raw.push(item?.phoneNumber, item?.address, item?.id, item);
    }
  }
  raw.push(message?.sender?.phoneNumber, message?.sender?.address, message?.sender?.id);

  const phones = Array.from(
    new Set(
      raw
        .map(toE164Like)
        .filter((p): p is string => Boolean(p))
        .filter((p) => p.replace(/\D/g, "") !== BOT_PHONE)
    )
  );
  return phones;
}

export async function runMessageLoop(app: PhotonApp): Promise<void> {
  for await (const [space, message] of app.messages) {
    const content = message.content[0];
    if (!content || content.type !== "plain_text") continue;

    const body = content.text;
    const time = message.timestamp.toLocaleTimeString();
    console.log(`[${time}] space=${space.id} from=${message.sender.id}: ${body}`);

    if (!isStartCommand(body)) continue;

    if (hasOnboarded(space.id)) {
      await space.send(text("The start process has already been initiated."));
      continue;
    }

    if (!CONVEX_URL) {
      await space.send(text("Missing CONVEX_URL in agent env. Cannot create room code."));
      continue;
    }

    try {
      const phoneNumbers = collectPhones(space as any, message as any);
      if (!phoneNumbers.length) {
        await space.send(
          text("Couldn't detect group member phone numbers. Make sure this is a group iMessage thread.")
        );
        continue;
      }

      const convex = new ConvexHttpClient(CONVEX_URL);
      const result = await (convex as any).mutation("islands:createIsland", {
        phoneNumbers,
      });
      const code = result.code as string;
      const joinUrl = `${APP_BASE_URL}/onboarding?code=${code}`;

      markOnboarded(space.id);
      await space.send(
        text(`Island Habits started.\n\nRoom Code: ${code}\nJoin: ${joinUrl}`),
      );
      console.log(`[/start] space=${space.id} code=${code} phones=${phoneNumbers.join(",")}`);
    } catch (err: any) {
      console.error(`[/start] failed:`, err);
      await space.send(text("Failed to create room code. Try /start again."));
    }
  }
}

export type { PhotonApp };
