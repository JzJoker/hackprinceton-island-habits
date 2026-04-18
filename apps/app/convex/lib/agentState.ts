export function defaultMovementState(seedFrom: string, now = Date.now()) {
  let hash = 2166136261;
  for (let i = 0; i < seedFrom.length; i += 1) {
    hash ^= seedFrom.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const seed = (hash >>> 0) % 100_000;
  return {
    mode: "wander" as const,
    seed,
    phase: (seed % 360) / 360,
    updatedAt: now,
  };
}

export function defaultActivity() {
  return "idle";
}
