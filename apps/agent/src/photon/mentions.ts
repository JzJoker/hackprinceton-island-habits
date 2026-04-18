export const AGENT_NAME = "isla";

const NAME_PATTERN = new RegExp(`(?:^|[^a-z])@?${AGENT_NAME}\\b`, "i");

export function isTagged(text: string): boolean {
  return NAME_PATTERN.test(text);
}

export function isStartCommand(text: string): boolean {
  return text.trim().toLowerCase() === "/start";
}
