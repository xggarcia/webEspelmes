const COOLDOWN_MS = 700;
let lastNavAt = 0;

/** Returns true and records the timestamp if enough time has passed. Returns false if still in cooldown. */
export function canNavigate(): boolean {
  const now = Date.now();
  if (now - lastNavAt < COOLDOWN_MS) return false;
  lastNavAt = now;
  return true;
}
