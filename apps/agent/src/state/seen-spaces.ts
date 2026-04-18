const onboarded = new Set<string>();

export function hasOnboarded(spaceId: string): boolean {
  return onboarded.has(spaceId);
}

export function markOnboarded(spaceId: string): void {
  onboarded.add(spaceId);
}

export function resetOnboarded(spaceId: string): void {
  onboarded.delete(spaceId);
}
