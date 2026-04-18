import { text } from "spectrum-ts";
import { hasOnboarded, markOnboarded } from "../state/seen-spaces.js";
import { isStartCommand } from "./mentions.js";
import type { PhotonApp } from "./app.js";

const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:3000";
const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
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

    const code = generateRoomCode();
    markOnboarded(space.id);
    const joinUrl = `${APP_BASE_URL}/onboarding?code=${code}`;
    await space.send(
      text(`Island Habits started.\n\nRoom Code: ${code}\nJoin: ${joinUrl}`),
    );
    console.log(`[/start] space=${space.id} code=${code}`);
  }
}

export type { PhotonApp };
