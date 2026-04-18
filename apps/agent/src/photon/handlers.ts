import { text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { hasOnboarded, markOnboarded } from "../state/seen-spaces.js";
import { isStartCommand, isTagged } from "./mentions.js";
import { sendOnboarding } from "./onboarding.js";

type SpectrumApp = Awaited<ReturnType<typeof import("./app.js")["createApp"]>>;

export async function runMessageLoop(app: SpectrumApp): Promise<void> {
  for await (const [space, message] of app.messages) {
    const content = message.content[0];
    if (!content || content.type !== "plain_text") continue;

    const body = content.text;
    const spaceView = imessage(space);
    const isGroup = spaceView.type === "group";

    console.log(`[${message.timestamp.toLocaleTimeString()}] ${isGroup ? "group" : "dm"} ${space.id} | ${message.sender.id}: ${body}`);

    if (isStartCommand(body)) {
      if (hasOnboarded(space.id)) {
        await space.send(text("The start process has already been initiated."));
      } else {
        await sendOnboarding(space);
        markOnboarded(space.id);
      }
      continue;
    }

    if (isGroup && !isTagged(body)) {
      continue;
    }

    if (!hasOnboarded(space.id) && isGroup) {
      await space.send(text("Send /start to kick things off."));
      continue;
    }

    await space.send(text(`Heard you: "${body}". (agent logic pending)`));
  }
}
