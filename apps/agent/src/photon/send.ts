import { text } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

export type SpectrumApp = Awaited<ReturnType<typeof import("./app.js")["createApp"]>>;

const sentKeys = new Set<string>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function makeIdempotencyKey(parts: (string | number)[]): string {
  return [...parts, todayKey()].join("|");
}

export async function sendDM(app: SpectrumApp, phone: string, body: string, idempotencyKey?: string): Promise<boolean> {
  if (idempotencyKey && sentKeys.has(idempotencyKey)) return false;

  const im = imessage(app);
  const user = await im.user(phone);
  const space = await im.space(user);
  await space.send(text(body));

  if (idempotencyKey) sentKeys.add(idempotencyKey);
  return true;
}

export async function sendToGroup(app: SpectrumApp, phones: string[], body: string, idempotencyKey?: string): Promise<boolean> {
  if (idempotencyKey && sentKeys.has(idempotencyKey)) return false;

  const im = imessage(app);
  const users = await Promise.all(phones.map((p) => im.user(p)));
  const group = await im.space(...(users as [any, ...any[]]));
  await group.send(text(body));

  if (idempotencyKey) sentKeys.add(idempotencyKey);
  return true;
}

export function resetIdempotency(): void {
  sentKeys.clear();
}
