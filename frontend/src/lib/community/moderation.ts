const EMERGENCY_PATTERNS = [
  /\btrapped\b/i,
  /\bcall 911\b/i,
  /\bheart attack\b/i,
  /\boverdos/i,
  /\bshooting\b/i,
  /\bstabbing\b/i,
  /\bon fire\b/i,
  /\bsuicid/i,
];

const URL_PATTERN = /https?:\/\/|www\./i;
const PII_PATTERN =
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const HIGH_CAPS_PATTERN = /[A-Z]{6,}/;

export type AutoCheckResult =
  | { action: 'reject'; reason: string }
  | { action: 'flag' }
  | { action: 'ok' };

export function autoCheck(body: string): AutoCheckResult {
  if (URL_PATTERN.test(body)) {
    return { action: 'reject', reason: 'Contains URL' };
  }
  for (const p of EMERGENCY_PATTERNS) {
    if (p.test(body)) {
      return { action: 'reject', reason: 'Emergency language detected' };
    }
  }
  if (PII_PATTERN.test(body) || HIGH_CAPS_PATTERN.test(body)) {
    return { action: 'flag' };
  }
  return { action: 'ok' };
}

export function isAdminAuthorized(authHeader: string | null): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return authHeader === `Bearer ${token}`;
}
