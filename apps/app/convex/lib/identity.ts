const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function normalizeParticipantId(raw: string): string {
  const value = raw.trim();
  if (!value) throw new Error("Participant identifier is required");

  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  const email = value.toLowerCase();
  if (EMAIL_RE.test(email)) {
    return email;
  }

  throw new Error(`Invalid participant identifier: ${raw}`);
}

export function tryNormalizeParticipantId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    return normalizeParticipantId(raw);
  } catch {
    return null;
  }
}

export function normalizeParticipantList(values: string[]): string[] {
  const out = new Set<string>();
  for (const value of values) {
    const normalized = normalizeParticipantId(value);
    out.add(normalized);
  }
  return [...out];
}
