let owner: string | null = null;

export function claimClock(id: string): boolean {
  if (owner == null) owner = id;
  return owner === id;
}

export function releaseClock(id: string) {
  if (owner === id) owner = null;
}
