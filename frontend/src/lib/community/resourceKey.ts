/**
 * Stable, deterministic key for a resource based on its name and address.
 * Used to attach community tips to live-fetched resources that lack persistent IDs.
 */
export function computeResourceKey(name: string, address?: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 80);
  return normalize(name) + '|' + normalize(address ?? '');
}
