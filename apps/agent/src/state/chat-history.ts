type Entry = { who: string; text: string; at: number };

const MAX_PER_SPACE = 20;
const history = new Map<string, Entry[]>();

export function appendMessage(spaceId: string, who: string, text: string): void {
  if (!text?.trim()) return;
  const list = history.get(spaceId) ?? [];
  list.push({ who, text: text.trim(), at: Date.now() });
  if (list.length > MAX_PER_SPACE) list.splice(0, list.length - MAX_PER_SPACE);
  history.set(spaceId, list);
}

export function getHistory(spaceId: string): Entry[] {
  return history.get(spaceId) ?? [];
}
