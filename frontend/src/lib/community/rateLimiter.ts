interface Window {
  count: number;
  start: number;
}

const hourly = new Map<string, Window>();

/** Returns true if the request is allowed, false if rate-limited. */
export function checkRateLimit(hash: string, maxPerHour = 3): boolean {
  const now = Date.now();
  const w = hourly.get(hash) ?? { count: 0, start: now };
  if (now - w.start > 3_600_000) {
    w.count = 0;
    w.start = now;
  }
  if (w.count >= maxPerHour) return false;
  w.count++;
  hourly.set(hash, w);
  return true;
}
