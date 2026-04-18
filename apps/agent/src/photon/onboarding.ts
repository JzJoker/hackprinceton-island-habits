import { text } from "spectrum-ts";

const ONBOARDING_LINK = "https://youtube.com";

const WELCOME_MESSAGE =
  "\u{1F44B} I'm Isla. I'm going to build you all a living island \u2014 your world gets better or worse based on how your week goes. First, check your DMs, I need to meet each of you before I can build the island.";

const CHARACTER_PROMPT = `Start your character here: ${ONBOARDING_LINK}`;

type Sendable = { send: (content: ReturnType<typeof text>) => Promise<unknown> };

export async function sendOnboarding(space: Sendable): Promise<void> {
  await space.send(text(WELCOME_MESSAGE));
  await space.send(text(CHARACTER_PROMPT));
}
