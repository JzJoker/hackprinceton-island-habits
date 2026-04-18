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

function isValidEmail(value: unknown): string | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  // Check for iCloud, Apple, and other common email formats
  if (/^[^\s@]+@(icloud\.com|me\.com|apple\.com|mail\.com)$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function collectParticipants(space: any, message: any): string[] {
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
      raw.push(item?.phoneNumber, item?.address, item?.email, item?.id, item);
    }
  }
  raw.push(message?.sender?.phoneNumber, message?.sender?.address, message?.sender?.email, message?.sender?.id);

  const participants = Array.from(
    new Set(
      raw
        .map((val) => toE164Like(val) || isValidEmail(val))
        .filter((p): p is string => Boolean(p))
        .filter((p) => {
          // Filter out bot phone number
          if (p.startsWith("+")) {
            return p.replace(/\D/g, "") !== BOT_PHONE;
          }
          // Keep all valid emails
          return true;
        })
    )
  );
  return participants;
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
      const participants = collectParticipants(space as any, message as any);
      if (!participants.length) {
        await space.send(
          text("Couldn't detect group member identifiers. Make sure this is a group iMessage thread with phone numbers or iCloud email addresses.")
        );
        continue;
      }

      const convex = new ConvexHttpClient(CONVEX_URL);
      const result = await (convex as any).mutation("islands:createIsland", {
        phoneNumbers: participants,
      });
      const code = result.code as string;
      const joinUrl = `${APP_BASE_URL}/?code=${code}`;

      markOnboarded(space.id);
      await space.send(
        text(`Island Habits started.\n\nRoom Code: ${code}\nJoin: ${joinUrl}`),
      );
      console.log(`[/start] space=${space.id} code=${code} participants=${participants.join(",")}`);
    } catch (err: any) {
      console.error(`[/start] failed:`, {
        message: err?.message,
        status: err?.status,
        statusText: err?.statusText,
        data: err?.data,
        stack: err?.stack,
        fullError: err
      });
      await space.send(text("Failed to create room code. Try /start again."));
    }
  }
}

export type { PhotonApp };
